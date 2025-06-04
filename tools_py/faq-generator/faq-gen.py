import logging
import random
import os
import json
import time
from pathlib import Path
from langdetect import detect, DetectorFactory
from transformers.pipelines import pipeline
from transformers.models.auto.tokenization_auto import AutoTokenizer
from transformers.models.auto.modeling_auto import AutoModelForSeq2SeqLM
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from transformers.utils.hub import cached_file
from concurrent.futures import ThreadPoolExecutor, as_completed
import torch
from requests.exceptions import HTTPError
import re
from sentence_transformers import SentenceTransformer
from sklearn.cluster import KMeans

import nltk
nltk.download('punkt')
from nltk.tokenize import PunktSentenceTokenizer

# Suppress warnings
os.environ["TRANSFORMERS_NO_ADVISORY_WARNINGS"] = "true"
os.environ["TOKENIZERS_PARALLELISM"] = "true"

DetectorFactory.seed = 0

MAX_INPUT_TOKENS = 512
CHUNK_TOKEN_SIZE = 256
QUESTION_MAX_WORDS = 15
MIN_ANSWER_WORDS = 10
MAX_FAQ = 50
FINAL_FAQ_COUNT = 50
MAX_REFORMULATIONS = 10
MIN_CHUNKS = 20
MAX_WORKERS = 8
DELAY_BETWEEN_REQUESTS = 1.0
MAX_RETRIES = 3
RETRY_DELAY = 3.0

# Suppress "Device set to use mps:0" logs from transformers / torch
logging.getLogger("transformers").setLevel(logging.ERROR)
logging.getLogger("torch").setLevel(logging.ERROR)


def get_device():
    if torch.cuda.is_available():
        print("🔥 CUDA GPU detected")
        return torch.device("cuda")
    elif torch.backends.mps.is_available() and torch.backends.mps.is_built():
        print("🍏 Apple Silicon MPS detected")
        return torch.device("mps")
    else:
        print("💻 Using CPU")
        return torch.device("cpu")


DEVICE = get_device()


def remove_xla_device_from_config(model_name_or_path):
    try:
        config_path = cached_file(model_name_or_path, "config.json")
        config_file = Path(config_path)
        if config_file.exists():
            config = json.loads(config_file.read_text())
            if "xla_device" in config:
                del config["xla_device"]
                config_file.write_text(json.dumps(config, indent=2))
    except Exception as e:
        logging.warning(f"Failed to clean xla_device from config: {e}")


def load_markdown_text(content_dir):
    content_dir = Path(content_dir)
    text_by_file = []
    for ext in ("*.md", "*.txt"):
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


def split_into_chunks_sensitive(text, tokenizer, chunk_token_limit, n):
    tokenizer_sent = PunktSentenceTokenizer()
    sentences = tokenizer_sent.tokenize(text)
    
    if len(sentences) < n:
        return [truncate_text(text, tokenizer, MAX_INPUT_TOKENS)]
    
    model = SentenceTransformer("all-MiniLM-L6-v2")
    embeddings = model.encode(sentences)
    kmeans = KMeans(n_clusters=min(n, len(sentences)), random_state=0, n_init="auto")
    labels = kmeans.fit_predict(embeddings)
    
    clusters = [[] for _ in range(max(labels) + 1)]
    for idx, label in enumerate(labels):
        clusters[label].append(sentences[idx])
    
    chunks = []
    for cluster in clusters:
        chunk = []
        token_count = 0
        for sentence in cluster:
            tokens = get_token_count(sentence, tokenizer)
            if token_count + tokens <= chunk_token_limit:
                chunk.append(sentence)
                token_count += tokens
            else:
                if chunk:
                    combined = " ".join(chunk)
                    chunks.append(truncate_text(combined, tokenizer, chunk_token_limit))
                chunk = [sentence]
                token_count = tokens
        if chunk:
            combined = " ".join(chunk)
            chunks.append(truncate_text(combined, tokenizer, chunk_token_limit))
    
    return chunks


def deduplicate_faq(faq_list):
    seen = set()
    unique = []
    for item in faq_list:
        q = item["question"].strip().lower()
        if q not in seen:
            seen.add(q)
            unique.append(item)
    return unique


def save_faq_markdown(faq_list, output_path):
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("---\nlayout: page\ntitle: Frequently Asked Questions\n---\n\n")
        for item in faq_list:
            f.write(f"### {item['question']}\n\n{item['answer']}\n\n")


def save_faq_json(faq_list, output_path):
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(
            [{"q": i["question"], "a": i["answer"], "f": Path(i["file"]).name} for i in faq_list],
            f,
            indent=2
        )


