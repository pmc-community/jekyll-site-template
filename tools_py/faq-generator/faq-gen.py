import logging
import random
import os
import json
import time
from pathlib import Path
from langdetect import detect, DetectorFactory
from transformers import pipeline, AutoTokenizer, AutoModelForSeq2SeqLM
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from transformers.utils import cached_file
from concurrent.futures import ThreadPoolExecutor, as_completed
import torch
from requests.exceptions import HTTPError
import re

# Suppress warnings
os.environ["TRANSFORMERS_NO_ADVISORY_WARNINGS"] = "true"
os.environ["TOKENIZERS_PARALLELISM"] = "true"

DetectorFactory.seed = 0

MAX_INPUT_TOKENS = 512
CHUNK_TOKEN_SIZE = 256
QUESTION_MAX_WORDS = 10
MIN_ANSWER_WORDS = 10
MAX_FAQ = 50
FINAL_FAQ_COUNT = 25
MAX_REFORMULATIONS = 5
MIN_CHUNKS = 50
MAX_WORKERS = 8
DELAY_BETWEEN_REQUESTS = 1.0
MAX_RETRIES = 3
RETRY_DELAY = 3.0

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

def load_markdown_text(content_dir) -> str:
    content_dir = Path(content_dir)
    texts = []
    for ext in ("*.md", "*.txt"):
        for file in content_dir.rglob(ext):
            with open(file, "r", encoding="utf-8") as f:
                texts.append(f.read())
    return "\n\n".join(texts)

def get_token_count(text, tokenizer):
    return len(tokenizer.encode(text, truncation=False))

def truncate_text(text, tokenizer, max_tokens):
    tokens = tokenizer.encode(text, truncation=True, max_length=max_tokens)
    return tokenizer.decode(tokens, skip_special_tokens=True)

def split_into_n_chunks(text, tokenizer, chunk_token_limit, n):
    paragraphs = text.split("\n\n")
    current_chunk = []
    chunks = []
    token_count = 0

    for para in paragraphs:
        para = truncate_text(para, tokenizer, chunk_token_limit)
        tokens = get_token_count(para, tokenizer)
        if tokens > chunk_token_limit:
            continue
        if token_count + tokens > chunk_token_limit:
            chunks.append(" ".join(current_chunk))
            current_chunk = [para]
            token_count = tokens
        else:
            current_chunk.append(para)
            token_count += tokens
        if len(chunks) >= n:
            break

    if current_chunk and len(chunks) < n:
        chunks.append(" ".join(current_chunk))

    while len(chunks) < n:
        chunks.append("")

    return chunks[:n]

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

    # Capitalize first letter and add question mark
    q = q[0].upper() + q[1:] + "?"

    # Check for malformed patterns
    if not q.endswith("?") or len(words) < 3 or q.lower().endswith(("the?", "a?", "an?", "and?", "of?", "to?", "is?", "each?")):
        if qg_pipeline:
            try:
                reformulate_prompt = (
                    "The following question is incomplete or malformed. Rewrite it as a clear, concise, and grammatically correct question under 10 words:\n\n"
                    f"Original question: {q}"
                )
                response = qg_pipeline(
                    reformulate_prompt,
                    max_new_tokens=32,
                    num_beams=5,
                    do_sample=False,
                    early_stopping=True,
                )[0]["generated_text"].strip()
                # Clean again after reformulation
                return response[0].upper() + response[1:].rstrip(".") + "?"
            except Exception as e:
                logging.warning(f"Failed to reformulate question: {e}")
                return None

    return q

def clean_answer(answer: str) -> str:
    if not answer or not isinstance(answer, str):
        return ""

    # Split by sentence-ending punctuation (., !, ?)
    raw_sentences = re.split(r'(?<=[.!?])\s+', answer.strip())
    cleaned_sentences = []

    for sentence in raw_sentences:
        sentence = sentence.strip()
        if not sentence:
            continue

        # Capitalize first letter
        sentence = sentence[0].upper() + sentence[1:] if sentence else ""

        # Ensure it ends with a period
        if not sentence.endswith("."):
            sentence += "."

        cleaned_sentences.append(sentence)

    return " ".join(cleaned_sentences)

