#!/usr/bin/env python3

import os
import re
import sys
import torch
import fitz  # PyMuPDF
import warnings
import multiprocessing as mp
from collections import defaultdict
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
from transformers.utils import logging as hf_logging
from rich.progress import Progress, SpinnerColumn, BarColumn, TimeElapsedColumn, TimeRemainingColumn
from rich.console import Console
from datetime import datetime, timezone
import time
import psutil

# Setup
hf_logging.set_verbosity_error()
warnings.filterwarnings("ignore", category=FutureWarning)
os.environ["TOKENIZERS_PARALLELISM"] = "false"

# Explicitly set multiprocessing start method
try:
    mp.set_start_method("spawn", force=True)
except RuntimeError:
    pass

# Device selection
if torch.cuda.is_available():
    DEVICE = "cuda"
elif torch.backends.mps.is_available():
    DEVICE = "mps"
else:
    DEVICE = "cpu"

# === CUSTOM MODULE IMPORT ===
tools_py_path = os.path.abspath(os.path.join('tools_py'))
if tools_py_path not in sys.path:
    sys.path.append(tools_py_path)
from modules.globals import get_key_value_from_yml, clean_up_text, get_env_value, generate_random_string

auth_token = get_env_value('.env', 'HUGGINGFACE_KEY')

# === SETTINGS ===
build_settings_path = '_data/buildConfig.yml'
MODEL_NAME = get_key_value_from_yml(build_settings_path, 'elements')['extDocSummary']['pdf_sum_model']
MAX_INPUT_TOKENS = 512
SUMMARY_TOKENS = 200

console = Console()

# Memory and CPU limits
MEM_LIMIT_PERCENT = 80
CPU_LIMIT_PERCENT = 80

# ---- Heuristics ---- #
def is_probably_structural(text):
    lines = text.splitlines()
    if len(lines) <= 2 and len(text.split()) < 25:
        return True
    digit_lines = sum(1 for line in lines if re.search(r'\d{1,2}(\.\d{1,2}){0,3}$', line.strip()))
    if digit_lines > len(lines) * 0.5:
        return True
    punctuation_ratio = sum(1 for c in text if not c.isalnum() and c not in ' \n') / max(1, len(text))
    if punctuation_ratio > 0.2 and len(text) < 300:
        return True
    no_full_sentences = all(not re.search(r'\.\s|!\s|\?\s', line) for line in lines)
    if no_full_sentences and len(text.split()) < 40:
        return True
    return False

def is_probably_reference_section(text):
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    if not lines:
        return False
    first_line = lines[0].lower()
    if re.match(r'^(references|bibliography|works cited|citations)\s*$', first_line):
        return True
    citation_like_lines = 0
    for line in lines:
        if re.search(r'\[\d+\]', line) or re.search(r'\(\d{4}\)', line) or re.search(r'doi:\s*10\.', line, re.I):
            citation_like_lines += 1
    return (citation_like_lines / len(lines)) > 0.4

# ---- Helpers ---- #
import nltk
import contextlib
from nltk.tokenize.punkt import PunktSentenceTokenizer, PunktParameters

# Make sure to download the pretrained tokenizer if not already done
with contextlib.redirect_stdout(None), contextlib.redirect_stderr(None):
    try:
        nltk.data.find("tokenizers/punkt")
    except LookupError:
        nltk.download("punkt", quiet=True)

def text_to_html_paragraphs(text, max_sentences=3):
    punkt_param = PunktParameters()
    # Add domain-specific abbreviations
    abbreviations = ["U.S", "IMP", "TS", "D11"]
    punkt_param.abbrev_types = set(abbreviations)
    tokenizer = PunktSentenceTokenizer(punkt_param)

    sentences = tokenizer.tokenize(text.strip())

    paragraphs = []
    current_paragraph = []

    for sentence in sentences:
        if len(sentence) < 20 and current_paragraph:
            paragraphs.append(" ".join(current_paragraph))
            current_paragraph = [sentence]
        else:
            current_paragraph.append(sentence)

        if len(current_paragraph) >= max_sentences:
            paragraphs.append(" ".join(current_paragraph))
            current_paragraph = []

    if current_paragraph:
        paragraphs.append(" ".join(current_paragraph))

    html_paragraphs = "\n\n".join(f"<p>{p}</p>" for p in paragraphs)
    return html_paragraphs

