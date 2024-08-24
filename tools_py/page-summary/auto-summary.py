import re
import sys
import json
import os
from concurrent.futures import ThreadPoolExecutor, as_completed
from transformers import TFAutoModelForSeq2SeqLM, AutoTokenizer
from multiprocessing import cpu_count
import threading

write_lock = threading.Lock()

# Suppress TensorFlow logging messages
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

# Enable XLA (Accelerated Linear Algebra) compilation
os.environ['TF_XLA_FLAGS'] = '--tf_xla_enable_xla_devices'

# import what is needed from tools_py/globals.py
tools_py_path = os.path.abspath(os.path.join('tools_py'))
if tools_py_path not in sys.path:
    sys.path.append(tools_py_path)
from modules.globals import get_key_value_from_yml, clean_up_text, get_the_modified_files

# Get settings (considering that this script runs from project root directory)
# general settings
build_settings_path = '_data/buildConfig.yml'
rawContentFolder = get_key_value_from_yml(build_settings_path, 'rawContentFolder')
summaryLength = get_key_value_from_yml(build_settings_path, 'pyPageSummary')['summaryLength']
threadMultiplicator = get_key_value_from_yml(build_settings_path, 'pyPageSummary')['threadMultiplicator']

# tokenizer settings
return_tensors = get_key_value_from_yml(build_settings_path, 'pyPageSummary')['tokenizer']['return_tensors']
prompt = get_key_value_from_yml(build_settings_path, 'pyPageSummary')['tokenizer']['prompt']
max_length = get_key_value_from_yml(build_settings_path, 'pyPageSummary')['tokenizer']['max_length']
truncation = get_key_value_from_yml(build_settings_path, 'pyPageSummary')['tokenizer']['truncation']
skip_special_tokens = get_key_value_from_yml(build_settings_path, 'pyPageSummary')['tokenizer']['skip_special_tokens']

# model settings
model = get_key_value_from_yml(build_settings_path, 'pyPageSummary')['model']['name']
model_max_length = get_key_value_from_yml(build_settings_path, 'pyPageSummary')['model']['max_length']
model_min_length = get_key_value_from_yml(build_settings_path, 'pyPageSummary')['model']['min_length']
model_length_penalty = get_key_value_from_yml(build_settings_path, 'pyPageSummary')['model']['length_penalty']
model_num_beams = get_key_value_from_yml(build_settings_path, 'pyPageSummary')['model']['num_beams']
model_early_stopping =  get_key_value_from_yml(build_settings_path, 'pyPageSummary')['model']['early_stopping']

# Load the model globally
modified_files = get_the_modified_files()
if ( len(modified_files) > 0 ):
    model_name = model
    model = TFAutoModelForSeq2SeqLM.from_pretrained(model_name)

# Function to preprocess the content
def preprocess_text(text):
    # Remove non-alphanumeric characters and extra whitespace
    text = re.sub(r'[^\w\s]', '', text)
    return text.strip()

# Function to generate summary using Transformers
def summarize_text(text):
    if len(text.split()) <= summaryLength:
        return clean_up_text(text)
    
    tokenizer = AutoTokenizer.from_pretrained(model_name) # tokenizer to be loaded here to avoid inter-processes issues
    
    inputs = tokenizer.encode(
        f'{prompt}: ' + text, 
        return_tensors = return_tensors, 
        max_length = max_length, 
        truncation = truncation
    )

    
    # Generate the interpretation with an appropriate token limit
    outputs = model.generate(
        inputs, 
        max_length = model_max_length, 
        min_length = model_min_length, 
        length_penalty = model_length_penalty, 
        num_beams = model_num_beams, 
        early_stopping = model_early_stopping
    )
    interpretation = tokenizer.decode(
        outputs[0], 
        skip_special_tokens = skip_special_tokens
    )

    # Ensure interpretation is within _data/buildConfig.yml['pyPageSummary']['summaryLength'] words
    words = interpretation.split()
    if len(words) > summaryLength:
        interpretation = interpretation[:interpretation.rfind(' ', 0, summaryLength*4)]

    interpretation = clean_up_text(interpretation, [f'{prompt}:']) + ' ...'
    return interpretation

def process_file(file_name):
    file_path = file_name
    with open(file_path, 'r') as file:
        text = file.read()
    interpretation = summarize_text(text)
    permalink = os.path.basename(file_path)
    permalink = permalink[:-4]
    permalink = permalink.replace('_', '/')
    result =  {
        "message": f"processed {permalink}", 
        "payload": {
            "permalink": permalink, 
            "summary": interpretation
        }
    }
    with write_lock:
        write_summary(result['payload'])
    return result

def write_summary(payload):
    summaries_path = f'{rawContentFolder}/autoSummary.json'
    summaries_data = {"summaries": []}

    # Read the existing data if the file exists
    if os.path.exists(summaries_path):
        with open(summaries_path, 'r') as file:
            summaries_data = json.load(file)

    # Update or add the new payload
    updated = False
    for entry in summaries_data["summaries"]:
        if entry["permalink"] == payload["permalink"]:
            entry["summary"] = payload["summary"]
            updated = True
            break
    if not updated:
        summaries_data["summaries"].append(payload)

    # Write the updated data back to the file
    with open(summaries_path, 'w') as file:
        json.dump(summaries_data, file, indent=4)

def process_files(file_names, pageList=None):
    # Use ThreadPoolExecutor to process files concurrently
    max_workers = cpu_count() * threadMultiplicator
    with ThreadPoolExecutor(max_workers = max_workers) as executor:
        future_to_file = {executor.submit(process_file, file_name): file_name for file_name in file_names}
        for future in as_completed(future_to_file):
            result = future.result()
            print(json.dumps(result), flush=True)

if __name__ == "__main__":
    modified_files = get_the_modified_files()
    if len(modified_files) > 0: 
        try:
            json_data = json.loads(sys.argv[1])
        except (IndexError, json.JSONDecodeError):
            json_data = None
        pageList = json_data['pageList'] if json_data is not None else None
        modified_files = get_the_modified_files()
        process_files(modified_files, pageList)
