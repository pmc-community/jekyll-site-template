#!/usr/bin/env python3

import os
import sys
import re
import torch
import warnings
import multiprocessing as mp
from collections import defaultdict
from docx import Document
from langdetect import detect
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
from transformers.utils import logging as hf_logging
from rich.progress import Progress, SpinnerColumn, BarColumn, TextColumn, TimeElapsedColumn, TimeRemainingColumn
from rich.console import Console
import datetime
import nltk
from nltk.tokenize import sent_tokenize, PunktSentenceTokenizer
import contextlib

# Make sure to download the pretrained tokenizer if not already done
with contextlib.redirect_stdout(None), contextlib.redirect_stderr(None):
    try:
        nltk.data.find("tokenizers/punkt")
    except LookupError:
        nltk.download("punkt", quiet=True)

hf_logging.set_verbosity_error()
warnings.filterwarnings("ignore", category=FutureWarning)
os.environ["TOKENIZERS_PARALLELISM"] = "false"

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
from modules.globals import get_key_value_from_yml, clean_up_text, get_the_modified_files, get_env_value, generate_random_string
auth_token = get_env_value('.env', 'HUGGINGFACE_KEY')

# === SETTINGS ===
build_settings_path = '_data/buildConfig.yml'
MODEL_NAME = get_key_value_from_yml(build_settings_path, 'elements')['extDocSummary']['word_sum_model']
SECTION_HEADING = "Heading 1"
MAX_INPUT_TOKENS = 512
SUMMARY_TOKENS = 200

console = Console()

def clear_line():
    sys.stdout.write("\r\033[K")
    sys.stdout.flush()

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
        if re.search(r'\[\d+\]', line):
            citation_like_lines += 1
        elif re.search(r'\(\d{4}\)', line):
            citation_like_lines += 1
        elif re.search(r'\d{4}\.\s+[A-Z]', line):
            citation_like_lines += 1
        elif re.search(r'doi:\s*10\.', line, re.I):
            citation_like_lines += 1
        elif re.match(r'^\d+\.\s+[A-Z]', line):
            citation_like_lines += 1
        elif re.match(r'^[A-Z][a-z]+,\s[A-Z]\.', line):
            citation_like_lines += 1
        elif re.search(r'Vol\.\s*\d+', line, re.I):
            citation_like_lines += 1
        elif re.search(r'pp\.\s*\d+', line, re.I):
            citation_like_lines += 1
    ratio = citation_like_lines / len(lines)
    return ratio > 0.4

def extract_structure(docx_path):
    doc = Document(docx_path)
    sections = []
    current = {"title": "Introduction", "content": []}

    def flush():
        if current["content"]:
            text = "\n".join(current["content"]).strip()
            if text:
                skip = (
                    "SKIP_THIS_SECTION" in text or
                    is_probably_structural(text) or
                    is_probably_reference_section(text)
                )
                if not text.startswith("SKIP_THIS_SECTION"):
                    sections.append({
                        "title": current["title"],
                        "text": text,
                        "skip_summary": skip
                    })
                current["content"].clear()

    for para in doc.paragraphs:
        if para._element.xpath("ancestor::w:tbl"):
            continue
        style = para.style.name if para.style else ""
        text = para.text.strip()
        if not text:
            continue
        if style.startswith(SECTION_HEADING):
            flush()
            current["title"] = text
            if text.strip().lower() in {"references", "bibliography", "works cited", "citations"}:
                current["content"].append("SKIP_THIS_SECTION")
        else:
            if para.style.name.lower().startswith("list"):
                list_symbol = "*" if "bullet" in para.style.name.lower() else "-"
                current["content"].append(f"{list_symbol} {text}")
            else:
                current["content"].append(text)

    flush()
    return sections

