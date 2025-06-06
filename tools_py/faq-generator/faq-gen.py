import logging
import os
import json
import time
from pathlib import Path
from langdetect import detect, DetectorFactory
from transformers.pipelines import pipeline
from transformers.utils.hub import cached_file
import torch
from requests.exceptions import HTTPError
import re
import numpy as np
import sys
import multiprocessing
import psutil
from functools import partial
import io
from contextlib import redirect_stdout
from sklearn.metrics.pairwise import cosine_similarity

# NLTK import and download
import nltk
try:
    with redirect_stdout(io.StringIO()):
        nltk.download('punkt', quiet=True)
except Exception as e:
    print(f"Error downloading NLTK Punkt tokenizer: {e}", file=sys.stderr)

# --- Core Modifications Start Here ---

# Suppress all logging from transformers and other libraries
logging.getLogger("transformers").setLevel(logging.CRITICAL)
logging.getLogger("torch").setLevel(logging.CRITICAL)
logging.getLogger("nltk").setLevel(logging.CRITICAL)

# Disable the root logger as well to prevent any default messages
logging.disable(logging.CRITICAL)

# Suppress warnings from environment variables
os.environ["TRANSFORMERS_NO_ADVISORY_WARNINGS"] = "true"
os.environ["TOKENIZERS_PARALLELISM"] = "true"

DetectorFactory.seed = 0

MAX_INPUT_TOKENS = 512
CHUNK_TOKEN_SIZE = 256
QUESTION_MAX_WORDS = 10
MIN_ANSWER_WORDS = 10
MAX_FAQ = 100
FINAL_FAQ_COUNT = 100
MAX_REFORMULATIONS = 3
MIN_CHUNKS = 20
DELAY_BETWEEN_REQUESTS = 1.0
MAX_RETRIES = 3
RETRY_DELAY = 3.0
SCRIPT_START_TS = int(time.time() * 1000)
ESTIMATED_MEMORY_PER_PROCESS_GB = 1.5

def get_device_info():
    if torch.cuda.is_available():
        return "🔥 CUDA GPU detected", torch.device("cuda")
    elif torch.backends.mps.is_available() and torch.backends.mps.is_built():
        return "🍏 Apple Silicon MPS detected", torch.device("mps")
    else:
        return "💻 Using CPU", torch.device("cpu")

E5_MODEL_NAME = "intfloat/e5-base-v2"

def remove_xla_device_from_config(model_name_or_path):
    try:
        config_path = cached_file(model_name_or_path, "config.json")
        config_file = Path(config_path)
        if config_file.exists():
            config = json.loads(config_file.read_text())
            if "xla_device" in config:
                del config["xla_device"]
                config_file.write_text(json.dumps(config, indent=2))
    except Exception:
        pass

def load_markdown_text(content_dir):
    content_dir = Path(content_dir)
    text_by_file = []
    ext = "*.txt"
    for file in content_dir.rglob(ext):
        with open(file, "r", encoding="utf-8") as f:
            content = f.read()
            text_by_file.append((str(file), content))
    return text_by_file

def get_token_count(text, tokenizer):
    return len(tokenizer.encode(text, truncation=False))

def truncate_text(text, tokenizer, max_tokens):
    tokens = tokenizer.encode(text, truncation=True, max_length=max_tokens)
    return tokenizer.decode(tokens, skip_special_tokens=True)

def format_file_display_name(file_display_name):
    """Remove .txt extension and replace underscores with slashes."""
    name = file_display_name
    if name.endswith('.txt'):
        name = name[:-4]
    return name.replace('_', '/')

# CREATING SEMANTIC CHUNKS
# ==============================================================

def mean_pooling(model_output, attention_mask):
    token_embeddings = model_output[0]
    input_mask_expanded = attention_mask.unsqueeze(-1).expand(token_embeddings.size())
    return (token_embeddings * input_mask_expanded).sum(1) / input_mask_expanded.sum(1)

