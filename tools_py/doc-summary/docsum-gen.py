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

nltk_data_path = os.path.join(os.path.expanduser("~"), "nltk_data")
nltk.data.path.append(nltk_data_path)

output_capture = io.StringIO()
with redirect_stdout(output_capture):
    try:
        nltk.download("punkt", download_dir=nltk_data_path, raise_on_error=True, quiet=True)
        nltk.download("punkt_tab", download_dir=nltk_data_path, raise_on_error=True, quiet=True)
        nltk.download("stopwords", download_dir=nltk_data_path, raise_on_error=True, quiet=True)
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

DEVICE = torch.device("cpu")
MAX_INPUT_TOKENS = 512

NUM_TOPICS = 10
SENTENCE_CHUNK_SIZE = 10
TOPIC_KEYWORDS_PER_TOPIC = 3
TOP_KEYWORDS_GLOBAL = 10
MAX_TOPIC_SENTENCE_WORDS = 10

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

def get_sentence_transformer_model():
    global _sentence_transformer_model
    if _sentence_transformer_model is None:
        _sentence_transformer_model = SentenceTransformer("sentence-transformers/LaBSE", device="cpu")
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
    if num_clusters < 1:
        num_clusters = 1
    embedding_model = SentenceTransformer(embedding_model_name, device="cpu")
    try:
        grouped_sentence_embeddings = embedding_model.encode(grouped_sentences, convert_to_tensor=False)
        if len(np.unique(grouped_sentence_embeddings, axis=0)) == 1:
            print("Info: All sentence group embeddings are identical. Semantic chunking will fall back to simple chunking.", file=sys.stderr)
            return chunk_text(cleaned_text, tokenizer, max_tokens)
        with warnings.catch_warnings():
            warnings.simplefilter("ignore", RuntimeWarning)
            kmeans = MiniBatchKMeans(n_clusters=num_clusters, random_state=0, n_init=10, batch_size=256)
            kmeans.fit(grouped_sentence_embeddings)
            labels = kmeans.labels_
        clustered_chunks_text = {i: [] for i in range(num_clusters)}
        for i, group_idx in enumerate(labels):
            if group_idx in clustered_chunks_text:
                clustered_chunks_text[group_idx].append(grouped_sentences[i])
        semantic_chunks = [" ".join(clustered_chunks_text[i]) for i in range(num_clusters) if clustered_chunks_text[i]]
        final_chunks = []
        for s_chunk in semantic_chunks:
            sub_chunks = chunk_text(s_chunk, tokenizer, max_tokens)
            final_chunks.extend(sub_chunks)
        return final_chunks
    except Exception as e:
        print(f"⚠️ Semantic chunking failed ({e}). Falling back to simple chunking.", file=sys.stderr)
        return chunk_text(cleaned_text, tokenizer, max_tokens)

def chunk_text(text, tokenizer, max_tokens=MAX_INPUT_TOKENS):
    if not text:
        return []
    sentences = sent_tokenize(text)
    chunks, current_chunk_sentences = [], []
    for sent in sentences:
        test_chunk_text = " ".join(current_chunk_sentences + [sent]).strip()
        if len(tokenizer.encode(test_chunk_text, add_special_tokens=True)) <= max_tokens:
            current_chunk_sentences.append(sent)
        else:
            if current_chunk_sentences:
                chunks.append(" ".join(current_chunk_sentences).strip())
            # If the sentence itself is too long, split by tokens
            if len(tokenizer.encode(sent, add_special_tokens=True)) > max_tokens:
                tokens = tokenizer.encode(sent, add_special_tokens=True)
                for i in range(0, len(tokens), max_tokens):
                    sub_tokens = tokens[i:i+max_tokens]
                    sub_text = tokenizer.decode(sub_tokens, skip_special_tokens=True)
                    chunks.append(sub_text.strip())
                current_chunk_sentences = []
            else:
                current_chunk_sentences = [sent]
    if current_chunk_sentences:
        chunks.append(" ".join(current_chunk_sentences).strip())
    return chunks

def truncate_text_to_max_tokens(text, tokenizer, max_tokens):
    """
    Truncate text so that its tokenized length does not exceed max_tokens.
    Uses add_special_tokens=True to align with model's expected input length including special tokens.
    """
    tokens = tokenizer.encode(text, add_special_tokens=True) # Crucial to use True here
    if len(tokens) <= max_tokens:
        return text
    truncated_tokens = tokens[:max_tokens]
    return tokenizer.decode(truncated_tokens, skip_special_tokens=True)


