#!/usr/bin/env python3

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

if os.environ.get("PYTHONMALLOC") != "default":
    os.environ["PYTHONMALLOC"] = "default"
    os.execv(sys.executable, [sys.executable] + sys.argv)

# ─── RESOURCE LIMITS ─────────────────────────────────────
total_memory = psutil.virtual_memory().total
max_memory_bytes = int(total_memory * 0.6)
os.environ["TRANSFORMERS_MAX_MEM"] = str(max_memory_bytes)

max_threads = max(1, int(multiprocessing.cpu_count() * 0.6))
os.environ["OMP_NUM_THREADS"] = str(max_threads)
os.environ["OPENBLAS_NUM_THREADS"] = str(max_threads)
os.environ["MKL_NUM_THREADS"] = str(max_threads)
os.environ["VECLIB_MAXIMUM_THREADS"] = str(max_threads)
os.environ["NUMEXPR_NUM_THREADS"] = str(max_threads)

# CPU-only enforcement
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
os.environ["TF_FORCE_GPU_ALLOW_GROWTH"] = "true"

# ─── LOGGING ─────────────────────────────────────────────
logging.getLogger("stanza").setLevel(logging.ERROR)
from transformers import logging as hf_logging
hf_logging.set_verbosity_error()

# Suppress absl logging
logging.getLogger('absl').setLevel(logging.ERROR)
logging.getLogger('tensorflow').setLevel(logging.FATAL)

# ─── MEMORY WATCHER ──────────────────────────────────────
def start_memory_watcher(limit_bytes, interval=1.0):
    def monitor():
        proc = psutil.Process(os.getpid())
        while True:
            if proc.memory_info().rss > limit_bytes:
                print(json.dumps({"error": "Memory limit exceeded"}, indent=2))
                os.kill(os.getpid(), signal.SIGTERM)
            time.sleep(interval)
    threading.Thread(target=monitor, daemon=True).start()

# ─── NLTK & DEPENDENCIES ────────────────────────────────
import nltk
nltk.download("punkt", quiet=True)

import torch
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM, pipeline
from sentence_transformers import SentenceTransformer, util
import stopwordsiso
import stanza
from threading import Lock

# ─── LOCAL TOOL HELPERS ─────────────────────────────────
tools_py_path = os.path.abspath(os.path.join('tools_py'))
if tools_py_path not in sys.path:
    sys.path.append(tools_py_path)
from modules.globals import get_key_value_from_yml

# ─── CONFIG ─────────────────────────────────────────────
build_settings_path = '_data/buildConfig.yml'
page_keywords_cfg = get_key_value_from_yml(build_settings_path, 'pageKeywords')

model_name = page_keywords_cfg.get('model', 't5-small')
MIN_KEYWORDS = int(page_keywords_cfg.get('minKeywords', 5))
MAX_KEYWORDS = int(page_keywords_cfg.get('maxKeywords', 20))
MAX_INPUT_TOKENS = 512
MAX_PER_CHUNK = 5

warnings.filterwarnings("ignore", category=UserWarning, module="transformers")
warnings.filterwarnings("ignore", category=FutureWarning, module="huggingface_hub")
warnings.filterwarnings("ignore")

DEVICE = "cpu"

# ─── INIT MODELS ─────────────────────────────────────────
tokenizer = AutoTokenizer.from_pretrained(model_name, legacy=False)
model = AutoModelForSeq2SeqLM.from_pretrained(model_name).to(DEVICE)
text_generator = pipeline("text2text-generation", model=model, tokenizer=tokenizer, device=-1)

embedder = SentenceTransformer("intfloat/e5-base-v2", device=DEVICE)
embedder.max_seq_length = 256

# ─── STANZA PATCHED INITIALIZATION ──────────────────────
stanza_lock = Lock()
stanza_initialized = {}
STANZA_CACHE_DIR = os.path.expanduser("~/.cache/stanza")

def stanza_model_installed(lang):
    model_dir = os.path.join(STANZA_CACHE_DIR, f"{lang}_models")
    return os.path.exists(model_dir)

def ensure_stanza_model(lang):
    with stanza_lock:
        if lang in stanza_initialized:
            return stanza_initialized[lang]
        try:
            if not stanza_model_installed(lang):
                stanza.download(lang, package='default', verbose=False)
            nlp = stanza.Pipeline(
                lang=lang,
                processors="tokenize,pos",
                verbose=False,
                tokenize_no_ssplit=True
            )
            stanza_initialized[lang] = nlp
            return nlp
        except Exception:
            stanza_initialized[lang] = None
            return None

# ─── UTILS ───────────────────────────────────────────────
INVALID_TOKEN_PATTERN = re.compile(r"(<.*?>|extra_id_\d+)", re.IGNORECASE)
PUNCTUATION_TABLE = str.maketrans('', '', string.punctuation)
FORBIDDEN_UPOS = {"VERB", "ADV"}

