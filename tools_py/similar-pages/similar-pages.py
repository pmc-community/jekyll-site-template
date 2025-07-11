import os
import tensorflow as tf
import tensorflow_hub as hub
import numpy as np
from multiprocessing.dummy import Pool as ThreadPool
from multiprocessing import cpu_count
import json
import sys
import logging


# Suppress TensorFlow logging messages
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
os.environ['TF_XLA_FLAGS'] = '--tf_xla_enable_xla_devices=false'

# Suppress absl logging
logging.getLogger('absl').setLevel(logging.ERROR)
logging.getLogger('tensorflow').setLevel(logging.FATAL)

# Set optimal thread settings
num_threads = cpu_count()
tf.config.threading.set_inter_op_parallelism_threads(num_threads)
tf.config.threading.set_intra_op_parallelism_threads(num_threads)

# Import custom modules
tools_py_path = os.path.abspath(os.path.join('tools_py'))
if tools_py_path not in sys.path:
    sys.path.append(tools_py_path)
from modules.globals import get_key_value_from_yml, get_the_modified_files

# Get settings from YAML
build_settings_path = '_data/buildConfig.yml'
rawContentFolder = get_key_value_from_yml(build_settings_path, 'rawContentFolder')
threadMultiplicator = get_key_value_from_yml(build_settings_path, 'pySimilarPagesByContent')['threadMultiplicator']
max_files_per_batch = get_key_value_from_yml(build_settings_path, 'pySimilarPagesByContent')['files_batch']
similarity_threshold = get_key_value_from_yml(build_settings_path, 'pySimilarPagesByContent')['similarity_threshold']
model_url = get_key_value_from_yml(build_settings_path, 'pySimilarPagesByContent')['model_url']
max_files_per_chunk = get_key_value_from_yml(build_settings_path, 'pySimilarPagesByContent')['chunk_size_in_files_batch']

# Load the model once globally
model = hub.load(model_url)

def load_text_files(files_to_be_processed, max_files_per_batch=max_files_per_batch):
    files_content = {}
    file_list = [os.path.basename(file_path) for file_path in files_to_be_processed]

    for i in range(0, len(file_list), max_files_per_batch):
        batch_files = file_list[i:i + max_files_per_batch]
        batch_content = {}
        for filename in batch_files:
            try:
                with open(os.path.join(directory, filename), 'r', encoding='utf-8') as file:
                    batch_content[filename] = file.read()
            except (IOError, OSError) as e:
                print(f"Error reading file {filename}: {e}", flush=True)
        files_content.update(batch_content)
        yield files_content
        files_content.clear()

def calculate_similarity_matrix(embeddings):
    norm = np.linalg.norm(embeddings, axis=1, keepdims=True)
    normalized_embeddings = embeddings / norm
    similarity_matrix = np.dot(normalized_embeddings, normalized_embeddings.T)
    return similarity_matrix

def chunks(lst, chunk_size):
    for i in range(0, len(lst), chunk_size):
        yield lst[i:i + chunk_size]

def process_chunk_threadsafe(chunk_data):
    filenames, chunk_contents = chunk_data
    embeddings = model(chunk_contents).numpy()
    similarity_matrix = calculate_similarity_matrix(embeddings)
    similar_files = {}

    for i, filename in enumerate(filenames):
        similar_files[filename] = []
        for j, similarity in enumerate(similarity_matrix[i]):
            if i != j and similarity >= similarity_threshold:
                similar_files[filename].append((filenames[j], similarity))
        similar_files[filename].sort(key=lambda x: x[1], reverse=True)
    return similar_files

def get_similar_by_content(files_to_be_processed):
    all_similar_files = {}

    for files_content in load_text_files(files_to_be_processed):
        filenames = list(files_content.keys())
        chunk_data = [
            (chunk_filenames, [files_content[fn] for fn in chunk_filenames])
            for chunk_filenames in chunks(filenames, max_files_per_chunk)
        ]

        max_threads = cpu_count() * threadMultiplicator
        with ThreadPool(processes=max_threads) as pool:
            similar_files_chunks = pool.map(process_chunk_threadsafe, chunk_data)

        for chunk_result in similar_files_chunks:
            all_similar_files.update(chunk_result)

    return all_similar_files

def transform_data(data):
    transformed_data = []
    for filename, similar_files in data.items():
        permalink = filename[:-4].replace('_', '/')
        similar_files_list = [f[0][:-4].replace('_', '/') for f in similar_files]
        result = {
            "message": f"processed {permalink}", 
            "payload": {
                "permalink": permalink,
                "similarFiles": similar_files_list
            }
        }
        try:
            print(json.dumps(result, ensure_ascii=False), flush=True)
        except (TypeError, ValueError) as e:
            print(f"Error serializing JSON for {permalink}: {e}", flush=True)
        transformed_data.append(result["payload"])
    return transformed_data

if __name__ == "__main__":
    try:
        json_data = json.loads(sys.argv[1])
    except (IndexError, json.JSONDecodeError):
        json_data = None

    pageList = json_data['pageList'] if json_data else None
    files_to_be_processed = json_data['fileList'] if json_data else []

    if files_to_be_processed:
        directory = rawContentFolder
        output_file_path = os.path.join(directory, "autoSimilar.json")

        if os.path.exists(output_file_path):
            try:
                with open(output_file_path, 'r', encoding='utf-8') as f:
                    existing_data = json.load(f)
            except (IOError, ValueError) as e:
                print(f"Error reading existing JSON file: {e}", flush=True)
                existing_data = []
        else:
            existing_data = []

        existing_data_dict = {item['permalink']: item for item in existing_data}
        similar_files = get_similar_by_content(files_to_be_processed)
        autoSimilarFiles = transform_data(similar_files)

        for new_item in autoSimilarFiles:
            existing_data_dict[new_item['permalink']] = new_item

        updated_data = list(existing_data_dict.values())

        try:
            with open(output_file_path, 'w', encoding='utf-8') as f:
                json.dump(updated_data, f, ensure_ascii=False, indent=4)
        except (IOError, ValueError) as e:
            print(f"Error writing JSON file: {e}", flush=True)