def chunk_text(text, tokenizer, max_tokens):
    custom_tokenizer = PunktSentenceTokenizer()
    sentences = custom_tokenizer.tokenize(text)
    
    chunks = []
    current = ""
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
    input_ids = tokenizer(
        text, return_tensors="pt", truncation=True, max_length=MAX_INPUT_TOKENS
    ).input_ids.to(DEVICE)
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

def format_summary_as_markdown(text):
    text = text.replace('\n', ' ').strip()
    
    sentences = sent_tokenize(text)
    
    paragraphs = []
    current_paragraph = ""
    
    for sentence in sentences:
        if not sentence.strip():
            continue
        
        is_list_item = sentence.strip().startswith(('•', '*'))
        if len(current_paragraph.split()) + len(sentence.split()) > 70 or current_paragraph.count('.') > 3 or is_list_item:
            if current_paragraph:
                paragraphs.append(current_paragraph.strip())
            current_paragraph = sentence.strip()
        else:
            if current_paragraph:
                current_paragraph += " " + sentence.strip()
            else:
                current_paragraph = sentence.strip()

    if current_paragraph:
        paragraphs.append(current_paragraph.strip())

    return paragraphs

def deduplicate_sentences_across_all(final_summary, section_summaries):
    seen = set()
    def unique_sentences(text):
        result = []
        sentences = sent_tokenize(text)
        for sentence in sentences:
            normalized = sentence.strip().lower()
            if normalized and normalized not in seen:
                seen.add(normalized)
                result.append(sentence.strip())
        return result
    dedup_final = unique_sentences(final_summary)
    dedup_sections = []
    for sec_data in section_summaries:
        sec_text = sec_data["summary"]
        dedup_sec = []
        for sentence in sent_tokenize(sec_text):
            normalized = sentence.strip().lower()
            if normalized and normalized not in seen:
                seen.add(normalized)
                dedup_sec.append(sentence.strip())
        dedup_sections.append({
            "title": sec_data["title"],
            "summary": " ".join(dedup_sec)
        })
    return " ".join(dedup_final), dedup_sections


def write_output(sections, final_summary, out_path, docx_path):
    base, _ = os.path.splitext(out_path)
    out_path_md = base + ".txt"

    section_summaries = [
        {"title": sec["title"], "summary": sec["summary"]}
        for sec in sections if "summary" in sec and sec["summary"].strip()
    ]
    dedup_final, dedup_section_summaries = deduplicate_sentences_across_all(final_summary, section_summaries)

    file_name = os.path.basename(base)
    now = datetime.datetime.now()
    date_str = now.strftime("%Y-%m-%d %H:%M:%S")
    timestamp = int(now.timestamp())

    front_matter = (
        "---\n"
        f"summaryType: autoWordSummary\n"
        f"summaryFor: {file_name}\n"
        f"fullPath: {docx_path}\n"
        f"dateTime: \"{date_str}\"\n"
        f"timestamp: {timestamp}\n"
        "---\n\n"
    )

    with open(out_path_md, "w", encoding="utf-8") as f:
        f.write(front_matter)
        for paragraph in format_summary_as_markdown(dedup_final.strip()):
            f.write(f'<p>{paragraph}</p>\n\n')

        f.write("\n\n")

        for summary_data in dedup_section_summaries:
            title = summary_data["title"]
            summary = summary_data["summary"]
            
            if summary.strip():
                randomId = generate_random_string()
                title_tag = f'<div id="word_summary-section-title-{randomId}" class="word_summary-section-title my-2 fw-medium text-primary fs-6">{title}</div>\n'
                f.write(title_tag)
                
                for paragraph in format_summary_as_markdown(summary.strip()):
                    f.write(f'<p>{paragraph}</p>\n\n')

    with open(out_path_md, "r", encoding="utf-8") as f:
        lines = f.readlines()

    cleaned_lines = []
    blank_line = False
    for line in lines:
        if line.strip() == "":
            if not blank_line:
                cleaned_lines.append("\n")
            blank_line = True
        else:
            cleaned_lines.append(line.rstrip() + "\n")
            blank_line = False

    with open(out_path_md, "w", encoding="utf-8") as f:
        f.writelines(cleaned_lines)

    print("\033[1A", end='')
    console.print(f"\n📝 Summary written to {out_path_md}")


