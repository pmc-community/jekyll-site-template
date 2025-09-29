#!/usr/bin/env python3
"""
Multiprocessing-safe keyword extraction script.

- No global model initialization at import time.
- Lazy per-process model initialization via get_models().
- Removed os.execv restart behavior that caused subprocess restarts.
- Use 'spawn' start method in __main__ (set there) to avoid fork-related issues.
- Stanza initialization/download is performed safely per-process with a lock.

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
import multiprocessing
import psutil
import threading
import time
import signal
from threading import Lock

# === CUSTOM MODULE IMPORT ===
tools_py_path = os.path.abspath(os.path.join("tools_py"))
if tools_py_path not in sys.path:
    sys.path.append(tools_py_path)

# modules.globals should provide helpers used previously
from modules.globals import (
    get_key_value_from_yml,
    clean_up_text,
    get_the_modified_files,
    get_env_value,
)

# Load auth token (keeps same behavior)
auth_token = get_env_value(".env", "HUGGINGFACE_KEY")

# ─── ENV & RESOURCE LIMITS ───────────────────────────────────────────────────
# avoid execv restart which breaks multiprocessing
os.environ.setdefault("PYTHONMALLOC", "default")

total_memory = psutil.virtual_memory().total
max_memory_bytes = int(total_memory * 0.6)
os.environ["TRANSFORMERS_MAX_MEM"] = str(max_memory_bytes)

max_threads = max(1, int(multiprocessing.cpu_count() * 0.6))
os.environ["OMP_NUM_THREADS"] = str(max_threads)
os.environ["OPENBLAS_NUM_THREADS"] = str(max_threads)
os.environ["MKL_NUM_THREADS"] = str(max_threads)
os.environ["VECLIB_MAXIMUM_THREADS"] = str(max_threads)
os.environ["NUMEXPR_NUM_THREADS"] = str(max_threads)

# Force CPU-only (keeps your original intent)
os.environ.setdefault("CUDA_VISIBLE_DEVICES", "-1")
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "3")
os.environ.setdefault("TF_FORCE_GPU_ALLOW_GROWTH", "true")

# suppress noisy logs
logging.getLogger("stanza").setLevel(logging.ERROR)
logging.getLogger("absl").setLevel(logging.ERROR)
logging.getLogger("tensorflow").setLevel(logging.FATAL)

# suppress transformers logs when imported
from transformers import logging as hf_logging

hf_logging.set_verbosity_error()
warnings.filterwarnings("ignore", category=UserWarning, module="transformers")
warnings.filterwarnings("ignore", category=FutureWarning, module="huggingface_hub")
warnings.filterwarnings("ignore")

# ─── CONFIG ───────────────────────────────────────────────────────────────────
build_settings_path = "_data/buildConfig.yml"
page_keywords_cfg = get_key_value_from_yml(build_settings_path, "pageKeywords")

model_name = page_keywords_cfg.get("model", "t5-small")
MIN_KEYWORDS = int(page_keywords_cfg.get("minKeywords", 5))
MAX_KEYWORDS = int(page_keywords_cfg.get("maxKeywords", 20))
MAX_INPUT_TOKENS = 512
MAX_PER_CHUNK = 5

# ─── MEMORY WATCHER ───────────────────────────────────────────────────────────
def start_memory_watcher(limit_bytes, interval=1.0):
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


# ─── LAZY MODELS: safe per-process initialization ─────────────────────────────
_models = {}
_models_lock = Lock()
_stanza_lock = Lock()
_STANZA_CACHE_DIR = os.path.expanduser("~/.cache/stanza")


def detect_device():
    # keep detection consistent per-process
    import torch

    if torch.cuda.is_available():
        return "cuda"
    elif getattr(torch.backends, "mps", None) and torch.backends.mps.is_available():
        return "mps"
    else:
        return "cpu"


def stanza_model_installed(lang):
    model_dir = os.path.join(_STANZA_CACHE_DIR, f"{lang}_models")
    return os.path.exists(model_dir)


def ensure_stanza_model(lang):
    # initialize stanza pipeline for given lang in a process-safe way
    import stanza

    with _stanza_lock:
        try:
            # simple cache by language per-process
            if not stanza_model_installed(lang):
                stanza.download(lang, package="default", verbose=False)
            nlp = stanza.Pipeline(
                lang=lang, processors="tokenize,pos", verbose=False, tokenize_no_ssplit=True
            )
            return nlp
        except Exception:
            return None


def get_models():
    """
    Initialize heavy models per-process (called lazily).
    Returns dict with tokenizer, model, text_generator, embedder.
    """
    global _models
    if _models:
        return _models

    with _models_lock:
        if _models:
            return _models

        # Imports done here to keep module import light and safe for multiprocessing
        from transformers import AutoTokenizer, AutoModelForSeq2SeqLM, pipeline
        from sentence_transformers import SentenceTransformer

        # choose device for sentence-transformers; pipeline will run on CPU (device=-1)
        DEVICE = detect_device()

        # Create tokenizer & seq2seq model
        tokenizer = AutoTokenizer.from_pretrained(model_name, token=auth_token, legacy=False)
        model = AutoModelForSeq2SeqLM.from_pretrained(model_name, token=auth_token)
        # Move the model to CPU (we enforce CPU-only with CUDA_VISIBLE_DEVICES=-1),
        # but still keep explicit to avoid surprises.
        try:
            import torch

            model = model.to(torch.device("cpu"))
        except Exception:
            pass

        text_generator = pipeline(
            "text2text-generation", model=model, tokenizer=tokenizer, device=-1
        )

        # SentenceTransformer embedder
        embedder = SentenceTransformer("intfloat/e5-base-v2", token=auth_token, device=DEVICE)
        # make sure it's not too long
        try:
            embedder.max_seq_length = 256
        except Exception:
            pass

        _models = {
            "tokenizer": tokenizer,
            "model": model,
            "text_generator": text_generator,
            "embedder": embedder,
            "device": DEVICE,
        }
        return _models


# ─── UTIL FUNCTIONS (use get_models() inside to access tokenizer/embedder/generator) ─────────────────────────
INVALID_TOKEN_PATTERN = re.compile(r"(<.*?>|extra_id_\d+)", re.IGNORECASE)
PUNCTUATION_TABLE = str.maketrans("", "", string.punctuation)
FORBIDDEN_UPOS = {"VERB", "ADV"}


def detect_language(text):
    from langdetect import detect, LangDetectException

    try:
        return detect(text)
    except LangDetectException:
        return "en"
    except Exception:
        return "en"


def get_stopwords(lang_code):
    import stopwordsiso

    try:
        return stopwordsiso.stopwords(lang_code) or stopwordsiso.stopwords("en")
    except Exception:
        return stopwordsiso.stopwords("en")


def remove_code_blocks(text):
    text = re.sub(r"```[\s\S]*?```", "", text)
    text = re.sub(r"^( {4}|\t).*$", "", text, flags=re.MULTILINE)
    return text


def clean_keyword(word):
    word = word.lower().strip().translate(PUNCTUATION_TABLE)
    word = INVALID_TOKEN_PATTERN.sub("", word)
    if not word or word.isnumeric() or len(word) < 3 or len(word.split()) > 4:
        return None
    return word


def truncate_input(text):
    models = get_models()
    tokenizer = models["tokenizer"]
    # use tokenizer to truncate safely
    tokens = tokenizer.encode(text, truncation=True, max_length=MAX_INPUT_TOKENS, return_tensors="pt")
    decoded = tokenizer.decode(tokens[0], skip_special_tokens=True)
    return INVALID_TOKEN_PATTERN.sub("", decoded).strip()


def filter_verbs_adverbs(candidates, lang):
    # Use stanza to remove verbs/adverbs if possible
    nlp = ensure_stanza_model(lang)
    if not nlp:
        return candidates[:MAX_KEYWORDS]

    # join to a single text; stanza will tokenize/pos-tag
    try:
        doc = nlp(" ".join(candidates))
    except Exception:
        return candidates[:MAX_KEYWORDS]

    filtered, seen = [], set()
    candidates_lower = [c.lower() for c in candidates]
    for sent in doc.sentences:
        for w in sent.words:
            lw = w.text.lower()
            if lw in candidates_lower and w.upos not in FORBIDDEN_UPOS:
                if lw not in seen:
                    filtered.append(w.text)
                    seen.add(lw)
    return filtered


def basic_chunk(sentences, max_tokens):
    models = get_models()
    tokenizer = models["tokenizer"]

    chunks, current, curr_len = [], [], 0
    for s in sentences:
        toks = tokenizer.encode(s, add_special_tokens=False)
        if curr_len + len(toks) <= max_tokens:
            current.append(s)
            curr_len += len(toks)
        else:
            if current:
                chunks.append(" ".join(current))
            current, curr_len = [s], len(toks)
    if current:
        chunks.append(" ".join(current))
    return chunks


def semantic_chunk(text, max_chunk_tokens=512, sim_thresh=0.65):
    # sentence tokenization and semantic clustering using embedder
    from nltk.tokenize import sent_tokenize

    models = get_models()
    embedder = models["embedder"]
    DEVICE = models.get("device", "cpu")

    sents = sent_tokenize(text)
    if not sents:
        return []

    clusters, current, agg_emb = [], [sents[0]], None
    for sent in sents:
        # encode single sentence; use torch.no_grad implicitly inside SentenceTransformer
        try:
            new_emb = embedder.encode(
                sent, convert_to_tensor=True, normalize_embeddings=True
            )
        except Exception:
            # fallback: append sentence to current cluster
            if agg_emb is None:
                agg_emb = None
            current.append(sent)
            continue

        if agg_emb is None:
            agg_emb = new_emb
        else:
            from sentence_transformers import util

            sim = util.cos_sim(agg_emb, new_emb).item()
            if sim < sim_thresh:
                clusters.append(" ".join(current))
                current, agg_emb = [sent], new_emb
            else:
                current.append(sent)
                # running average (tensor)
                try:
                    agg_emb = (agg_emb + new_emb) / 2
                except Exception:
                    agg_emb = new_emb

    if current:
        clusters.append(" ".join(current))

    # ensure chunks are not above token size
    final = []
    for c in clusters:
        models = get_models()
        tokenizer = models["tokenizer"]
        toks = tokenizer.encode(c, add_special_tokens=False)
        if len(toks) <= max_chunk_tokens:
            final.append(c)
        else:
            # break by sentence groups
            final.extend(basic_chunk(c.split(". "), max_chunk_tokens))
    return final


def extract_keywords(text, max_keywords):
    models = get_models()
    tokenizer = models["tokenizer"]
    text_generator = models["text_generator"]

    text = truncate_input(text)
    from nltk.tokenize import sent_tokenize, word_tokenize
    from collections import Counter

    # Split into manageable chunks
    if len(tokenizer.encode(text)) > MAX_INPUT_TOKENS:
        chunks = basic_chunk(sent_tokenize(text), MAX_INPUT_TOKENS)
    else:
        chunks = [text]

    lang = detect_language(text)
    sw = get_stopwords(lang)

    candidates = []

    # ── 1) MODEL-GENERATED KEYWORDS ─────────────────────
    for chunk in chunks:
        try:
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                raw = text_generator(
                    chunk, max_new_tokens=64, do_sample=False, num_return_sequences=1
                )[0]["generated_text"]
        except Exception:
            raw = ""

        raw = INVALID_TOKEN_PATTERN.sub("", raw)
        for k in re.split(r"[\n,;]+", raw):
            c = clean_keyword(k.strip())
            if c and c not in sw:
                candidates.append(c)

    # ── 2) NOUN PHRASE CANDIDATES (stanza/nltk fallback) ─────────────────────
    try:
        nlp = ensure_stanza_model(lang)
        if nlp:
            doc = nlp(text)
            for sent in doc.sentences:
                np = []
                for w in sent.words:
                    if w.upos in {"NOUN", "PROPN", "ADJ"}:
                        np.append(w.text)
                    else:
                        if np:
                            phrase = " ".join(np).lower()
                            if phrase not in sw and len(phrase) > 2:
                                candidates.append(phrase)
                            np = []
                if np:
                    phrase = " ".join(np).lower()
                    if phrase not in sw and len(phrase) > 2:
                        candidates.append(phrase)
    except Exception:
        words = [w.lower() for w in word_tokenize(text) if w.isalpha() and w.lower() not in sw]
        counts = Counter(words)
        for w, _ in counts.most_common(max_keywords * 2):
            candidates.append(w)

    # ── 3) DEDUP + RANKING ─────────────────────────────
    counts = Counter(candidates)
    sorted_candidates = sorted(
        counts.items(),
        key=lambda x: (counts[x[0]], len(x[0])),
        reverse=True,
    )
    filtered = [kw for kw, _ in sorted_candidates]

    # Remove verbs/adverbs if stanza available
    filtered = filter_verbs_adverbs(filtered, lang)

    return filtered[:max_keywords]


# ─── MAIN ENTRY ──────────────────────────────────────────────────────────────
def process_content(filename, content):
    """
    Returns JSON-compatible dict: {"keywords": [...]}
    """
    if not content.strip():
        return {"keywords": []}

    try:
        language = detect_language(content)
    except Exception:
        language = "en"

    # Print a small status to stderr as before
    YELLOW = "\033[33m"
    RESET = "\033[0m"
    sys.stderr.write("\r\033[K")
    print(f"{YELLOW}- PERMALINK: {filename} ... {language}{RESET}", file=sys.stderr)

    content = remove_code_blocks(content)
    content = truncate_input(content)

    chunks = semantic_chunk(content, max_chunk_tokens=MAX_INPUT_TOKENS)
    if not chunks:
        chunks = [content]

    all_kw, seen = [], set()
    for ch in chunks:
        kws = extract_keywords(ch, MAX_PER_CHUNK)
        for kw in kws:
            lw = kw.lower()
            if lw not in seen:
                all_kw.append(kw)
                seen.add(lw)
            if len(all_kw) >= MAX_KEYWORDS:
                break
        if len(all_kw) >= MAX_KEYWORDS:
            break

    if not all_kw:
        sw = get_stopwords(language)
        words = [w.lower() for w in re.findall(r"\b\w+\b", content) if w.lower() not in sw]
        all_kw = words[:MAX_KEYWORDS]

    lowercase_keywords = [kw.lower() for kw in all_kw[:MAX_KEYWORDS]]
    return {"keywords": lowercase_keywords}


if __name__ == "__main__":
    # Use spawn to avoid fork-related copy-on-write issues with heavy models
    try:
        multiprocessing.set_start_method("spawn", force=True)
    except RuntimeError:
        # already set; ignore
        pass

    start_memory_watcher(max_memory_bytes)

    # Read filename from argv (as your original script did)
    fn = sys.argv[2] if len(sys.argv) > 2 else "unknownFile"
    content = sys.stdin.read()

    result = process_content(fn, content)

    # Output JSON and exit
    print(json.dumps(result, indent=2, ensure_ascii=False))
    sys.exit(0)
