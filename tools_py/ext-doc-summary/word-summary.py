import os
import sys
import torch
import platform
import multiprocessing
import time
import tempfile
import textwrap
import re
import psutil
from docx import Document
from langdetect import detect
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
from tqdm import tqdm
import warnings

warnings.filterwarnings(
    "ignore",
    category=FutureWarning,
    module=r"huggingface_hub\.file_download"
)

# ------------------- CONFIG -------------------

warnings.filterwarnings("ignore", category=UserWarning)

MODEL_NAME = "csebuetnlp/mT5_multilingual_XLSum"
CHUNK_CHAR_LEN = 1000
EXTRACTION_MAX_TOKENS = 256
SYNTHESIS_MAX_TOKENS = 768
MIN_FREE_MEM_GB = 6
MAX_MEM_USAGE_PERCENT = 60
MAX_PARALLEL_PROCESSES = 8

DEVICE = "cpu"  # Force CPU

# ------------------- TEXT UTILS -------------------

def extract_text_from_docx(path):
    doc = Document(path)
    return "\n".join(p.text for p in doc.paragraphs if p.text.strip())

def split_text(text, max_length):
    sentences = re.split(r'(?<=[.!?]) +', text)
    chunks = []
    current = ""
    for sentence in sentences:
        if len(current) + len(sentence) < max_length:
            current += sentence + " "
        else:
            chunks.append(current.strip())
            current = sentence + " "
    if current:
        chunks.append(current.strip())
    return chunks

def get_extraction_prompt(text, lang_code):
    return (
        f"Extract factual key points only from this {lang_code} document. "
        f"Do not include opinions or unrelated info.\n\n"
        f"Text:\n{text.strip()}\n\n"
        "Bullet Points:\n-"
    )

def get_synthesis_prompt(bullets, lang_code):
    return (
        f"Using only the bullet points below (in {lang_code}), generate a structured summary "
        f"of 300 to 500 words. Group ideas logically and keep content faithful to the source.\n\n"
        f"Bullet Points:\n{bullets.strip()}\n\nSummary:"
    )

# ------------------- MEMORY CHECK -------------------

def can_spawn_worker():
    mem = psutil.virtual_memory()
    free_gb = mem.available / (1024 ** 3)
    return free_gb >= MIN_FREE_MEM_GB and mem.percent <= MAX_MEM_USAGE_PERCENT

# ------------------- WORKER PROCESS -------------------

def summarize_chunk_worker(text, lang_code, output_path):
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, legacy=False)
    model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME)
    model.eval()

    prompt = get_extraction_prompt(text, lang_code)
    inputs = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=512)
    inputs = {k: v.to(DEVICE) for k, v in inputs.items()}

    with torch.no_grad():
        outputs = model.generate(
            inputs["input_ids"],
            attention_mask=inputs.get("attention_mask"),
            max_length=EXTRACTION_MAX_TOKENS,
            num_beams=4,
            no_repeat_ngram_size=2,
            temperature=0.7,
            early_stopping=True,
            eos_token_id=tokenizer.eos_token_id,
            pad_token_id=tokenizer.pad_token_id,
        )
    summary = tokenizer.decode(outputs[0], skip_special_tokens=True).strip()

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(summary)

# ------------------- SYNTHESIS -------------------

def synthesize_summary(bullets, lang_code):
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, legacy=False)
    model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME)
    model.eval()

    prompt = get_synthesis_prompt(bullets, lang_code)
    inputs = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=1024)
    inputs = {k: v.to(DEVICE) for k, v in inputs.items()}

    with torch.no_grad():
        outputs = model.generate(
            inputs["input_ids"],
            attention_mask=inputs.get("attention_mask"),
            max_length=SYNTHESIS_MAX_TOKENS,
            num_beams=5,
            no_repeat_ngram_size=3,
            temperature=0.7,
            early_stopping=True,
            eos_token_id=tokenizer.eos_token_id,
            pad_token_id=tokenizer.pad_token_id,
        )
    summary = tokenizer.decode(outputs[0], skip_special_tokens=True).strip()
    return summary

# ------------------- MAIN -------------------

def summarize_docx(path):
    raw_text = extract_text_from_docx(path)
    if not raw_text.strip():
        raise ValueError("Empty document")

    lang_code = detect(raw_text[:2000])
    print(f"🌍 Detected language: {lang_code}")

    chunks = split_text(raw_text, CHUNK_CHAR_LEN)
    print(f"📄 Split into {len(chunks)} chunks")

    processes = []
    temp_outputs = []

    progress_bar = tqdm(total=len(chunks), desc="Processing chunks")

    while chunks or processes:
        # Clean finished processes
        for p, output_path in processes[:]:
            if not p.is_alive():
                p.join()
                processes.remove((p, output_path))
                progress_bar.update(1)

        # Spawn new processes if under the limit
        while len(processes) < MAX_PARALLEL_PROCESSES and chunks and can_spawn_worker():
            chunk = chunks.pop(0)
            fd, output_path = tempfile.mkstemp(suffix=".txt")
            os.close(fd)
            temp_outputs.append(output_path)

            p = multiprocessing.Process(target=summarize_chunk_worker, args=(chunk, lang_code, output_path))
            p.start()
            processes.append((p, output_path))

        if processes:
            time.sleep(0.5)
        else:
            time.sleep(1)

    progress_bar.close()

    # Combine summaries
    bullets = ""
    for path in temp_outputs:
        with open(path, "r", encoding="utf-8") as f:
            bullets += f.read().strip() + "\n"
        os.remove(path)

    print("🧠 Synthesizing structured summary...")
    final_summary = synthesize_summary(bullets, lang_code)

    print("\n✅ Final Summary:\n")
    print(textwrap.fill(final_summary, width=100))
    return final_summary

# ------------------- ENTRY -------------------

if __name__ == "__main__":
    print(f"⏳ Platform: {platform.system()} {platform.machine()}, running on CPU")

    if len(sys.argv) < 2:
        print("Usage: python summarize.py <file.docx>")
        sys.exit(1)

    summarize_docx(sys.argv[1])