# ---- PDF Parsing ---- #
def extract_structure(pdf_path):
    doc = fitz.open(pdf_path)
    sections = []
    current = {"title": "Introduction", "content": []}

    def flush():
        if current["content"]:
            text = "\n".join(current["content"]).strip()
            if text:
                skip = is_probably_structural(text) or is_probably_reference_section(text)
                sections.append({
                    "title": current["title"],
                    "text": text,
                    "skip_summary": skip
                })
            current["content"].clear()

    # ---- Table detection ---- #
    from collections import Counter

    def is_probably_table_block(block_text):
        lines = [line.strip() for line in block_text.splitlines() if line.strip()]
        if not lines:
            return False

        # Heuristic 1: tabs or pipes
        if any('\t' in line or '|' in line for line in lines):
            return True

        # Heuristic 2: consistent number of columns
        delimiter_counts = [len(re.split(r'[\t|,;]', line)) for line in lines]
        if len(set(delimiter_counts)) <= 2 and len(delimiter_counts) > 1:
            return True

        # Heuristic 3: high density of non-alphanumeric chars
        non_alnum_ratio = len(re.findall(r'[^a-zA-Z0-9\s]', block_text)) / max(len(block_text), 1)
        if len(block_text) > 100 and non_alnum_ratio > 0.2:
            return True

        # Heuristic 4: many short tokens per line (like numbers or short words)
        short_token_lines = sum(
            1 for line in lines if all(len(tok) <= 6 for tok in line.split() if tok)
        )
        if short_token_lines / len(lines) > 0.5:
            return True

        return False

    # ---- Table detection ---- #



    for page in doc:
        blocks = page.get_text("blocks")
        blocks.sort(key=lambda b: (b[1], b[0]))
        for block in blocks:
            text = block[4].strip()
            if not text:
                continue
            if is_probably_table_block(text):
                continue
            if re.match(r'^[A-Z][\w\s]{0,60}$', text) and len(text.split()) <= 10:
                flush()
                current["title"] = text
            else:
                current["content"].append(text)

    flush()
    return sections

# ---- Chunking ---- #
def chunk_text(text, tokenizer, max_tokens):
    sentences = re.split(r'(?<=[.!?]) +', text)
    chunks, current = [], ""
    for sent in sentences:
        token_count = len(tokenizer.tokenize(current + sent))
        if token_count < max_tokens:
            current += sent + " "
        else:
            chunks.append(current.strip())
            current = sent + " "
    if current:
        chunks.append(current.strip())
    return chunks

def summarize_chunk(text, tokenizer, model):
    input_ids = tokenizer(text, return_tensors="pt", truncation=True, max_length=MAX_INPUT_TOKENS).input_ids.to(model.device)
    with torch.no_grad():
        output_ids = model.generate(
            input_ids,
            max_length=SUMMARY_TOKENS,
            num_beams=4,
            no_repeat_ngram_size=3,
            repetition_penalty=2.0,
            early_stopping=True
        )
    return tokenizer.decode(output_ids[0], skip_special_tokens=True)

# ---- Worker ---- #
def summarize_section_worker(section_idx, title, text, model_name, device, auth_token, progress_queue):
    torch.set_num_threads(1)
    tokenizer = AutoTokenizer.from_pretrained(model_name, use_auth_token=auth_token)
    model = AutoModelForSeq2SeqLM.from_pretrained(model_name, use_auth_token=auth_token).to(device)

    chunks = chunk_text(text, tokenizer, MAX_INPUT_TOKENS)
    summaries = []
    for i, chunk in enumerate(chunks, 1):
        summaries.append(summarize_chunk(chunk, tokenizer, model))
        progress_queue.put((section_idx, i, len(chunks)))

    raw_summary = " ".join(summaries)
    final_summary = clean_up_text(raw_summary)
    return (section_idx, title, re.sub(r'\s+', ' ', final_summary).strip())

