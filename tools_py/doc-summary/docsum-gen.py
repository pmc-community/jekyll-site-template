import os
os.environ["CUDA_VISIBLE_DEVICES"] = ""  # Prevents CUDA from being visible to subprocesses

import multiprocessing as mp
mp.set_start_method("spawn", force=True)  # Ensures safe multiprocessing with PyTorch on Mac

import glob
import torch
from tqdm import tqdm
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
from sentence_transformers import SentenceTransformer
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor, as_completed
import nltk
from nltk.tokenize import sent_tokenize
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import MiniBatchKMeans
import numpy as np
import re
import json
import time

import warnings
warnings.filterwarnings("ignore", message="The sentencepiece tokenizer.*byte fallback.*")

os.environ["TOKENIZERS_PARALLELISM"] = "false"

# --- Language detection ---
from langdetect import detect

# --- NLTK Data Setup ---
from contextlib import redirect_stdout
import sys
import io

from nltk.tokenize import sent_tokenize

nltk_data_path = os.path.join(os.path.expanduser("~"), "nltk_data")
nltk.data.path.append(nltk_data_path)

output_capture = io.StringIO()
with redirect_stdout(output_capture):
    try:
        nltk.download("punkt", download_dir=nltk_data_path, raise_on_error=True, quiet=True)
        nltk.download("punkt_tab", download_dir=nltk_data_path, raise_on_error=True, quiet=True)
        nltk.download("stopwords", download_dir=nltk_data_path, raise_on_error=True, quiet=True)
        nltk.download("averaged_perceptron_tagger", download_dir=nltk_data_path, raise_on_error=True, quiet=True)
    except Exception as e:
        print(f"Error downloading NLTK data: {e}", file=sys.stderr)
        sys.exit(1)
# --- End NLTK Data Setup ---

FOLDER_PATH = "../../doc-raw-contents/"

# --- GLOBAL TUNING PARAMETERS ---
DEFAULT_CPU_WORKERS = 10
DEFAULT_BATCH_SIZE = 8
DEFAULT_PROC_WORKERS = 10

CPU_WORKERS = int(os.environ.get("DOCSUM_CPU_WORKERS", DEFAULT_CPU_WORKERS))
PROC_WORKERS = int(os.environ.get("DOCSUM_PROC_WORKERS", DEFAULT_PROC_WORKERS))
BATCH_SIZE = int(os.environ.get("DOCSUM_BATCH_SIZE", DEFAULT_BATCH_SIZE))

def get_summarizer_model_name(lang_code):
    if lang_code == "en":
        return "google/flan-t5-large"
    else:
        return "csebuetnlp/mT5_multilingual_XLSum"

def get_elaboration_model_name(lang_code):
    return get_summarizer_model_name(lang_code)

def detect_language(text):
    try:
        return detect(text)
    except Exception:
        return "en"

DEVICE = torch.device("cpu") # force cpu for efficient multi proc. currently transformers cannot use gpu in multi-proc

# 512 is the max accepted, but should be set significantly below to leave room for some tokens that may be added automatically
# lower value force larger number of chunks which may be better for condensed texts with multiple contexts described in shorter sentences
MAX_INPUT_TOKENS = 256
MAX_INPUT_TOKENS_LIMITATION = 512

NUM_TOPICS = 10
SENTENCE_CHUNK_SIZE = 10
TOPIC_KEYWORDS_PER_TOPIC = 2
TOP_KEYWORDS_GLOBAL = 10
MAX_TOPIC_SENTENCE_WORDS = 5

TQDM_NCOLS = 80
TQDM_COLORS = [
    "\033[36m", "\033[35m", "\033[32m", "\033[33m", "\033[34m"
]
TQDM_COLOR_RESET = "\033[0m"
tqdm_color_idx = 0

def get_next_tqdm_color():
    global tqdm_color_idx
    color = TQDM_COLORS[tqdm_color_idx % len(TQDM_COLORS)]
    tqdm_color_idx += 1
    return color

def read_file(path):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    except Exception as e:
        print(f"⚠️ Failed to read {path}: {e}")
        return ""

def load_text_files_parallel(folder_path):
    script_dir = os.path.dirname(os.path.abspath(__file__))
    absolute_folder_path = os.path.join(script_dir, folder_path)
    txt_files = glob.glob(os.path.join(absolute_folder_path, "*.txt"))
    md_files = glob.glob(os.path.join(absolute_folder_path, "*.md"))
    file_paths = txt_files + md_files
    documents = []
    filenames = []
    current_color = get_next_tqdm_color()
    bar_format_str = f"{current_color}{{l_bar}}{{bar}}| {{n_fmt}}/{{total_fmt}} [{{elapsed}}<{{remaining}}, {{rate_fmt}}{{postfix}}]{TQDM_COLOR_RESET}"
    with ThreadPoolExecutor(max_workers=CPU_WORKERS) as executor:
        results = list(tqdm(executor.map(read_file, file_paths),
        total=len(file_paths),
        desc="📂 Loading files...",
        ncols=TQDM_NCOLS,
        bar_format=bar_format_str))
        for i, doc in enumerate(results):
            if doc.strip():
                documents.append(doc)
                filenames.append(os.path.basename(file_paths[i]))
    return documents, filenames