def get_embeddings_e5(sentences, model, tokenizer, device):
    encoded_input = tokenizer(sentences, padding=True, truncation=True, return_tensors='pt', max_length=512)
    encoded_input = {k: v.to(device) for k, v in encoded_input.items()}
    with torch.no_grad():
        model_output = model(**encoded_input)
    return mean_pooling(model_output, encoded_input['attention_mask']).cpu().numpy()

def split_into_chunks_sensitive(text, tokenizer, chunk_token_limit, n, device):
    from nltk.tokenize.punkt import PunktSentenceTokenizer
    import numpy as np
    from sklearn.metrics.pairwise import cosine_similarity
    from transformers import AutoModel, AutoTokenizer

    tokenizer_sent = PunktSentenceTokenizer()
    sentences = tokenizer_sent.tokenize(text)

    hf_tokenizer = AutoTokenizer.from_pretrained(E5_MODEL_NAME)
    hf_model = AutoModel.from_pretrained(E5_MODEL_NAME).to(device)
    hf_model.eval()

    block_size = 5
    blocks = []
    block_indices = []
    for i in range(0, len(sentences), block_size):
        block = " ".join(sentences[i:i + block_size])
        blocks.append(block)
        block_indices.append((i, min(i + block_size, len(sentences))))

    if len(blocks) <= 1:
        topic_boundaries = [0, len(sentences)]
    else:
        block_embeddings = get_embeddings_e5(blocks, hf_model, hf_tokenizer, device)

        similarities = []
        for i in range(1, len(block_embeddings)):
            sim = cosine_similarity([block_embeddings[i]], [block_embeddings[i - 1]])[0][0]
            similarities.append(sim)

        sim_array = np.array(similarities)
        mean = np.mean(sim_array) if len(sim_array) > 0 else 0
        std = np.std(sim_array) if len(sim_array) > 0 else 0
        threshold = mean - 1.5 * std

        topic_boundaries = [0]
        for i, sim in enumerate(similarities):
            if sim < threshold:
                boundary_idx = block_indices[i + 1][0]
                topic_boundaries.append(boundary_idx)
        topic_boundaries.append(len(sentences))

    chunks = []
    for i in range(len(topic_boundaries) - 1):
        topic_sentences = sentences[topic_boundaries[i]:topic_boundaries[i + 1]]
        chunk = []
        token_count = 0

        for sentence in topic_sentences:
            tokens = get_token_count(sentence, tokenizer)

            if token_count + tokens <= chunk_token_limit:
                chunk.append(sentence)
                token_count += tokens
            else:
                if chunk:
                    chunks.append(truncate_text(" ".join(chunk), tokenizer, chunk_token_limit))
                chunk = [sentence]
                token_count = tokens

        if chunk:
            chunks.append(truncate_text(" ".join(chunk), tokenizer, chunk_token_limit))
    return chunks

# ==============================================================
# END SEMANTIC CHUNKS

def deduplicate_faq(faq_list):
    seen = set()
    unique = []
    for item in faq_list:
        q = item["question"].strip().lower()
        if q not in seen:
            seen.add(q)
            unique.append(item)
    return unique

def save_faq_json(faq_list, output_path):
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(
            [
                {
                    "q": i["question"],
                    "a": i["answer"],
                    "f": Path(i["file"]).stem.replace("_", "/"),
                    "t": SCRIPT_START_TS
                }
                for i in faq_list
            ],
            f,
            indent=2
        )

def get_models_for_language(lang_code):
    # valhalla/t5-small-qg-prepend is faster but less accurate
    # valhalla/t5-base-qg-hl is slower but can be more accurate
    model_map = {
        "en": {
            "qg": "valhalla/t5-small-qg-prepend",
            "qa": "google/flan-t5-base",
        },
        "default": {
            "qg": "mrm8488/t5-base-finetuned-question-generation-ap",
            "qa": "google/flan-t5-base",
        }
    }
    return model_map.get(lang_code, model_map["default"])