def reformulate_short_answer(answer, question, context, qa_pipeline):
    prompt = (
        f"The previous answer was too short or unclear. Rewrite this answer to be complete, logical, and longer than 10 words.\n\n"
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
    qg = pipeline("text2text-generation", model=model_qg, tokenizer=tokenizer_qg, device=0 if DEVICE.type != "cpu" else -1)

    tokenizer_qa = AutoTokenizer.from_pretrained(models["qa"], legacy=False)
    model_qa = AutoModelForSeq2SeqLM.from_pretrained(models["qa"]).to(DEVICE)
    qa = pipeline("text2text-generation", model=model_qa, tokenizer=tokenizer_qa, device=0 if DEVICE.type != "cpu" else -1)

    return {"qg": qg, "qa": qa}

def question_relevance_filter(question, context, min_overlap=0.1):  # lowered threshold
    context_words = set(re.findall(r'\w+', context.lower()))
    question_words = set(re.findall(r'\w+', question.lower()))
    if not question_words:
        return False
    overlap = len(question_words.intersection(context_words)) / len(question_words)
    return overlap >= min_overlap

def is_valid_question(q):
    invalid_phrases = [
        "generate clear",
        "best title",
        "passage",
        "question",
        "unknown"
    ]
    q_lower = q.lower()
    if any(phrase in q_lower for phrase in invalid_phrases):
        return False
    if len(q.split()) == 0:
        return False
    return True

def process_chunk(chunk, lang_code, qg_pipeline, qa_pipeline, qg_params, qa_params, index):
    logging.info(f"Processing chunk {index + 1}")
    try:
        prompt = (
            f"Read the following passage carefully and generate clear, concise, "
            f"and relevant questions (max 10 words) about this text:\n\n"
            f"{truncate_text(chunk, qg_pipeline.tokenizer, MAX_INPUT_TOKENS)}"
            f"Formulate the questions to be fully inline with the language spelling and grammarn\n\n"
            f"If needed, reformulate the answers to be logical sentences\n\n"
            f"Do not allow questions to end with punctuation signs before the question mark, reformulate and remove the ending punctuation sign\n\n"
            f"Where applicable, format the answer so that each sentence starts with a capital letter. Preserve the original meaning, punctuation, and grammar.\n\n"
            f"If needed, reformulate the questions to have meaning and the right order of wording."
        )
        result = qg_pipeline(
            prompt,
            max_new_tokens=qg_params["max_new_tokens"],
            num_beams=qg_params["num_beams"],
            do_sample=False,
        )[0]["generated_text"]

        # Debug print all raw questions before filtering
        raw_questions = [clean_question(q) for q in re.split(r'\?|\n', result) if q.strip()]
        logging.info(f"Raw questions (chunk {index + 1}): {raw_questions}")

        questions = [
            q for q in raw_questions
            if q
            and question_relevance_filter(q, chunk)
            and is_valid_question(q)
        ]

    except Exception as e:
        logging.warning(f"QG failed in chunk {index + 1}: {e}")
        return []

    faq_items = []
    for question in questions:
        reformulation_attempts = 0
        cleaned_answer = ""
        while reformulation_attempts < MAX_REFORMULATIONS:
            try:
                prompt = (
                    f"Answer the question using the context. Be logical, clear, and answer in more than 10 words.\n\n"
                    f"Question: {question}\n\nContext: {truncate_text(chunk, qa_pipeline.tokenizer, MAX_INPUT_TOKENS)}"
                )
                answer = qa_pipeline(prompt, max_new_tokens=qa_params["max_new_tokens"], num_beams=qa_params["num_beams"], do_sample=False)[0]["generated_text"].strip()
                cleaned_answer = clean_answer(answer)
                if len(cleaned_answer.split()) >= MIN_ANSWER_WORDS:
                    break
                else:
                    cleaned_answer = reformulate_short_answer(cleaned_answer, question, chunk, qa_pipeline)
                reformulation_attempts += 1
            except Exception as e:
                logging.warning(f"QA failed in chunk {index + 1}: {e}")
                reformulation_attempts += 1

        if cleaned_answer:
            faq_items.append({"question": question, "answer": cleaned_answer})

    return faq_items

def main():
    logging.basicConfig(level=logging.INFO)
    content_dir = "../../doc-raw-contents/"
    output_file = Path("faq.md")

    print("🔍 Loading content...")
    site_text = load_markdown_text(content_dir)

    print("🤖 Loading tokenizer...")
    tokenizer = AutoTokenizer.from_pretrained("google/flan-t5-base", legacy=False)

    print("📖 Splitting into chunks...")
    chunks = split_into_n_chunks(site_text, tokenizer, CHUNK_TOKEN_SIZE, MIN_CHUNKS)
    print(f"🔢 {len(chunks)} chunks created.")

    qg_params = {"num_beams": random.choice([3, 4, 5]), "max_new_tokens": random.choice([100, 128])}
    qa_params = {"num_beams": random.choice([4, 5]), "max_new_tokens": random.choice([200, 256])}

    print("🌐 Detecting language and loading models...")
    try:
        lang = detect(site_text)
    except Exception:
        lang = "default"
    models = load_models(lang)  # Preload models once

    all_questions = []
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = []
        for idx, chunk in enumerate(chunks):
            futures.append(executor.submit(
                process_chunk, chunk, lang, models["qg"], models["qa"], qg_params, qa_params, idx
            ))
            time.sleep(DELAY_BETWEEN_REQUESTS)

        for future in as_completed(futures):
            try:
                faq_items = future.result()
                all_questions.extend(faq_items)
            except Exception as e:
                logging.error(f"Exception in chunk processing: {e}")

    all_questions = deduplicate_faq(all_questions)
    top_questions = rank_questions_by_relevance(all_questions, site_text)

    print(f"📀 Saving {len(top_questions)} top FAQs to {output_file}")
    output_file.parent.mkdir(parents=True, exist_ok=True)
    save_faq_markdown(top_questions, output_file)
    print("✅ Done.")

if __name__ == "__main__":
    main()