# --- Multiprocess Embedding ---
_sentence_transformer_model = None
SENTENCE_TRANSFORMER_MODEL = "sentence-transformers/LaBSE"

def get_sentence_transformer_model():
    global _sentence_transformer_model
    if _sentence_transformer_model is None:
        _sentence_transformer_model = SentenceTransformer(SENTENCE_TRANSFORMER_MODEL, device="cpu")
    return _sentence_transformer_model

def embed_batch_worker(batch):
    os.environ["CUDA_VISIBLE_DEVICES"] = ""
    model = get_sentence_transformer_model()
    return model.encode(batch, convert_to_tensor=True).cpu()

def embed_texts_mp(texts, batch_size=BATCH_SIZE, workers=PROC_WORKERS):
    batches = [texts[i:i+batch_size] for i in range(0, len(texts), batch_size)]
    results = []
    current_color = get_next_tqdm_color()
    bar_format_str = f"{current_color}{{l_bar}}{{bar}}| {{n_fmt}}/{{total_fmt}} [{{elapsed}}<{{remaining}}, {{rate_fmt}}{{postfix}}]{TQDM_COLOR_RESET}"
    with ProcessPoolExecutor(max_workers=workers) as executor:
        futures = [executor.submit(embed_batch_worker, batch) for batch in batches]
        for f in tqdm(as_completed(futures), total=len(futures), desc="🔢 Embedding (multi-proc)", ncols=TQDM_NCOLS, bar_format=bar_format_str):
            results.append(f.result())
    return torch.cat(results, dim=0)

def detect_main_content(docs, top_k=5):
    if not docs:
        return ""
    embeddings = embed_texts_mp(docs)
    avg_embedding = embeddings.mean(dim=0).cpu()
    scores = torch.matmul(embeddings.cpu(), avg_embedding).cpu()
    top_indices = torch.topk(scores, k=min(top_k, len(docs))).indices
    return " ".join([docs[i] for i in top_indices])

