#!/usr/bin/env python3
"""
Single-process keyword extraction script using KeyBERT (MMR).

- All models are initialized once, lazily.
- Strict 40% resource limits apply to the main process.
- Extracts ONLY single-word keywords.
- Ensures uniqueness and sorts by relevance score (descending).

Usage:
    cat file.txt | python3 this_script.py <arg1> <filename>
"""

import sys
import os
import re
import string
import warnings
import json
import logging
import psutil
import threading
import time
import signal
from typing import List, Dict

# === CUSTOM MODULE IMPORT ===
tools_py_path = os.path.abspath(os.path.join("tools_py"))
if tools_py_path not in sys.path:
    sys.path.append(tools_py_path)

from modules.globals import (
    get_key_value_from_yml,
    get_env_value,
)

# Load auth token
auth_token = get_env_value(".env", "HUGGINGFACE_KEY")

# ─── ENV & RESOURCE LIMITS (STRICT 40% MAX) ──────────────────────────────────
RESOURCE_LIMIT_PERCENT = 0.40
SINGLE_THREADED = True

# Memory Limit
total_memory = psutil.virtual_memory().total
MAX_MEMORY_BYTES = int(total_memory * RESOURCE_LIMIT_PERCENT)
os.environ["TRANSFORMERS_MAX_MEM"] = str(MAX_MEMORY_BYTES)

# Thread/CPU Limit
MAX_THREADS = max(1, int(os.cpu_count() * RESOURCE_LIMIT_PERCENT))
os.environ["OMP_NUM_THREADS"] = str(MAX_THREADS)
os.environ["OPENBLAS_NUM_THREADS"] = str(MAX_THREADS)
os.environ["MKL_NUM_THREADS"] = str(MAX_THREADS)
os.environ["VECLIB_MAXIMUM_THREADS"] = str(MAX_THREADS)
os.environ["NUMEXPR_NUM_THREADS"] = str(MAX_THREADS)

# Force CPU-only
os.environ.setdefault("CUDA_VISIBLE_DEVICES", "-1")
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "3")
os.environ.setdefault("TF_FORCE_GPU_ALLOW_GROWTH", "true")

# Suppress noisy logs
logging.getLogger("stanza").setLevel(logging.ERROR)
logging.getLogger("absl").setLevel(logging.ERROR)
logging.getLogger("tensorflow").setLevel(logging.FATAL)

from transformers import logging as hf_logging
hf_logging.set_verbosity_error()
warnings.filterwarnings("ignore", category=UserWarning, module="transformers")
warnings.filterwarnings("ignore", category=FutureWarning, module="huggingface_hub")
warnings.filterwarnings("ignore")

# ─── CONFIG ───────────────────────────────────────────────────────────────────
build_settings_path = "_data/buildConfig.yml"
page_keywords_cfg = get_key_value_from_yml(build_settings_path, "pageKeywords")

MIN_KEYWORDS = int(page_keywords_cfg.get("minKeywords", 5))
MAX_KEYWORDS = int(page_keywords_cfg.get("maxKeywords", 20))
MAX_INPUT_TOKENS = 512

# ─── SINGLETONS AND MEMORY WATCHER ────────────────────────────────────────────
_MODELS = {}
_DEVICE = None

def detect_device():
    global _DEVICE
    if _DEVICE is not None:
        return _DEVICE

    try:
        import torch
        if torch.cuda.is_available():
            _DEVICE = "cuda"
        elif getattr(torch.backends, "mps", None) and torch.backends.mps.is_available():
            _DEVICE = "mps"
        else:
            _DEVICE = "cpu"
    except Exception:
        _DEVICE = "cpu"
    
    return _DEVICE


def start_memory_watcher(limit_bytes, interval=1.0):
    """Monitors the single process's memory usage."""
    def monitor():
        proc = psutil.Process(os.getpid())
        while True:
            try:
                if proc.memory_info().rss > limit_bytes:
                    print(json.dumps({"error": "Memory limit exceeded"}, indent=2))
                    os.kill(os.getpid(), signal.SIGTERM)
            except Exception:
                pass
            time.sleep(interval)

    threading.Thread(target=monitor, daemon=True).start()


