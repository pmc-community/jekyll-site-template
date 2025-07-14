import re
import sys
import json
import os
import psutil
import logging
import warnings
from multiprocessing import Pool, cpu_count, Manager, Lock
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer

# === THREAD SAFETY WARNING ===
import langdetect
from langdetect import detect, LangDetectException

# === SUPPRESS WARNINGS/LOGS ===
warnings.filterwarnings("ignore", message="resource_tracker: There appear to be")
warnings.filterwarnings("ignore", category=FutureWarning, module="huggingface_hub.file_download")
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ["XLA_FLAGS"] = "--xla_cpu_enable_fast_math=false"
logging.getLogger('absl').setLevel(logging.ERROR)
logging.getLogger('tensorflow').setLevel(logging.FATAL)
from transformers.utils import logging as hf_logging
hf_logging.set_verbosity_error()

# === FORCED MULTIPROCESSING METHOD ===
import multiprocessing
multiprocessing.set_start_method('spawn', force=True)

# === CUSTOM MODULE IMPORT ===
tools_py_path = os.path.abspath(os.path.join('tools_py'))
if tools_py_path not in sys.path:
    sys.path.append(tools_py_path)
from modules.globals import get_key_value_from_yml, clean_up_text, get_the_modified_files

# === FIXED SEED FOR LANGDETECT ===
langdetect.detector_factory.DetectorFactory.seed = 42

# === SETTINGS ===
build_settings_path = '_data/buildConfig.yml'
rawContentFolder = get_key_value_from_yml(build_settings_path, 'rawContentFolder')
summaryLength = get_key_value_from_yml(build_settings_path, 'pyPageSummary')['summaryLength']
return_tensors = get_key_value_from_yml(build_settings_path, 'pyPageSummary')['tokenizer']['return_tensors']
prompt = get_key_value_from_yml(build_settings_path, 'pyPageSummary')['tokenizer']['prompt']
usePrompt = get_key_value_from_yml(build_settings_path, 'pyPageSummary')['usePrompt']
max_length = get_key_value_from_yml(build_settings_path, 'pyPageSummary')['tokenizer']['max_length']
truncation = get_key_value_from_yml(build_settings_path, 'pyPageSummary')['tokenizer']['truncation']
skip_special_tokens = get_key_value_from_yml(build_settings_path, 'pyPageSummary')['tokenizer']['skip_special_tokens']
model_name = get_key_value_from_yml(build_settings_path, 'pyPageSummary')['model']['name']
model_max_length = get_key_value_from_yml(build_settings_path, 'pyPageSummary')['model']['max_length']
model_min_length = get_key_value_from_yml(build_settings_path, 'pyPageSummary')['model']['min_length']
model_length_penalty = get_key_value_from_yml(build_settings_path, 'pyPageSummary')['model']['length_penalty']
model_num_beams = get_key_value_from_yml(build_settings_path, 'pyPageSummary')['model']['num_beams']
model_early_stopping = get_key_value_from_yml(build_settings_path, 'pyPageSummary')['model']['early_stopping']

# === GLOBALS (PER PROCESS) ===
model = None
tokenizer = None

# === INITIALIZER ===
def init_worker():
    global model, tokenizer
    model = AutoModelForSeq2SeqLM.from_pretrained(model_name)
    tokenizer = AutoTokenizer.from_pretrained(model_name, use_fast=False)

# === HELPERS ===
import string
def strip_if_only_punctuation(text: str) -> str:
    if text and all(char in string.punctuation for char in text.strip()):
        return ''
    return text

import nltk
from nltk.tokenize import sent_tokenize
nltk.download('punkt', quiet=True)

def is_sentence_complete(sentence: str) -> bool:
    """
    Checks if a sentence appears complete using simple heuristics:
    - Ends with punctuation
    - Has subject-like word (e.g. pronoun or noun)
    - Is not too short or just a prepositional phrase
    """
    if not sentence:
        return False
    if len(sentence.split()) < 4:
        return False
    if not re.search(r'\b(I|you|we|they|he|she|it|this|that|these|those|[A-Z][a-z]+)\b', sentence):
        return False
    if not sentence[-1] in '.!?':
        return False
    return True

def format_sentences(text: str) -> str:
    """
    Cleans and formats text into complete, logical sentences.
    - Strips and normalizes whitespace
    - Capitalizes the first word
    - Ensures proper sentence punctuation
    - Skips or attempts to fix incomplete fragments
    """
    if not text or not isinstance(text, str):
        return ""

    # Normalize whitespace
    text = re.sub(r'\s+', ' ', text).strip()

    # Tokenize into sentences
    sentences = sent_tokenize(text)

    formatted = []
    for raw_sentence in sentences:
        sentence = raw_sentence.strip()

        # Capitalize first word
        if sentence and not sentence[0].isupper():
            sentence = sentence[0].upper() + sentence[1:]

        # Add period if missing
        if sentence and sentence[-1] not in '.!?':
            sentence += '.'

        # Only keep if it seems logically complete
        if is_sentence_complete(sentence):
            formatted.append(sentence)

    return ' '.join(formatted)