def clean_text_for_summarization(text):
    if not isinstance(text, str):
        return ""
    text = re.sub(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+', ' ', text)
    text = re.sub(r'\b\w+_\w+\b', ' ', text)
    text = re.sub(r'\b[A-Z][a-z]+[A-Z][a-z]+\b', ' ', text)
    text = re.sub(r'(\.{1,})?[/\\](\.{1,})?[a-zA-Z0-9_-]+(\.[a-zA-Z0-9]+)?', ' ', text)
    text = re.sub(r'#{1,6}\s*', ' ', text)
    text = re.sub(r'(\*\*|__)(.*?)\1', r'\2', text)
    text = re.sub(r'(\*|_)(.*?)\1', r'\2', text)
    text = re.sub(r'\[(.*?)\]\((.*?)\)', r'\1', text)
    text = re.sub(r'^\s*[-*+]\s+', ' ', text, flags=re.MULTILINE)
    text = re.sub(r'`{1,3}(.*?)`{1,3}', ' ', text)
    text = re.sub(r'<.*?>', ' ', text)
    text = re.sub(r'\b\d+\b', ' ', text)
    text = re.sub(r'\b\d+([a-zA-Z]{1,3}|[%$€£¥])\b', ' ', text)
    text = re.sub(r'[-=_]{2,}', ' ', text)
    text = re.sub(r'[^\w\s.,?!]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    text = ' '.join([word for word in text.split() if len(word) > 1 or word in ['a', 'i', 'o']])
    return text.strip()

def semantic_chunk_text(text, tokenizer, embedding_model_name, max_tokens=MAX_INPUT_TOKENS, sentence_group_size=5):
    if not text:
        return []

    cleaned_text = clean_text_for_summarization(text)
    if not cleaned_text:
        return []

    all_sentences = sent_tokenize(cleaned_text)
    if not all_sentences:
        return []

    grouped_sentences = [" ".join(all_sentences[i:i + sentence_group_size]) for i in range(0, len(all_sentences), sentence_group_size)]
    if not grouped_sentences:
        return chunk_text(cleaned_text, tokenizer, max_tokens)

    num_clusters = min(len(grouped_sentences), max(1, len(grouped_sentences) // 2))

    embedding_model = SentenceTransformer(embedding_model_name, device="cpu")
    try:
        grouped_sentence_embeddings = embedding_model.encode(grouped_sentences, convert_to_tensor=False)

        if len(np.unique(grouped_sentence_embeddings, axis=0)) == 1:
            print("Info: All sentence group embeddings are identical. Falling back to simple chunking.", file=sys.stderr)
            return chunk_text(cleaned_text, tokenizer, max_tokens)

        with warnings.catch_warnings():
            warnings.simplefilter("ignore", RuntimeWarning)
            kmeans = MiniBatchKMeans(n_clusters=num_clusters, random_state=0, n_init=10, batch_size=256)
            kmeans.fit(grouped_sentence_embeddings)
            labels = kmeans.labels_

        # Group sentence groups into clusters
        clustered_chunks_text = {i: [] for i in range(num_clusters)}
        for i, label in enumerate(labels):
            clustered_chunks_text[label].append(grouped_sentences[i])

        # Merge sentence groups per cluster
        semantic_chunks = [
            " ".join(clustered_chunks_text[i]).strip()
            for i in range(num_clusters)
            if clustered_chunks_text[i]
        ]

        # Refined token-based chunking: sentence-level accumulation under max_tokens
        final_chunks = []
        for s_chunk in semantic_chunks:
            sentences = sent_tokenize(s_chunk)
            current_chunk = []
            current_tokens = 0
            for sent in sentences:
                sent_tokens = len(tokenizer.encode(sent, add_special_tokens=False))
                if current_tokens + sent_tokens > max_tokens:
                    if current_chunk:
                        final_chunks.append(" ".join(current_chunk))
                    current_chunk = [sent]
                    current_tokens = sent_tokens
                else:
                    current_chunk.append(sent)
                    current_tokens += sent_tokens
            if current_chunk:
                final_chunks.append(" ".join(current_chunk))

        return final_chunks

    except Exception as e:
        print(f"⚠️ Semantic chunking failed: {e}. Falling back to simple chunking.", file=sys.stderr)
        return chunk_text(cleaned_text, tokenizer, max_tokens)

def chunk_text(text, tokenizer, max_tokens=MAX_INPUT_TOKENS):
    if not text:
        return []

    sentences = sent_tokenize(text)
    chunks, current_chunk = [], []

    for sent in sentences:
        test_chunk = " ".join(current_chunk + [sent])
        token_count = len(tokenizer.encode(test_chunk, add_special_tokens=True))

        if token_count <= max_tokens:
            current_chunk.append(sent)
        else:
            if current_chunk:
                chunks.append(" ".join(current_chunk).strip())
                current_chunk = []

            # Handle long single sentence
            sent_tokens = tokenizer.encode(sent, add_special_tokens=True)
            if len(sent_tokens) > max_tokens:
                for i in range(0, len(sent_tokens), max_tokens):
                    sub_tokens = sent_tokens[i:i + max_tokens]
                    chunks.append(sub_tokens)  # <-- store as token IDs, not decoded text
            else:
                current_chunk = [sent]

    if current_chunk:
        chunks.append(" ".join(current_chunk).strip())

    # Post-process: Convert token chunks back to text safely
    final_chunks = []
    for chunk in chunks:
        if isinstance(chunk, list):  # token IDs
            text_chunk = tokenizer.decode(chunk, skip_special_tokens=True)
        else:
            text_chunk = chunk
        final_chunks.append(text_chunk.strip())

    return final_chunks

def truncate_text_to_max_tokens(text, tokenizer, max_tokens):
    """
    Aggressively truncate text so that final tokenized length is guaranteed to be ≤ max_tokens,
    even after decoding and re-tokenizing.
    """
    encoded = tokenizer.encode(text, add_special_tokens=True)
    if len(encoded) <= max_tokens:
        return text

    # Truncate and decode
    truncated_tokens = encoded[:max_tokens]
    truncated_text = tokenizer.decode(truncated_tokens, skip_special_tokens=True)

    # Re-encode to confirm token length
    reencoded = tokenizer.encode(truncated_text, add_special_tokens=True)
    while len(reencoded) > max_tokens:
        # Remove ~10 tokens per retry (backoff step)
        truncated_tokens = truncated_tokens[:-10]
        truncated_text = tokenizer.decode(truncated_tokens, skip_special_tokens=True)
        reencoded = tokenizer.encode(truncated_text, add_special_tokens=True)

    return truncated_text

def format_sentences(text):
    # Regex: Split on sentence-ending punctuation only if not part of a URL or abbreviation
    sentence_fragments = re.split(r'(?<=[.!?])\s+(?=[A-Z])', text)

    formatted = []
    buffer = ""

    for frag in sentence_fragments:
        frag = frag.strip()
        if not frag:
            continue

        # Skip if it's likely a URL
        if re.match(r'^https?://\S+$', frag):
            if buffer:
                formatted.append(buffer.strip())
                buffer = ""
            formatted.append(frag)
            continue

        # Capitalize the start
        frag = frag[0].upper() + frag[1:]

        word_count = len(frag.split())

        if word_count <= 1:
            # Append short sentence to buffer
            buffer += " " + frag
        else:
            if buffer:
                frag = buffer.strip() + " " + frag
                buffer = ""
            formatted.append(frag.strip())

    # Add any leftover buffer
    if buffer:
        formatted.append(buffer.strip())

    # Ensure each ends with proper punctuation
    final = []
    for sentence in formatted:
        sentence = sentence.strip()
        if not sentence:
            continue
        if not sentence.endswith((".", "!", "?")):
            sentence += "."
        final.append(sentence)

    return " ".join(final)

def format_file_display_name(file_display_name):
    name = file_display_name
    if name.endswith('.txt'):
        name = name[:-4]
    return name.replace('_', '/')

_summarizer_tokenizer_cache = {}
_summarizer_model_cache = {}

def get_summarizer_model_and_tokenizer(model_name):
    if model_name not in _summarizer_model_cache:
        tokenizer = AutoTokenizer.from_pretrained(model_name, use_fast=False, legacy=True)
        model = AutoModelForSeq2SeqLM.from_pretrained(model_name).to("cpu")
        _summarizer_tokenizer_cache[model_name] = tokenizer
        _summarizer_model_cache[model_name] = model
    return _summarizer_tokenizer_cache[model_name], _summarizer_model_cache[model_name]

def summarize_chunk_worker(args):
    import os
    import torch
    os.environ["CUDA_VISIBLE_DEVICES"] = ""

    chunk, summarizer_model_name, max_input_tokens = args

    tokenizer, model = get_summarizer_model_and_tokenizer(summarizer_model_name)

    # --- Truncate properly using tokenizer.encode to count tokens ---
    input_ids = tokenizer.encode(
        chunk,
        add_special_tokens=True,
        truncation=True,
        max_length=max_input_tokens
    )

    # Double-check and truncate if still too long
    if len(input_ids) > max_input_tokens:
        input_ids = input_ids[:max_input_tokens]

    input_tensor = torch.tensor([input_ids]).to("cpu")

    # Optional: create attention mask (not always necessary)
    attention_mask = torch.ones_like(input_tensor)

    # Generate summary
    summary_ids = model.generate(
        input_tensor,
        attention_mask=attention_mask,
        max_length=200,
        min_length=30,
        num_beams=4,
        repetition_penalty=2.5,
        length_penalty=1.2,
        early_stopping=True,
        no_repeat_ngram_size=3
    )

    summary = tokenizer.decode(summary_ids[0], skip_special_tokens=True)
    return summary

def summarize_chunks_mp(chunks, summarizer_model_name, max_input_tokens=MAX_INPUT_TOKENS, workers=PROC_WORKERS):
    args_list = [(chunk, summarizer_model_name, max_input_tokens) for chunk in chunks]
    results = []
    current_color = get_next_tqdm_color()
    bar_format_str = f"{current_color}{{l_bar}}{{bar}}| {{n_fmt}}/{{total_fmt}} [{{elapsed}}<{{remaining}}, {{rate_fmt}}{{postfix}}]{TQDM_COLOR_RESET}"
    with ProcessPoolExecutor(max_workers=workers) as executor:
        futures = [executor.submit(summarize_chunk_worker, args) for args in args_list]
        for f in tqdm(as_completed(futures), total=len(futures), desc="📝 Summarizing (multi-proc)", ncols=TQDM_NCOLS, bar_format=bar_format_str):
            results.append(f.result())
    return results

_elaboration_tokenizer_cache = {}
_elaboration_model_cache = {}

def get_elaboration_model_and_tokenizer(model_name):
    if model_name not in _elaboration_model_cache:
        tokenizer = AutoTokenizer.from_pretrained(model_name, use_fast=False, legacy=True)
        model = AutoModelForSeq2SeqLM.from_pretrained(model_name).to("cpu")
        _elaboration_tokenizer_cache[model_name] = tokenizer
        _elaboration_model_cache[model_name] = model
    return _elaboration_tokenizer_cache[model_name], _elaboration_model_cache[model_name]

def elaborate_story_summary_worker(args):

    os.environ["CUDA_VISIBLE_DEVICES"] = ""  # Prevent CUDA in subprocess

    draft_summary_text, elaboration_model_name, max_input_tokens, device = args
    elaboration_tokenizer = AutoTokenizer.from_pretrained(elaboration_model_name)
    elaboration_model = AutoModelForSeq2SeqLM.from_pretrained(elaboration_model_name).to(device)

    # ✅ Correct check for T5/Seq2Seq models
    max_input_tokens = min(max_input_tokens, elaboration_tokenizer.model_max_length)

    if not draft_summary_text.strip():
        return ""

    preamble = (
        "Rewrite the following text into a cohesive, well-structured, and logically flowing narrative or story. "
        "The output should read like a natural-language document, not a list of facts or fragmented sentences. "
        "Avoid any jargon or technical placeholders unless they are central to the story. "
        "Ensure grammar and punctuation are correct.\n\n"
        "Input: "
    )
    postamble = "\n\nOutput:"

    overhead_ids = elaboration_tokenizer.encode(preamble + postamble, add_special_tokens=True)
    reserved_tokens_length = len(overhead_ids)
    available_tokens_for_text = max_input_tokens - reserved_tokens_length - 2  # buffer

    if available_tokens_for_text <= 0:
        return "Elaboration prompt too long, no space for text."

    # Truncate input text using tokenizer
    def truncate_text_to_max_tokens(text, tokenizer, max_tokens):
        tokens = tokenizer.encode(text, add_special_tokens=False)
        if len(tokens) > max_tokens:
            tokens = tokens[:max_tokens]
        return tokenizer.decode(tokens, skip_special_tokens=True)

    truncated_text = truncate_text_to_max_tokens(
        draft_summary_text, elaboration_tokenizer, available_tokens_for_text
    )

    prompt = f"{preamble}{truncated_text}{postamble}"
    encoded_prompt = elaboration_tokenizer.encode(prompt, add_special_tokens=True)

    # Final cutoff to enforce tokenizer max length
    if len(encoded_prompt) > max_input_tokens:
        encoded_prompt = encoded_prompt[:max_input_tokens]
        prompt = elaboration_tokenizer.decode(encoded_prompt, skip_special_tokens=True)

    inputs = elaboration_tokenizer(
    prompt,
    return_tensors="pt",
    max_length=max_input_tokens,
    truncation=True,
    padding="max_length"
)

    # Ensure input IDs and attention mask are both clipped to 512 tokens
    inputs["input_ids"] = inputs["input_ids"][:, :MAX_INPUT_TOKENS_LIMITATION]
    if "attention_mask" in inputs:
        inputs["attention_mask"] = inputs["attention_mask"][:, :MAX_INPUT_TOKENS_LIMITATION]

    # Move to device (e.g., CPU or GPU)
    inputs = {k: v.to(device) for k, v in inputs.items()}

    # Generation
    with torch.no_grad():
        elaborated_ids = elaboration_model.generate(
            input_ids=inputs["input_ids"],
            attention_mask=inputs["attention_mask"],
            max_length=700,
            min_length=150,
            num_beams=6,
            repetition_penalty=3.0,
            length_penalty=1.8,
            early_stopping=True,
            no_repeat_ngram_size=3,
            do_sample=True,
            top_k=50,
            top_p=0.95
        )

    elaborated_summary = elaboration_tokenizer.decode(
        elaborated_ids[0],
        skip_special_tokens=True
    )
    elaborated_summary = re.sub(r"<extra_id_\d+>", "", elaborated_summary).strip()

    undesired_phrases_final = [
        "the main points are", "in conclusion", "to summarize", "overall", "this document is about",
        "this text describes", "the following provides information", "further details can be found"
    ]
    for phrase in undesired_phrases_final:
        elaborated_summary = re.sub(r'\b' + re.escape(phrase) + r'\b', '', elaborated_summary, flags=re.IGNORECASE).strip()

    elaborated_summary = re.sub(r'\s+', ' ', elaborated_summary).strip()

    # Optional formatting
    def format_sentences(text):
        return text.strip()

    return format_sentences(elaborated_summary)

def elaborate_story_summary(draft_summary_text, elaboration_model_name, elaboration_tokenizer, elaboration_model):
    args = (draft_summary_text, elaboration_model_name, MAX_INPUT_TOKENS, DEVICE)
    with ProcessPoolExecutor(max_workers=1) as executor:
        future = executor.submit(elaborate_story_summary_worker, args)
        return future.result()

def clean_text_for_keywords(text):
    text = re.sub(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+', '', text)
    text = re.sub(r'\b\w+_\w+\b', '', text)
    text = re.sub(r'\b[A-Z][a-z]+[A-Z][a-z]+\b', '', text)
    text = re.sub(r'(\.{1,})?[/\\](\.{1,})?[a-zA-Z0-9_-]+(\.[a-zA-Z0-9]+)?', '', text)
    text = re.sub(r'\[.*?\]|\(.*?\)', '', text)
    text = re.sub(r'<.*?>', '', text)
    text = re.sub(r'\b\d+\b', '', text)
    text = re.sub(r'[^\w\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    text = text.lower()
    return text

def extract_keywords_from_text(text, embedding_model_name, top_n=5, min_ngram=1, max_ngram=3):
    embedding_model = SentenceTransformer(embedding_model_name, device="cpu")
    if not text:
        return []
    cleaned_text = clean_text_for_keywords(text)
    if not cleaned_text:
        return []
    try:
        stopwords = set(nltk.corpus.stopwords.words('english'))
    except LookupError:
        print("Warning: NLTK stopwords not found. Keyword extraction might be less effective.", file=sys.stderr)
        stopwords = set()
    vectorizer = TfidfVectorizer(
        ngram_range=(min_ngram, max_ngram),
        stop_words=list(stopwords),
        min_df=1,
    )
    try:
        tfidf_matrix = vectorizer.fit_transform([cleaned_text])
    except ValueError as e:
        print(f"Warning: TF-IDF vectorization failed for cleaned text ({e}). Skipping keyword extraction for this text.", file=sys.stderr)
        return []
    feature_names = vectorizer.get_feature_names_out()
    if len(feature_names) == 0:
        return []
    tfidf_scores = tfidf_matrix.sum(axis=0).A1
    sorted_indices = tfidf_scores.argsort()[::-1]
    candidate_phrases = [feature_names[i] for i in sorted_indices if tfidf_scores[i] > 0]
    if not candidate_phrases:
        return []
    filtered_candidates = []
    for phrase in candidate_phrases:
        if not (2 < len(phrase) < 50):
            continue
        if not re.search(r'[a-z]', phrase):
            continue
        if re.fullmatch(r'[\d\W_]+', phrase):
            continue
        if re.search(r'^\s*[-*#`]+\s*$', phrase) or re.fullmatch(r'\W+', phrase):
            continue
        if len(phrase.split()) > max_ngram:
            continue
        filtered_candidates.append(phrase)
    candidates_for_embedding = filtered_candidates[:min(100, len(filtered_candidates))]
    if not candidates_for_embedding:
        return []
    try:
        phrase_embeddings = embedding_model.encode(candidates_for_embedding, convert_to_tensor=True).cpu()
        text_embedding = embedding_model.encode(cleaned_text, convert_to_tensor=True).cpu()
        if text_embedding.ndim == 1:
            text_embedding = text_embedding.unsqueeze(0)
        if phrase_embeddings.ndim == 1:
            phrase_embeddings = phrase_embeddings.unsqueeze(0)
        similarities = torch.cosine_similarity(text_embedding, phrase_embeddings).cpu()
        top_indices = torch.topk(similarities, k=min(top_n, len(candidates_for_embedding))).indices
        initial_top_keywords = [candidates_for_embedding[i] for i in top_indices]
        final_keywords = []
        seen_lower = set()
        for kw in initial_top_keywords:
            kw_lower = kw.lower()
            if kw_lower not in seen_lower:
                final_keywords.append(kw)
                seen_lower.add(kw_lower)
        return final_keywords[:top_n]
    except Exception as e:
        print(f"Warning: Could not extract keywords using embeddings for the text: {e}. Falling back to TF-IDF top terms.", file=sys.stderr)
        return [f for f in filtered_candidates if re.search(r'[a-z]', f) and len(f) > 2 and not re.fullmatch(r'\W+', f)][:top_n]

def contains_verb(phrase):
    tokens = nltk.word_tokenize(phrase)
    tags = nltk.pos_tag(tokens)
    return any(tag.startswith('VB') for word, tag in tags)

def filter_keywords(keywords):
    """Remove repetitive or nonsensical keywords."""
    filtered_keywords = []
    seen = set()
    for keyword in keywords:
        # Remove duplicates
        if keyword.lower() in seen:
            continue
        seen.add(keyword.lower())
        # Remove keywords with excessive repetition
        if contains_excessive_repetition(keyword, min_word_repeats=2, min_ngram_repeats=2, ngram_size=2):
            continue
        # Remove overly generic keywords
        if keyword.lower() in ["general", "concept", "miscellaneous"]:
            continue
        filtered_keywords.append(keyword)
    return filtered_keywords

from collections import Counter
def contains_excessive_repetition(phrase, min_word_repeats=2, min_ngram_repeats=2, ngram_size=2):
    """
    Checks for excessive word or ngram repetition within a phrase.
    - min_word_repeats: If a single word repeats this many times, it's excessive.
    - min_ngram_repeats: If an ngram repeats this many times, it's excessive.
    - ngram_size: The size of ngrams to check (e.g., 2 for bigrams).
    """
    words = phrase.lower().split()
    if not words:
        return False

    # Check for single word repetition
    word_counts = Counter(words)
    if any(count >= min_word_repeats for word, count in word_counts.items()):
        return True

    # Check for ngram repetition
    ngrams = [tuple(words[i:i + ngram_size]) for i in range(len(words) - ngram_size + 1)]
    ngram_counts = Counter(ngrams)
    if any(count >= min_ngram_repeats for ngram, count in ngram_counts.items()):
        return True

    return False

    """Heuristic check for a clean, brief noun-phrase-like output."""
    if not phrase:
        return False

    # 1. Truncate to ensure length
    phrase = " ".join(phrase.split()[:max_words]).strip()
    if not phrase:
        return False

    # 2. Reject if phrase contains disallowed filler words or patterns
    disallowed_patterns = r"\b(nevertheless|however|believe|this|the|topic|concept|shall|may|violates|provided|includes|products|modifications|revised|changes|updates|language services|services services)\b"
    if re.search(disallowed_patterns, phrase, re.IGNORECASE):
        return False

    # 3. Reject if phrase contains excessive repetition
    if contains_excessive_repetition(phrase, min_word_repeats=2, min_ngram_repeats=2, ngram_size=2):
        return False

    # 4. Reject if phrase contains verbs
    if contains_verb(phrase):
        return False

    # 5. Reject if phrase is overly generic
    generic_phrases = ["general concept", "uncategorized", "miscellaneous"]
    if phrase.lower() in generic_phrases:
        return False

    return True

def reformulate_topic_sentence_worker(args):
    os.environ["CUDA_VISIBLE_DEVICES"] = ""  # Force CPU in subprocess

    keywords, cluster_text_sample, elaboration_model_name, max_words = args

    if not keywords and not cluster_text_sample:
        return "General concept"

    # Filter keywords
    keywords = filter_keywords(keywords)
    return ", ".join(keywords)

def reformulate_topic_sentence_mp(topic_args_list, workers=DEFAULT_PROC_WORKERS):
    results = [None] * len(topic_args_list)
    with ProcessPoolExecutor(max_workers=workers) as executor:
        futures = {executor.submit(reformulate_topic_sentence_worker, args): idx for idx, args in enumerate(topic_args_list)}
        for f in tqdm(as_completed(futures), total=len(futures), desc="🧵 Reformulating topics (multi-proc)", ncols=TQDM_NCOLS):
            idx = futures[f]
            results[idx] = f.result()
    return results

def reformulate_topic_sentence(keywords, cluster_text_sample, elaboration_model, elaboration_tokenizer, max_words=MAX_TOPIC_SENTENCE_WORDS):
    args = (keywords, cluster_text_sample, elaboration_model.name_or_path, max_words)
    with ProcessPoolExecutor(max_workers=1) as executor:
        future = executor.submit(reformulate_topic_sentence_worker, args)
        return future.result()

def summarize_documentation(folder_path):
    print("📖 Reading documentation...")
    docs, filenames = load_text_files_parallel(folder_path)
    if not docs:
        raise RuntimeError(f"No valid documents found in '{folder_path}'. Please check the path and file contents.")
    print("🔎 Detecting main content...")
    global_embedding_model = SentenceTransformer(SENTENCE_TRANSFORMER_MODEL, device="cpu")
    combined_text = detect_main_content(docs)
    if not combined_text:
        raise RuntimeError("Could not detect main content from documents. This might indicate empty documents or an issue with content detection.")
    lang_code = detect_language(combined_text)
    print(f"🌐 Detected language: {lang_code}")
    summarizer_model_name = get_summarizer_model_name(lang_code)
    elaboration_model_name = get_elaboration_model_name(lang_code)
    print(f"🧠 Using summarizer: {summarizer_model_name}")
    print(f"🧠 Using elaboration model: {elaboration_model_name}")
    summarizer_tokenizer = AutoTokenizer.from_pretrained(summarizer_model_name, use_fast=False, legacy=True)
    elaboration_tokenizer = AutoTokenizer.from_pretrained(elaboration_model_name, use_fast=False, legacy=True)
    class DummyModel:
        def __init__(self, name_or_path):
            self.name_or_path = name_or_path
    elaboration_model_dummy = DummyModel(elaboration_model_name)
    print("🪓 Chunking content (semantically)...")
    chunks = semantic_chunk_text(combined_text, summarizer_tokenizer, SENTENCE_TRANSFORMER_MODEL, MAX_INPUT_TOKENS, SENTENCE_CHUNK_SIZE)
    if not chunks:
        raise RuntimeError("Could not chunk the content. The combined text might be too short or the chunking logic encountered an issue.")
    print("⚙️ Running initial summarizer (multi-process)...")
    summaries = summarize_chunks_mp(chunks, summarizer_model_name, MAX_INPUT_TOKENS, PROC_WORKERS)
    chunk_sources = []
    for chunk in chunks:
        chunk_files = []
        for i, doc in enumerate(docs):
            if chunk[:50] in doc or chunk in doc or any(sent in doc for sent in sent_tokenize(chunk)[:2]):
                chunk_files.append(format_file_display_name(filenames[i]))
        if not chunk_files:
            chunk_files = filenames
        chunk_sources.append(chunk_files)
    partial_summaries = summaries
    if not partial_summaries:
        raise RuntimeError("No partial summaries were generated. This might indicate an issue with the summarizer model or input chunks.")
    draft_summary = " ".join(partial_summaries)
    print("✨ Elaborating story summary...")
    final_story_summary = elaborate_story_summary(
        draft_summary,
        elaboration_model_name,
        elaboration_tokenizer,
        elaboration_model_dummy
    )
    if (
        not final_story_summary.strip()
        or final_story_summary.lower().startswith("rewrite the following text")
        or final_story_summary.lower().startswith("based on these keywords")
    ):
        print("Warning: Elaboration produced an empty summary or prompt. Falling back to the raw combined summary.", file=sys.stderr)
        final_story_summary = re.sub(r"<extra_id_\d+>", "", draft_summary).strip()
    print("🔑 Extracting top global keywords...")
    global_keywords = extract_keywords_from_text(combined_text, SENTENCE_TRANSFORMER_MODEL, top_n=TOP_KEYWORDS_GLOBAL)
    print("🎯 Detecting top topics and reformulating...")
    topics = []
    topic_sources = []
    keyword_sources = {k: set() for k in global_keywords}
    all_chunk_embeddings = global_embedding_model.encode(chunks, convert_to_tensor=False)
    num_clusters = min(NUM_TOPICS, len(chunks))
    if num_clusters == 0:
        detected_topics = []
        detected_topic_sources = []
    elif len(np.unique(all_chunk_embeddings, axis=0)) == 1:
        first_chunk_keywords = extract_keywords_from_text(chunks[0], SENTENCE_TRANSFORMER_MODEL, top_n=TOPIC_KEYWORDS_PER_TOPIC)
        if first_chunk_keywords:
            topic_sentence = reformulate_topic_sentence(
                first_chunk_keywords, chunks[0], elaboration_model_dummy, elaboration_tokenizer, MAX_TOPIC_SENTENCE_WORDS
            )
            if (
                not topic_sentence.strip()
                or topic_sentence.lower().startswith("based on these keywords")
            ):
                topic_sentence = " ".join(first_chunk_keywords)
            topics = [topic_sentence]
            topic_sources = [chunk_sources[0]]
        else:
            topics = []
            topic_sources = []
    else:
        with warnings.catch_warnings():
            warnings.simplefilter("ignore", RuntimeWarning)
            kmeans = MiniBatchKMeans(n_clusters=num_clusters, random_state=0, n_init=10, batch_size=256)
            kmeans.fit(all_chunk_embeddings)
            labels = kmeans.labels_
        # --- Multiprocessing topic sentence generation ---
        topic_args_list = []
        topic_files_list = []
        for i in range(num_clusters):
            cluster_chunks = [chunks[j] for j, label in enumerate(labels) if label == i]
            cluster_chunk_idxs = [j for j, label in enumerate(labels) if label == i]
            if not cluster_chunks:
                continue
            cluster_text = " ".join(cluster_chunks)
            topic_keywords = extract_keywords_from_text(cluster_text, SENTENCE_TRANSFORMER_MODEL, top_n=TOPIC_KEYWORDS_PER_TOPIC)
            topic_args_list.append((topic_keywords, cluster_text, elaboration_model_dummy.name_or_path, MAX_TOPIC_SENTENCE_WORDS))
            files = set()
            for idx in cluster_chunk_idxs:
                files.update(chunk_sources[idx])
            topic_files_list.append(sorted(files))
        topic_sentences = reformulate_topic_sentence_mp(topic_args_list, workers=PROC_WORKERS)
        for i, topic_sentence in enumerate(topic_sentences):
            topic_keywords, _, _, _ = topic_args_list[i]
            if (
                not topic_sentence.strip()
                or topic_sentence.lower().startswith("based on these keywords")
            ):
                topic_sentence = " ".join(topic_keywords)
            topics.append(topic_sentence)
            topic_sources.append(topic_files_list[i])
    for i, doc in enumerate(docs):
        for k in global_keywords:
            if k.lower() in doc.lower():
                keyword_sources[k].add(filenames[i])
    keyword_sources = {k: sorted(list(v)) for k, v in keyword_sources.items()}
    timestamp_ms = int(time.time() * 1000)
    summary_data = {
        "s": final_story_summary,
        "t": [
            {
                "topic": t,
                "files": [format_file_display_name(item) for item in (topic_sources[i] if i < len(topic_sources) else [])]
            }
            for i, t in enumerate(topics)
        ],
        "k": [
            {
                "keyword": k,
                "files": [format_file_display_name(item) for item in keyword_sources.get(k, [])]
            }
            for k in global_keywords
        ],
        "d": timestamp_ms
    }

    return summary_data

def save_summary(content_data):
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(script_dir, "doc-summary.json")
    try:
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(content_data, f, ensure_ascii=False, indent=4)
        print(f"✅ Summary saved to `{output_path}`")
    except Exception as e:
        print(f"❌ Failed to save summary to {output_path}: {e}")

if __name__ == "__main__":
    try:
        summary_json_data = summarize_documentation(FOLDER_PATH)
        save_summary(summary_json_data)
    except RuntimeError as re:
        print(f"\n🚫 An error occurred during summarization: {re}")
    except Exception as e:
        print(f"\nFatal error: {e}")