def detect_language(text):
    from langdetect import detect, LangDetectException
    try:
        return detect(text)
    except LangDetectException:
        return "en"

def get_stopwords(lang_code):
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
    tokens = tokenizer.encode(text, truncation=True, max_length=MAX_INPUT_TOKENS, return_tensors="pt")
    decoded = tokenizer.decode(tokens[0], skip_special_tokens=True)
    return INVALID_TOKEN_PATTERN.sub("", decoded).strip()

def filter_verbs_adverbs(candidates, lang):
    nlp = ensure_stanza_model(lang)
    if not nlp:
        return candidates[:MAX_KEYWORDS]
    doc = nlp(" ".join(candidates))
    filtered, seen = [], set()
    for sent in doc.sentences:
        for w in sent.words:
            lw = w.text.lower()
            if w.text.lower() in [c.lower() for c in candidates] and w.upos not in FORBIDDEN_UPOS:
                if lw not in seen:
                    filtered.append(w.text)
                    seen.add(lw)
    return filtered

def basic_chunk(sentences, max_tokens):
    chunks, current, curr_len = [], [], 0
    for s in sentences:
        toks = tokenizer.encode(s, add_special_tokens=False)
        if curr_len + len(toks) <= max_tokens:
            current.append(s); curr_len += len(toks)
        else:
            if current:
                chunks.append(" ".join(current))
            current, curr_len = [s], len(toks)
    if current:
        chunks.append(" ".join(current))
    return chunks

def semantic_chunk(text, max_chunk_tokens=512, sim_thresh=0.65):
    from nltk.tokenize import sent_tokenize
    sents = sent_tokenize(text)
    if not sents:
        return []

    clusters, current, agg_emb = [], [sents[0]], None
    for sent in sents:
        with torch.no_grad():
            new_emb = embedder.encode(sent, convert_to_tensor=True, normalize_embeddings=True, device=DEVICE)
        if agg_emb is None:
            agg_emb = new_emb
        else:
            sim = util.cos_sim(agg_emb, new_emb).item()
            if sim < sim_thresh:
                clusters.append(" ".join(current))
                current, agg_emb = [sent], new_emb
            else:
                current.append(sent)
                agg_emb = (agg_emb + new_emb) / 2
    if current:
        clusters.append(" ".join(current))

    final = []
    for c in clusters:
        toks = tokenizer.encode(c, add_special_tokens=False)
        if len(toks) <= max_chunk_tokens:
            final.append(c)
        else:
            final.extend(basic_chunk(c.split(". "), max_chunk_tokens))
    return final

def extract_keywords(text, max_keywords):
    text = truncate_input(text)
    from nltk.tokenize import sent_tokenize
    if len(tokenizer.encode(text)) > MAX_INPUT_TOKENS:
        chunks = basic_chunk(sent_tokenize(text), MAX_INPUT_TOKENS)
    else:
        chunks = [text]

    lang = detect_language(text)
    sw = get_stopwords(lang)

    candidates = []
    for chunk in chunks:
        with torch.no_grad():
            raw = text_generator(chunk, max_new_tokens=64, do_sample=False)[0]["generated_text"]
        raw = INVALID_TOKEN_PATTERN.sub("", raw)
        for k in re.split(r"[\n,]+", raw):
            c = clean_keyword(k.strip())
            if c and c not in sw:
                candidates.append(c)
                if len(candidates) >= max_keywords * 2:
                    break
        if len(candidates) >= max_keywords * 2:
            break

    filtered = filter_verbs_adverbs(candidates, lang)
    return filtered[:max_keywords]

# ─── MAIN ────────────────────────────────────────────────
if __name__ == "__main__":
    start_memory_watcher(max_memory_bytes)

    fn = sys.argv[2] if len(sys.argv) > 2 else "unknownFile"
    content = sys.stdin.read()
    if not content.strip():
        print(json.dumps({"keywords": []}, indent=2, ensure_ascii=False))
        sys.exit(0)

    from langdetect import detect, LangDetectException
    try:
        language = detect(content)
    except LangDetectException:
        language = "en"

    YELLOW = "\033[33m"; RESET = "\033[0m"
    sys.stderr.write("\r\033[K")
    print(f"{YELLOW}- PERMALINK: {fn} ... {language}{RESET}", file=sys.stderr)

    content = remove_code_blocks(content)
    content = truncate_input(content)

    chunks = semantic_chunk(content, max_chunk_tokens=MAX_INPUT_TOKENS)
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
        all_kw = [w.lower() for w in re.findall(r"\b\w+\b", content) if w.lower() not in sw][:MAX_KEYWORDS]

    lowercase_keywords = [kw.lower() for kw in all_kw[:MAX_KEYWORDS]]
    print(json.dumps({"keywords": lowercase_keywords}, indent=2, ensure_ascii=False))