def clean_question(q: str, qg_pipeline=None):
    if not q or not isinstance(q, str):
        return None

    q = q.strip(" ?.").strip()
    if not q:
        return None

    words = q.split()
    if len(words) > QUESTION_MAX_WORDS:
        q = " ".join(words[:QUESTION_MAX_WORDS])

    q = q[0].upper() + q[1:] + "?"

    if not q.endswith("?") or len(words) < 3 or q.lower().endswith(("the?", "a?", "an?", "and?", "of?", "to?", "is?", "each?")):
        if qg_pipeline:
            try:
                reformulate_prompt = (
                    f"The following question is incomplete or malformed."
                    f"Rewrite it as a clear, concise, and grammatically correct question under {QUESTION_MAX_WORDS} words."
                    f"Rewrite it to be a logical sentence."
                    f"Remove the final question mark is it does not makes sense."
                    f"Ensure that the question does not have any punctuation sign before the final question mark."
                    f"Original question: {q}"
                )
                response = qg_pipeline(
                    reformulate_prompt,
                    max_new_tokens=32,
                    num_beams=5,
                    do_sample=False,
                    early_stopping=True,
                )[0]["generated_text"].strip()
                return response[0].upper() + response[1:].rstrip(".") + "?"
            except Exception:
                pass

    return q

def clean_answer(answer: str) -> str:
    if not answer or not isinstance(answer, str):
        return ""

    raw_sentences = re.split(r'(?<=[.!?])\s+', answer.strip())
    cleaned_sentences = []

    for sentence in raw_sentences:
        sentence = sentence.strip()
        if not sentence:
            continue
        sentence = sentence[0].upper() + sentence[1:] if sentence else ""
        if not sentence.endswith("."):
            sentence += "."
        cleaned_sentences.append(sentence)

    return " ".join(cleaned_sentences)

def reformulate_short_answer(answer, question, context, qa_pipeline):
    prompt = (
        f"The previous answer was too short or unclear. Rewrite this answer to be complete, logical, and longer than {MIN_ANSWER_WORDS} words."
        f"If the answer is shorter than {MIN_ANSWER_WORDS}, create a logical sentence around it."
        f"The answer can be splitted in more than one sentence when applicable."
        f"Question: {question}\nShort answer: {answer}\nContext: {context}"
    )
    for _ in range(MAX_RETRIES):
        try:
            return clean_answer(
                qa_pipeline(prompt, max_new_tokens=256, num_beams=5, do_sample=False, early_stopping=True)[0]["generated_text"].strip()
            )
        except HTTPError as e:
            if "429" in str(e):
                time.sleep(RETRY_DELAY)
            else:
                raise

def rank_questions_by_relevance(questions, context):
    # LOCAL IMPORT: Ensure TfidfVectorizer is defined in this context
    from sklearn.feature_extraction.text import TfidfVectorizer

    if not questions:
        return []
    vectorizer = TfidfVectorizer().fit([context] + [q["question"] for q in questions])
    vectors = vectorizer.transform([context] + [q["question"] for q in questions])
    similarities = cosine_similarity(vectors[0:1], vectors[1:]).flatten()
    scored = list(zip(similarities, questions))
    scored.sort(reverse=True, key=lambda x: x[0])
    return [item[1] for item in scored[:FINAL_FAQ_COUNT]]

def load_models(lang_code, device):
    from transformers import AutoTokenizer, AutoModelForSeq2SeqLM, AutoModel

    models = get_models_for_language(lang_code)
    remove_xla_device_from_config(models["qg"])
    remove_xla_device_from_config(models["qa"])

    tokenizer_qg = AutoTokenizer.from_pretrained(models["qg"], legacy=False)
    model_qg = AutoModelForSeq2SeqLM.from_pretrained(models["qg"]).to(device)
    qg_pipeline = pipeline("text2text-generation", model=model_qg, tokenizer=tokenizer_qg, device=device.index if device.type == "cuda" else -1)

    tokenizer_qa = AutoTokenizer.from_pretrained(models["qa"], legacy=False)
    model_qa = AutoModelForSeq2SeqLM.from_pretrained(models["qa"]).to(device)
    qa_pipeline = pipeline("text2text-generation", model=model_qa, tokenizer=tokenizer_qa, device=device.index if device.type == "cuda" else -1)

    return qg_pipeline, qa_pipeline, tokenizer_qg