# ---- Output ---- #
def write_output(sections, combined_summary, out_path, pdf_file_name, pdf_file_path):
    now = datetime.now(timezone.utc)
    front_matter = (
        f"---\nsummaryType: autoPDFSummary\nsummaryFor: {pdf_file_name}\n"
        f"fullPath: {pdf_file_path}\n"
        f"dateTime: \"{now.strftime('%Y-%m-%d %H:%M:%S')}\"\n"
        f"timestamp: {int(time.time() * 1000)}\n---\n\n"  # extra blank line here
    )

    with open(out_path, "w", encoding="utf-8") as f:
        f.write(front_matter)
        f.write(combined_summary)

def clear_line():
    sys.stdout.write("\r\033[K")
    sys.stdout.flush()

# ---- Main ---- #
def main(pdf_file_path):
    pdf_file_name = os.path.basename(pdf_file_path)
    out_file_path = os.path.splitext(pdf_file_path)[0] + "__pdf_summary.txt"

    clear_line()
    console.print(f"🔎 Extracting structure from [bold]{pdf_file_name}[/bold] ...")
    sections = extract_structure(pdf_file_path)

    clear_line()
    console.print(f"⏳ Summarizing sections with model [bold]{MODEL_NAME}[/bold]: ")
    
    model_mem_estimate_gb = 8
    total_mem_gb = psutil.virtual_memory().total / (1024 ** 3)
    
    max_processes_by_mem = int((total_mem_gb * MEM_LIMIT_PERCENT / 100) / model_mem_estimate_gb)
    max_processes_by_cpu = int(psutil.cpu_count(logical=True) * CPU_LIMIT_PERCENT / 100)
    
    num_workers = max(1, min(max_processes_by_mem, max_processes_by_cpu))
    
    clear_line()
    console.print(f"🧠 Limiting to {num_workers} processes to stay within resource constraints.")
    
    manager = mp.Manager()
    progress_queue = manager.Queue()

    pool = mp.Pool(processes=num_workers)
    results = []
    
    for idx, section in enumerate(sections):
        if not section["skip_summary"]:
            res = pool.apply_async(summarize_section_worker, args=(idx, section["title"], section["text"], MODEL_NAME, DEVICE, auth_token, progress_queue))
            results.append(res)
    
    pool.close()

    with Progress(SpinnerColumn(), "[progress.description]{task.description}", BarColumn(),
                  "[progress.percentage]{task.percentage:>3.0f}%", TimeElapsedColumn(),
                  TimeRemainingColumn(), console=console, transient=False) as progress:
        task = progress.add_task("[yellow]Summarizing sections: ", total=len(results))
        completed_sections_count = 0
        
        while completed_sections_count < len(results):
            try:
                section_idx, current, total_chunks = progress_queue.get(timeout=0.1)
                if current == total_chunks:
                    completed_sections_count += 1
                    progress.update(task, advance=1)
            except:
                pass

    pool.join()
    
    for r in results:
        idx, title, summary = r.get()
        sections[idx]["summary"] = summary

    # Build combined summary: clean only summaries, keep HTML titles intact
    combined_parts = []
    for sec in sections:
        summary_text = sec.get("summary", "").strip()
        if summary_text:
            cleaned_summary = text_to_html_paragraphs(clean_up_text(summary_text))
            randomId = generate_random_string()
            title_html = f'<div id="pdf_summary-section-title-{randomId}" class="pdf_summary-section-title my-2 fw-medium text-primary fs-6">{sec["title"]}</div>'
            combined_parts.append(f"{title_html}\n{cleaned_summary}")

    combined_summary = "\n\n".join(combined_parts)

    write_output(sections, combined_summary, out_file_path, pdf_file_name, pdf_file_path)
    
    print("\033[1A", end='')
    console.print(f"\n📝 Summary written to [bold green]{out_file_path}[/bold green]")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python3 script.py <pdf-file-path>")
        sys.exit(1)

    pdf_path = sys.argv[1]
    try:
        clear_line()
        console.print(f"\n==================================================================")

        with open(pdf_path, "rb") as f:
            pass
        main(pdf_path)
        clear_line()
        console.print(f"==================================================================\n\n")

    except FileNotFoundError:
        print(f"Error: File '{pdf_path}' not found.", file=sys.stderr)
        sys.exit(1)