def get_models() -> Dict:
    """Initialize heavy models once (lazily)."""
    global _MODELS
    if _MODELS:
        return _MODELS

    from sentence_transformers import SentenceTransformer
    from keybert import KeyBERT
    from transformers import AutoTokenizer

    DEVICE = detect_device()

    embedder = SentenceTransformer("intfloat/e5-base-v2", token=auth_token, device=DEVICE)
    try:
        embedder.max_seq_length = 256
    except Exception:
        pass

    kw_model = KeyBERT(model=embedder)
    tokenizer = AutoTokenizer.from_pretrained("intfloat/e5-base-v2", legacy=False, token=auth_token)

    _MODELS = {
        "tokenizer": tokenizer,
        "kw_model": kw_model,
        "device": DEVICE,
    }
    return _MODELS

# ─── CORE UTIL FUNCTIONS ─────────────────────────────────────────────────────
INVALID_TOKEN_PATTERN = re.compile(r"(<.*?>|extra_id_\d+)", re.IGNORECASE)


def remove_code_blocks(text: str) -> str:
    text = re.sub(r"```[\s\S]*?```", "", text)
    text = re.sub(r"^( {4}|\t).*$", "", text, flags=re.MULTILINE)
    return text


def truncate_input(text: str) -> str:
    models = get_models()
    tokenizer = models["tokenizer"]
    tokens = tokenizer.encode(text, truncation=True, max_length=MAX_INPUT_TOKENS, return_tensors="pt")
    decoded = tokenizer.decode(tokens[0], skip_special_tokens=True)
    return INVALID_TOKEN_PATTERN.sub("", decoded).strip()


def extract_keywords_keybert(text: str, max_keywords: int) -> List[str]:
    """
    Keyword extraction using KeyBERT (MMR) for single-word keywords only.
    Output is unique and sorted by relevance score (descending).
    """
    kw_model = get_models()["kw_model"]
    text = truncate_input(text)

    try:
        keywords_with_score = kw_model.extract_keywords(
            docs=text,
            keyphrase_ngram_range=(1, 1),  # ✅ Only single words
            stop_words="english",
            use_mmr=True,
            diversity=0.7,
            top_n=max_keywords * 3,  # more candidates
            nr_candidates=max_keywords * 4,
        )

        # Filter and sort
        filtered = [
            (kw.strip().lower(), score)
            for kw, score in keywords_with_score
            if len(kw.split()) == 1 and kw.isalpha()
        ]

        # Sort by score (descending) and remove duplicates (preserving best score)
        seen = set()
        unique_sorted = []
        for kw, score in sorted(filtered, key=lambda x: x[1], reverse=True):
            if kw not in seen:
                seen.add(kw)
                unique_sorted.append(kw)
            if len(unique_sorted) >= max_keywords:
                break

        return unique_sorted

    except Exception:
        # Fallback: simple single-word frequency
        words = re.findall(r"\b[a-zA-Z]{3,}\b", text.lower())
        from collections import Counter
        counts = Counter(words)
        return [w for w, _ in counts.most_common(max_keywords)]

# ─── MAIN EXECUTION ──────────────────────────────────────────────────────────
def process_content(filename: str, content: str) -> Dict:
    """
    Main single-process function.
    Returns JSON-compatible dict: {"keywords": [...]}.
    """
    if not content.strip():
        return {"keywords": []}

    YELLOW = "\033[33m"
    RESET = "\033[0m"
    sys.stderr.write("\r\033[K")
    print(f"{YELLOW}- PERMALINK: {filename} ... extracting keywords {RESET}", file=sys.stderr)

    content = remove_code_blocks(content)
    
    all_kw = extract_keywords_keybert(content, MAX_KEYWORDS)
    return {"keywords": all_kw}


if __name__ == "__main__":
    start_memory_watcher(MAX_MEMORY_BYTES)

    fn = sys.argv[2] if len(sys.argv) > 2 else "unknownFile"
    content = sys.stdin.read()

    result = process_content(fn, content)

    print(json.dumps(result, indent=2, ensure_ascii=False))
    sys.exit(0)