def is_logical_question(q: str) -> bool:
    if not q or len(q.split()) < 3:
        return False
    if re.search(r"[!.,;:]\?$", q):
        return False
    if not q[0].isupper():
        return False
    return True

def format_question(q: str) -> str:
    q = q.strip()
    q = re.sub(r"[!.,;:]+(\?)", r"\1", q)
    q = q.rstrip(".")
    if q.endswith("??"):
        q = q.rstrip("?") + "?"
    return q

def is_valid_question(result):
    word_count = len(result.strip().split())
    if word_count > 10:
        return False
    if re.search(r'\b\w+\d+\b', result):
        return False
    return is_logical_question(result)

def reformulate_question(q, qg_pipeline, attempt=1):
    if attempt > MAX_REFORMULATIONS:
        return None

    prompt = (
        f"The following question is not a logical sentence."
        f"Reformulate it by adding or removing words as needed to make it clear, grammatically correct, and under {QUESTION_MAX_WORDS} words."
        f"Remove the question mark if it makes no sense."
        f"If the question has more than {QUESTION_MAX_WORDS} reformulate it for maximum {MAX_REFORMULATIONS} times."
        f"Wording can be changed or removed during reformulations, but the sense and meaning of the question must be kept."
        f"Do not allow enumerations in the question text. Remove enumerations and replace them with short meaningful text. If replacement did not succeed, remove enumerations."
        f"Exit reformulations when the number of words is less or equal to {QUESTION_MAX_WORDS} or when {MAX_REFORMULATIONS} reformulation attempts were reached."
        f"Original: {q}"
    )
    try:
        result = qg_pipeline(
            prompt,
            max_new_tokens=32,
            num_beams=5,
            do_sample=False,
            early_stopping=True,
        )[0]["generated_text"].strip()

        result = format_question(result)
        if is_valid_question(result):
            return result
        return reformulate_question(result, qg_pipeline, attempt + 1)

    except Exception:
        pass
        return None

