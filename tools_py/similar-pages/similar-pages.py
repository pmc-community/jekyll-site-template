import os
import tensorflow as tf
import tensorflow_hub as hub
import numpy as np
from multiprocessing import Pool, cpu_count
import json
import sys

# Suppress TensorFlow logging messages
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

# Enable XLA (Accelerated Linear Algebra) compilation
os.environ['TF_XLA_FLAGS'] = '--tf_xla_enable_xla_devices'

# Set optimal thread settings
num_threads = cpu_count()
tf.config.threading.set_inter_op_parallelism_threads(num_threads)
tf.config.threading.set_intra_op_parallelism_threads(num_threads)

# import what is needed from tools_py/globals.py
tools_py_path = os.path.abspath(os.path.join('tools_py'))
if tools_py_path not in sys.path:
    sys.path.append(tools_py_path)
from modules.globals import get_key_value_from_yml, get_the_modified_files

# Get settings (considering that this script runs from project root directory)
build_settings_path = '_data/buildConfig.yml'
rawContentFolder = get_key_value_from_yml(build_settings_path, 'rawContentFolder')
threadMultiplicator = get_key_value_from_yml(build_settings_path, 'pySimilarPagesByContent')['threadMultiplicator']
max_files_per_batch = get_key_value_from_yml(build_settings_path, 'pySimilarPagesByContent')['files_batch']
similarity_threshold = get_key_value_from_yml(build_settings_path, 'pySimilarPagesByContent')['similarity_threshold']
model_url = get_key_value_from_yml(build_settings_path, 'pySimilarPagesByContent')['model_url']
max_files_per_chunk = get_key_value_from_yml(build_settings_path, 'pySimilarPagesByContent')['chunk_size_in_files_batch']

def load_text_files(files_to_be_processed, max_files_per_batch=max_files_per_batch): # files_batch
    # Load text files from files_to_be_processed in batches.
    files_content = {}
    file_list = [os.path.basename(file_path) for file_path in files_to_be_processed]

    # the following full scans the doc-raw-contents directory for .txt files -- not used anymore
    #file_list = [filename for filename in os.listdir(rawContentFolder) if filename.endswith(".txt")]
    
    for i in range(0, len(file_list), max_files_per_batch):
        batch_files = file_list[i:i + max_files_per_batch]
        batch_content = {}
        for filename in batch_files:
            with open(os.path.join(directory, filename), 'r', encoding='utf-8') as file:
                batch_content[filename] = file.read()
        files_content.update(batch_content)
        yield files_content
        files_content.clear()  # Clear the dictionary to free memory

def calculate_similarity_matrix(embeddings):
    # Calculate the cosine similarity matrix for the given embeddings
    norm = np.linalg.norm(embeddings, axis=1, keepdims=True)
    normalized_embeddings = embeddings / norm
    similarity_matrix = np.dot(normalized_embeddings, normalized_embeddings.T)
    return similarity_matrix

def chunks(lst, chunk_size):
    # Yield successive chunks of a given size from a list
    for i in range(0, len(lst), chunk_size):
        yield lst[i:i + chunk_size]

def process_chunk(chunk_data):
    # Process a chunk of filenames and return similar files
    filenames, chunk_contents, model_url = chunk_data
    model = hub.load(model_url)
    embeddings = model(chunk_contents).numpy()
    similarity_matrix = calculate_similarity_matrix(embeddings)
    similar_files = {}

    for i, filename in enumerate(filenames):
        similar_files[filename] = []
        for j, similarity in enumerate(similarity_matrix[i]):
            if i != j and similarity >= similarity_threshold:
                similar_files[filename].append((filenames[j], similarity))

        # Sort similar files by similarity in descending order
        similar_files[filename].sort(key=lambda x: x[1], reverse=True)

    return similar_files

def get_similar_by_content(files_to_be_processed):
    all_similar_files = {}

    for files_content in load_text_files(files_to_be_processed):
        filenames = list(files_content.keys())
        # Split filenames and contents into chunks
        batch_size = max_files_per_chunk  # Adjust batch size based on your system's memory capacity (chunk_size_in_files_batch)
        chunks_data = [
            (chunk_filenames, [files_content[filename] for filename in chunk_filenames], model_url)
            for chunk_filenames in chunks(filenames, batch_size)
        ]

        # Use multiprocessing Pool to process chunks in parallel
        max_processes = cpu_count() * threadMultiplicator 
        with Pool(processes=max_processes) as pool:
            similar_files_chunks = pool.map(process_chunk, chunks_data)

        # Combine results from chunks into the main dictionary
        for chunk_result in similar_files_chunks:
            all_similar_files.update(chunk_result)

    return all_similar_files

def transform_data(data):
    transformed_data = []
    for filename, similar_files in data.items():
        # Extract permalink based on filename
        permalink = filename[:-4]
        permalink = permalink.replace('_', '/')
        # Convert similar files to a list of filenames (without similarity)
        similar_files_list = [f[0][:-4].replace('_', '/') for f in similar_files]
        result =  {
            "message": f"processed {permalink}", 
            "payload": {
                "permalink": permalink,
                "similarFiles": similar_files_list
            }
        }
        print(json.dumps(result), flush=True)
        transformed_data.append(result["payload"])
    return transformed_data

if __name__ == "__main__":

    # gets the parameters sent by the ruby script
    try:
        json_data = json.loads(sys.argv[1])
    except (IndexError, json.JSONDecodeError):
        json_data = None
    pageList = json_data['pageList'] if json_data is not None else None
    files_to_be_processed = json_data['fileList'] if json_data is not None else []

    if len(files_to_be_processed) > 0:
        directory = rawContentFolder
        output_file_path = os.path.join(directory, "autoSimilar.json")
        
        if os.path.exists(output_file_path):
            with open(output_file_path, 'r') as f:
                existing_data = json.load(f)
        else:
            existing_data = []
        
        # Convert existing data to a dictionary for easy lookup by permalink
        existing_data_dict = {item['permalink']: item for item in existing_data}
        
        similar_files = get_similar_by_content(files_to_be_processed)
        autoSimilarFiles = transform_data(similar_files)
        
        # Update or append data based on the permalink
        for new_item in autoSimilarFiles:
            existing_data_dict[new_item['permalink']] = new_item
        
        # Convert the dictionary back to a list
        updated_data = list(existing_data_dict.values())
            
        with open(output_file_path, 'w') as f:
            json.dump(updated_data, f, indent=4)