import langcodes
def get_language_name(lang_code):
    try:
        return langcodes.Language.get(lang_code).language_name().capitalize()
    except Exception:
        return "English"

def detect_language_langdetect(text, permalink):
    text = text.strip()
    if len(text) < 10:
        print(f"\033[31m- PERMALINK: {permalink} ... Text too short, fallback to 'en'\033[0m", file=sys.stderr)
        return "en"
    try:
        return detect(text)
    except LangDetectException:
        print(f"\033[31m- PERMALINK: {permalink} ... LangDetectException, fallback to 'en'\033[0m", file=sys.stderr)
        return "en"

def clean_model_output(text):
    text = re.sub(r'<extra_id_\d+>', '', text)
    text = re.sub(r'<\/?pad>', '', text)
    return text.strip()

def preprocess_text(text):
    text = re.sub(r'```.*?```', '', text, flags=re.DOTALL)
    text = re.sub(r'^(?: {4}|\t).*(\n|$)', '', text, flags=re.MULTILINE)
    text = re.sub(r'[^\w\s.,!?;:\-–—"\'()\[\]{}]', '', text)
    return text.strip()

def summarize_text(text, lang="en"):
    global model, tokenizer

    if tokenizer is None or model is None:
        raise RuntimeError("Tokenizer or model not initialized in subprocess")

    text = preprocess_text(text)

    full_prompt = prompt % (get_language_name(lang), summaryLength)

    if (usePrompt):
        modelPrompt = f'{full_prompt}: ' + text
    else:
        modelPrompt = text

    #print(f"{full_prompt}", file=sys.stderr)
    
    inputs = tokenizer.encode(
        modelPrompt,
        return_tensors=return_tensors,
        max_length=max_length,
        truncation=truncation
    )

    outputs = model.generate(
        inputs,
        max_length=model_max_length,
        min_length=model_min_length,
        length_penalty=model_length_penalty,
        num_beams=model_num_beams,
        early_stopping=model_early_stopping
    )

    interpretation = tokenizer.decode(outputs[0], skip_special_tokens=skip_special_tokens)
    interpretation = clean_model_output(interpretation)
    words = interpretation.split()
    if len(words) > summaryLength:
        interpretation = ' '.join(words[:summaryLength])
    interpretation = clean_up_text(interpretation, [f'{prompt}:', f'{full_prompt}:'])
    return interpretation

def write_summary(payload, lock):
    summaries_path = f'{rawContentFolder}/autoSummary.json'
    with lock:
        summaries_data = {"summaries": []}
        if os.path.exists(summaries_path):
            with open(summaries_path, 'r') as file:
                summaries_data = json.load(file)

        updated = False
        for entry in summaries_data["summaries"]:
            if entry["permalink"] == payload["permalink"]:
                entry["summary"] = payload["summary"]
                updated = True
                break

        if not updated:
            summaries_data["summaries"].append(payload)

        with open(summaries_path, 'w') as file:
            json.dump(summaries_data, file, indent=4)

def process_file_mp(file_name):
    global model, tokenizer
    try:
        with open(file_name, 'r') as file:
            text = file.read()
    except Exception:
        return {"message": f"failed to read {file_name}", "payload": {}}

    permalink = os.path.basename(file_name)[:-4].replace('_', '/')
    try:
        lang = detect_language_langdetect(text, permalink)
    except Exception:
        lang = 'en'

    summary = summarize_text(text, lang=lang)

    full_prompt = prompt % (get_language_name(lang), summaryLength)
    summary = format_sentences(summary)
    summary = summary.replace(full_prompt, '').strip()
    summary = strip_if_only_punctuation(summary).strip()

    print(f"\033[33m- PERMALINK: {permalink} ... {lang}\033[0m", file=sys.stderr)

    return {
        "message": f"processed {permalink}",
        "payload": {
            "permalink": permalink,
            "summary": summary
        }
    }

def process_files(file_names, pageList=None):
    total_memory = psutil.virtual_memory().total
    #cpu_limit = max(1, int(cpu_count() * 0.6))
    cpu_limit = min(len(file_names), max(1, int(cpu_count() * 0.6)))

    with Manager() as manager:
        write_lock = manager.Lock()

        with Pool(
            processes=cpu_limit,
            initializer=init_worker
        ) as pool:
            results = pool.map(process_file_mp, file_names)

        for result in results:
            if result and result.get("payload"):
                write_summary(result["payload"], write_lock)
                print(json.dumps(result), flush=True)

# === ENTRY POINT ===
if __name__ == "__main__":
    modified_files = get_the_modified_files()
    if len(modified_files) > 0:
        try:
            json_data = json.loads(sys.argv[1])
        except (IndexError, json.JSONDecodeError):
            json_data = None
        pageList = json_data['pageList'] if json_data is not None else None
        process_files(modified_files, pageList)