# 💡 NEW: This is the worker function for the multiprocessing pool.
def summarize_section(data):
    section, tokenizer, model = data
    # 💡 NEW: Move the model to the correct device inside the worker
    model.to(DEVICE)
    
    chunks = chunk_text(section["text"], tokenizer, MAX_INPUT_TOKENS)
    summaries = [summarize_chunk(chunk, tokenizer, model) for chunk in chunks]
    raw_summary = " ".join(summaries)
    return {"title": section["title"], "summary": raw_summary, "skip_summary": section["skip_summary"], "num_chunks": len(chunks)}


def summarize_docx(docx_path):
    console.print(f"📂 Reading: {docx_path}")
    sections = extract_structure(docx_path)
    full_text = " ".join([s["text"] for s in sections if not s.get("skip_summary")])
    lang = detect(full_text[:1000]) if full_text else "unknown"
    console.print(f"🌍 Detected language: {lang}")

    # 💡 NEW: Load the model on the CPU first to enable sharing
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, use_auth_token=auth_token)
    model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME, use_auth_token=auth_token)
    model.share_memory()

    pool_size = mp.cpu_count() // 2 if mp.cpu_count() > 1 else 1
    
    with mp.Pool(processes=pool_size) as pool, Progress(
        SpinnerColumn(),
        TextColumn("[bold blue]{task.description}"),
        BarColumn(),
        TextColumn("[progress.percentage]{task.percentage:>3.0f}%"),
        TimeElapsedColumn(),
        TimeRemainingColumn(),
        console=console,
        transient=False,
    ) as progress:
        
        tasks_to_run = [sec for sec in sections if not sec.get("skip_summary")]
        total_tasks = len(tasks_to_run)
        
        section_task_id = progress.add_task("[bold blue]Summarizing sections...", total=total_tasks)
        
        pool_data = [(sec, tokenizer, model) for sec in tasks_to_run]
        
        results = []
        for result in pool.imap_unordered(summarize_section, pool_data):
            results.append(result)
            progress.update(section_task_id, advance=1)
            
    progress.stop()

    section_summaries_map = {res["title"]: res for res in results}
    for i, section in enumerate(sections):
        if not section.get("skip_summary"):
            summary_data = section_summaries_map.get(section["title"])
            if summary_data:
                section["summary"] = summary_data["summary"]

    print("\033[1A", end='')
    print("\033[1A", end='')
    console.print("\n🧠 Creating final document summary...")
    
    # 💡 NEW: Move the model to the device for the final summary step
    model.to(DEVICE)
    all_section_summaries = " ".join(s.get("summary", "") for s in sections if not s.get("skip_summary"))
    
    combined_text = full_text + " " + all_section_summaries
    final_summary_text = summarize_chunk(combined_text, tokenizer, model)

    base_name = os.path.splitext(os.path.basename(docx_path))[0]
    dir_name = os.path.dirname(docx_path)
    out_path = os.path.join(dir_name, base_name + "__word_summary.txt")
    write_output(sections, final_summary_text, out_path, docx_path)

if __name__ == "__main__":
    mp.set_start_method("spawn", force=True) # 💡 NEW: Set start method to 'spawn' for better memory management
    
    clear_line()
    console.print(f"\n==================================================================")
    
    if len(sys.argv) < 2:
        console.print("Usage: python summarize_docx.py file1.docx [file2.docx ...]")
        sys.exit(1)

    for file_path in sys.argv[1:]:
        if not os.path.exists(file_path):
            console.print(f"[red]File not found:[/red] {file_path}")
            continue
        summarize_docx(file_path)
    
    clear_line()
    console.print(f"==================================================================\n\n");