def get_models_for_language(lang_code):
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
            except Exception as e:
                logging.warning(f"Failed to reformulate question: {e}")
                return None

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
        f"If the answer is shorter than {MIN_ANSWER_WORDS} words, create a logical sentence around it."
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
    if not questions:
        return []
    vectorizer = TfidfVectorizer().fit([context] + [q["question"] for q in questions])
    vectors = vectorizer.transform([context] + [q["question"] for q in questions])
    similarities = cosine_similarity(vectors[0:1], vectors[1:]).flatten()
    scored = list(zip(similarities, questions))
    scored.sort(reverse=True, key=lambda x: x[0])
    return [item[1] for item in scored[:FINAL_FAQ_COUNT]]


def load_models(lang_code):
    models = get_models_for_language(lang_code)
    remove_xla_device_from_config(models["qg"])
    remove_xla_device_from_config(models["qa"])

    tokenizer_qg = AutoTokenizer.from_pretrained(models["qg"], legacy=False)
    model_qg = AutoModelForSeq2SeqLM.from_pretrained(models["qg"]).to(DEVICE)
    qg_pipeline = pipeline("text2text-generation", model=model_qg, tokenizer=tokenizer_qg, device=DEVICE.index if DEVICE.type == "cuda" else -1)

    tokenizer_qa = AutoTokenizer.from_pretrained(models["qa"], legacy=False)
    model_qa = AutoModelForSeq2SeqLM.from_pretrained(models["qa"]).to(DEVICE)
    qa_pipeline = pipeline("text2text-generation", model=model_qa, tokenizer=tokenizer_qa, device=DEVICE.index if DEVICE.type == "cuda" else -1)

    return qg_pipeline, qa_pipeline, tokenizer_qg


def is_logical_question(q: str) -> bool:
    """
    Checks if the question is a logical sentence.
    Basic heuristic: at least 3 words, starts with capital, no double punctuation, no odd endings.
    """
    if not q or len(q.split()) < 3:
        return False
    if re.search(r"[!.,;:]\?$", q):  # ends in punctuation before ?
        return False
    if not q[0].isupper():
        return False
    return True


def format_question(q: str) -> str:
    """
    Remove trailing punctuation before ?, remove redundant symbols.
    """
    q = q.strip()
    q = re.sub(r"[!.,;:]+(\?)", r"\1", q)  # Remove punctuation before ?
    q = q.rstrip(".")
    if q.endswith("??"):
        q = q.rstrip("?") + "?"
    return q


def reformulate_question(q, qg_pipeline, attempt=1):
    """
    Reformulate a question if it's malformed or illogical.
    Remove the question mark if needed during reformulation.
    """
    if attempt > MAX_REFORMULATIONS:
        return None

    prompt = (
        f"The following question is not a logical sentence. "
        f"Reformulate it by adding or removing words as needed to make it clear, grammatically correct, and under {QUESTION_MAX_WORDS} words." 
        f"Remove the question mark if it makes no sense."
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
        if is_logical_question(result):
            return result
        return reformulate_question(result, qg_pipeline, attempt + 1)

    except Exception as e:
        logging.warning(f"Failed to reformulate question '{q}': {e}")
        return None


def generate_faq_from_text(text, filename, qg_pipeline, qa_pipeline, tokenizer):
    n_chunks = max(MIN_CHUNKS, MAX_FAQ * 2)
    chunks = split_into_chunks_sensitive(text, tokenizer, CHUNK_TOKEN_SIZE, n_chunks)

    faqs = []
    for idx, chunk in enumerate(chunks):
        try:
            prompt_qg = (
                f"Generate as many relevant and concise questions as possible based on the following text. "
                f"List each question on a new line."
                f"Questions must be logical sentences. Reformulate questions no more than {MAX_REFORMULATIONS} times if not logical."
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
                    if not is_logical_question(q_cleaned):
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

        except Exception as e:
            logging.warning(f"Failed to generate QA for chunk {idx} in {filename}: {e}")

    faqs = deduplicate_faq(faqs)
    faqs = rank_questions_by_relevance(faqs, text)
    return faqs[:FINAL_FAQ_COUNT]

def main(content_dir, output_dir):
    content_dir = Path(content_dir)
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    files_texts = load_markdown_text(content_dir)

    all_faqs = []
    for filename, text in files_texts:
        print(f"Processing file: {filename}")
        try:
            lang = detect(text)
        except Exception:
            lang = "en"
        qg_pipeline, qa_pipeline, tokenizer = load_models(lang)
        faqs = generate_faq_from_text(text, filename, qg_pipeline, qa_pipeline, tokenizer)
        all_faqs.extend(faqs)

    all_faqs = deduplicate_faq(all_faqs)
    all_faqs = rank_questions_by_relevance(all_faqs, " ".join([f["answer"] for f in all_faqs]))

    save_faq_markdown(all_faqs, output_dir / "faq.md")
    save_faq_json(all_faqs, output_dir / "faq.json")

    print(f"Generated {len(all_faqs)} FAQs")


if __name__ == "__main__":
    main("../../doc-raw-contents/", "")