def format_sentences(text):
    sentences = re.split(r'([.!?])', text)
    formatted = []
    for i in range(0, len(sentences)-1, 2):
        sentence = sentences[i].strip()
        punct = sentences[i+1]
        if not sentence:
            continue
        sentence = sentence[0].upper() + sentence[1:]
        if punct not in ".!?":
            punct = "."
        formatted.append(sentence + punct)
    if len(sentences) % 2 == 1 and sentences[-1].strip():
        trailing = sentences[-1].strip()
        trailing = trailing[0].upper() + trailing[1:]
        formatted.append(trailing + ".")
    return " ".join(formatted)

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
    os.environ["CUDA_VISIBLE_DEVICES"] = ""
    chunk, summarizer_model_name, max_input_tokens = args
    tokenizer, model = get_summarizer_model_and_tokenizer(summarizer_model_name)
    # --- FIX: Truncate chunk to max_input_tokens ---
    chunk = truncate_text_to_max_tokens(chunk, tokenizer, max_input_tokens)
    inputs = tokenizer(chunk, return_tensors="pt", max_length=max_input_tokens, truncation=True).to("cpu")
    summary_ids = model.generate(
        inputs["input_ids"],
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
    os.environ["CUDA_VISIBLE_DEVICES"] = "" # Prevents CUDA from being visible to subprocesses
    draft_summary_text, elaboration_model_name, max_input_tokens, device = args
    elaboration_tokenizer, elaboration_model = get_elaboration_model_and_tokenizer(elaboration_model_name)

    if not draft_summary_text.strip():
        return ""

    # Define the prompt parts
    preamble = (
        "Rewrite the following text into a cohesive, well-structured, and logically flowing narrative or story. "
        "The output should read like a natural-language document, not a list of facts or fragmented sentences. "
        "Avoid any jargon or technical placeholders unless they are central to the story. "
        "Ensure grammar and punctuation are correct.\n\n"
        "Input: "
    )
    postamble = "\n\nOutput:"

    # Calculate tokens for preamble + postamble *including special tokens*
    # This is crucial because the final tokenizer call will add special tokens
    preamble_postamble_tokens = elaboration_tokenizer(preamble + postamble, add_special_tokens=True)['input_ids']
    reserved_tokens_length = len(preamble_postamble_tokens)

    # Determine how many tokens are available for the draft_summary_text
    # Subtract 2 to leave a small buffer for potential new special tokens or edge cases,
    # though with truncation=True, it's mostly a safety measure.
    # The tokenizer's 'max_length' will handle the final constraint.
    available_tokens_for_text = max_input_tokens - reserved_tokens_length

    if available_tokens_for_text <= 0:
        # If no tokens are available for text, return empty or handle gracefully
        # This scenario should be rare if max_input_tokens is reasonable
        return "Elaboration prompt too long, no space for text."


    # Construct the full prompt string.
    # The crucial part: rely on the tokenizer's `max_length` and `truncation=True`
    # in the final tokenization step to manage the total sequence length.
    # We pre-truncate the draft_summary_text here to avoid an extremely long
    # string that might be inefficient for the tokenizer to process initially,
    # but the tokenizer's built-in truncation is the ultimate guardian.
    # We use add_special_tokens=False for this pre-truncation because we are only
    # concerned about the length of the *text content* before the final prompt assembly.
    truncated_draft_summary_text_content = elaboration_tokenizer.decode(
        elaboration_tokenizer.encode(draft_summary_text, add_special_tokens=False)[:available_tokens_for_text],
        skip_special_tokens=True
    )

    prompt = f"{preamble}{truncated_draft_summary_text_content}{postamble}"

    # The tokenizer handles the final truncation to max_input_tokens, including special tokens.
    inputs = elaboration_tokenizer(
        prompt,
        return_tensors="pt",
        max_length=max_input_tokens, # This is the hard limit for the *final* tokenized sequence
        truncation=True,             # This ensures truncation occurs if needed
        padding='max_length'         # Ensure consistent input size if batching (though not used here)
    ).to(device)

    elaborated_ids = elaboration_model.generate(
        inputs["input_ids"],
        attention_mask=inputs["attention_mask"], # Pass attention_mask
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
    elaborated_summary = format_sentences(elaborated_summary)
    return elaborated_summary


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

def reformulate_topic_sentence_worker(args):
    os.environ["CUDA_VISIBLE_DEVICES"] = ""
    keywords, cluster_text_sample, elaboration_model_name, max_words = args
    elaboration_tokenizer, elaboration_model = get_elaboration_model_and_tokenizer(elaboration_model_name)
    if not keywords and not cluster_text_sample:
        return "General information"
    context_sentences = sent_tokenize(cluster_text_sample)
    context_sample_words = " ".join(context_sentences[:min(3, len(context_sentences))]).split()[:100]
    context_sample = " ".join(context_sample_words)
    keyword_list_str = ", ".join(keywords)
    prompt = (
        f"Based on these keywords and context, summarize the core topic, no more than {max_words} words. "
        f"Avoid generic phrases like 'essence of the topic' or 'this topic is about'. Focus directly on the content. "
        f"Keywords: {keyword_list_str}\n"
        f"Context: {context_sample}\n\n"
        "Topic:"
    )
    prompt = truncate_text_to_max_tokens(prompt, elaboration_tokenizer, MAX_INPUT_TOKENS)
    inputs = elaboration_tokenizer(
        prompt,
        return_tensors="pt",
        max_length=MAX_INPUT_TOKENS,
        truncation=True
    ).to("cpu")
    generated_ids = elaboration_model.generate(
        inputs["input_ids"],
        max_length=max_words * 2,
        min_length=min(5, max_words),
        num_beams=8,
        repetition_penalty=2.5,
        length_penalty=1.2,
        early_stopping=True,
        no_repeat_ngram_size=2
    )
    sentence = elaboration_tokenizer.decode(generated_ids[0], skip_special_tokens=True).strip()
    sentence = re.sub(r"<extra_id_\d+>", "", sentence).strip()
    undesired_phrases = [
        "the essence of the topic", "a link to file in different folder", "this topic is about",
        "this document discusses", "the main point is", "in this section", "this describes",
        "this explains", "this highlights", "this covers", "the topic is", "topic:",
        "main topic:", "summary of this topic:", "the text discusses", "the document focuses on",
        "the main focus of this topic is", "the following provides an overview of",
        ",. ihsbestore"
    ]
    for phrase in undesired_phrases:
        sentence = re.sub(r'\b' + re.escape(phrase) + r'\b', '', sentence, flags=re.IGNORECASE).strip()
    sentence = re.sub(r'\s+', ' ', sentence).strip()
    sentence = sentence.lstrip(".,;!?-—")
    sentence = sentence.rstrip(".,;!?-—")
    words = sentence.split()
    if len(words) > max_words:
        sentence = " ".join(words[:max_words]).strip()
        if not sentence.endswith((".", "!", "?", "...")):
            sentence += "..."
    elif not sentence.endswith((".", "!", "?")):
        sentence += "."
    if len(words) < 3 or not any(word.isalpha() for word in words):
        return f"Key aspects of {keyword_list_str.split(',')[0].strip()}" if keywords else "Uncategorized topic"
    return sentence.capitalize()

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
    global_embedding_model = SentenceTransformer("sentence-transformers/LaBSE", device="cpu")
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
    chunks = semantic_chunk_text(combined_text, summarizer_tokenizer, "sentence-transformers/LaBSE", MAX_INPUT_TOKENS, SENTENCE_CHUNK_SIZE)
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
    print("✨ Elaborating story summary for better flow...")
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
    global_keywords = extract_keywords_from_text(combined_text, "sentence-transformers/LaBSE", top_n=TOP_KEYWORDS_GLOBAL)
    print("🎯 Detecting top topics and reformulating as sentences...")
    topics = []
    topic_sources = []
    keyword_sources = {k: set() for k in global_keywords}
    all_chunk_embeddings = global_embedding_model.encode(chunks, convert_to_tensor=False)
    num_clusters = min(NUM_TOPICS, len(chunks))
    if num_clusters == 0:
        detected_topics = []
        detected_topic_sources = []
    elif len(np.unique(all_chunk_embeddings, axis=0)) == 1:
        first_chunk_keywords = extract_keywords_from_text(chunks[0], "sentence-transformers/LaBSE", top_n=TOPIC_KEYWORDS_PER_TOPIC)
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
            topic_keywords = extract_keywords_from_text(cluster_text, "sentence-transformers/LaBSE", top_n=TOPIC_KEYWORDS_PER_TOPIC)
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
        "t": [{"topic": t, "files": topic_sources[i] if i < len(topic_sources) else []} for i, t in enumerate(topics)],
        "k": [{"keyword": k, "files": keyword_sources.get(k, [])} for k in global_keywords],
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