def generate_faq_from_text(text, filename, qg_pipeline, qa_pipeline, tokenizer, device):
    n_chunks = max(MIN_CHUNKS, MAX_FAQ * 2)
    chunks = split_into_chunks_sensitive(text, tokenizer, CHUNK_TOKEN_SIZE, n_chunks, device)

    faqs = []
    total_chunks = len(chunks)
    bar_length = 40

    file_display_name = Path(filename).name

    sys.stdout.write('\r\033[K')  # \r = return, \033[K = clear to end of line
    sys.stdout.flush()
    sys.stdout.write(f" [{'-' * bar_length}] 0%   {format_file_display_name(file_display_name)}\r")
    sys.stdout.flush()

    for idx, chunk in enumerate(chunks):
        try:
            progress = (idx + 1) / total_chunks
            filled_length = int(bar_length * progress)
            bar = "=" * filled_length + " " * (bar_length - filled_length)
            sys.stdout.write('\r\033[K')  # \r = return, \033[K = clear to end of line
            sys.stdout.flush()
            percent = int(progress * 100)
            padding = "   " if percent < 10 else "  " if percent < 100 else " "
            sys.stdout.write(f" [{bar}] {percent}%{padding}{format_file_display_name(file_display_name)}\r")
            sys.stdout.flush()

            prompt_qg = (
                f"Generate as many relevant and concise questions as possible strictly based on the following text. "
                f"List each question on a new line."
                f"Questions must not be based or inspired from this prompt."
                f"Questions must not contain combinations of 3 or more words from this prompt."
                f"The questions must be strictly based on the following text."
                f"The questions must not end with punctuation before the final question mark."
                f"Do not add the final question mark if it makes no sense to have it."
                f"Text:\n{chunk}"
            )

            qg_outputs = qg_pipeline(
                prompt_qg,
                max_new_tokens=128,
                num_beams=10,
                num_return_sequences=3,
                do_sample=True,
                top_p=0.9,
                temperature=0.7,
                early_stopping=True,
            )

            questions = []
            for output in qg_outputs:
                for q_raw in output["generated_text"].strip().split("\n"):
                    q_cleaned = format_question(q_raw.strip())
                    q_cleaned = reformulate_question(q_cleaned, qg_pipeline)
                    if q_cleaned and q_cleaned not in questions:
                        questions.append(q_cleaned)

            for question in questions:
                qa_input = f"Question: {question}\nContext: {chunk}"
                qa_output = qa_pipeline(
                    qa_input,
                    max_new_tokens=128,
                    num_beams=5,
                    do_sample=False,
                    early_stopping=True,
                )[0]["generated_text"]
                answer = clean_answer(qa_output)

                if len(answer.split()) < MIN_ANSWER_WORDS:
                    answer = reformulate_short_answer(answer, question, chunk, qa_pipeline)

                faqs.append({"question": question, "answer": answer, "file": filename})

            time.sleep(DELAY_BETWEEN_REQUESTS)

        except Exception:
            pass

    sys.stdout.write('\r\033[K')  # \r = return, \033[K = clear to end of line
    sys.stdout.flush()

    sys.stdout.write(f" [{'=' * bar_length}] 100% {format_file_display_name(file_display_name)}\n")
    sys.stdout.flush()

    faqs = deduplicate_faq(faqs)
    faqs = rank_questions_by_relevance(faqs, text) # This call runs in the worker process
    return faqs[:FINAL_FAQ_COUNT]

# --- Multiprocessing additions ---

def worker_generate_faq(file_info, device):
    filename, text = file_info
    try:
        lang = detect(text)
    except Exception:
        lang = "en"

    qg_pipeline, qa_pipeline, tokenizer = load_models(lang, device)
    
    faqs = generate_faq_from_text(text, filename, qg_pipeline, qa_pipeline, tokenizer, device)
    return faqs

def main(content_dir, output_dir, device_obj):
    content_dir = Path(content_dir)
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    files_texts = load_markdown_text(content_dir)

    available_memory_bytes = psutil.virtual_memory().available
    target_memory_bytes = available_memory_bytes * 0.60

    estimated_memory_per_process_gb = ESTIMATED_MEMORY_PER_PROCESS_GB
    estimated_memory_per_process_bytes = estimated_memory_per_process_gb * (1024 ** 3)

    num_processes = int(target_memory_bytes / estimated_memory_per_process_bytes)
    num_processes = max(1, min(num_processes, os.cpu_count() or 1))
    print(f"🧠 Calculated {num_processes} processes based on memory availability.")

    all_faqs = []
    with multiprocessing.Pool(processes=num_processes, maxtasksperchild=1) as pool:
        worker_func_with_device = partial(worker_generate_faq, device=device_obj)
        results = pool.map(worker_func_with_device, files_texts)
        for faqs_from_file in results:
            all_faqs.extend(faqs_from_file)

    all_faqs = deduplicate_faq(all_faqs)
    combined_answers_context = " ".join([f["answer"] for f in all_faqs])
    all_faqs = rank_questions_by_relevance(all_faqs, combined_answers_context) # This call runs in the main process

    save_faq_json(all_faqs, output_dir / "faq.json")

    print(f"Generated {len(all_faqs)} FAQs")

if __name__ == "__main__":
    device_log_str, detected_device = get_device_info()
    print(device_log_str)

    main("../../doc-raw-contents/", "", detected_device)
