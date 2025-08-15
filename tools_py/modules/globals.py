from langdetect import detect
import yaml
import string
import re
import json
import os
import dotenv
import secrets

def detect_language_with_confidence(text, num_runs=5):
  detected_languages = []
  for _ in range(num_runs):
    detected_language = detect(text)
    detected_languages.append(detected_language)

  # Count occurrences of each language
  language_counts = {}
  for language in detected_languages:
    language_counts[language] = language_counts.get(language, 0) + 1

  # Find the most frequent language and its count (estimated confidence)
  most_frequent_language = None
  highest_count = 0
  for language, count in language_counts.items():
    if count > highest_count:
      most_frequent_language = language
      highest_count = count

  return most_frequent_language, highest_count / num_runs  # Confidence as ratio of most frequent detections

def get_key_value_from_yml(file_path, key):
  try:
    with open(file_path) as file:
      data = yaml.safe_load(file)
      return data.get(key)
  except FileNotFoundError:
    print(f"Error: Could not find {file_path} file.")
    return None
  except yaml.YAMLError as e:
    print(f"Error parsing YAML file: {e}")
    return None

def clean_up_text(text, to_remove_from_start=[]):
  for prefix in to_remove_from_start:
    if text.lower().startswith(prefix.lower()):
        text = text[len(prefix):].lstrip()
  text = text.strip()
  pattern = f'^[{re.escape(string.punctuation)}]+'
  text = re.sub(pattern, '', text).strip()
  text = text.replace('"', "'").strip()
  return text

def get_the_modified_files():
  build_settings_path = '_data/buildConfig.yml'
  rawContentFolder = get_key_value_from_yml(build_settings_path, 'rawContentFolder')
  folder_path = rawContentFolder
  modified_files_path = f"{rawContentFolder}/modified_files.json"

  if not os.path.exists(folder_path):
      return []
  
  if not os.path.exists(modified_files_path):
      return []

  with open(modified_files_path, 'r') as file:
      modified_files_content = file.read()
  try:
    file_names = json.loads(modified_files_content)["files"]
    return file_names
  except:
    return []

def get_env_value(env_path, key):
  try:
      dotenv.load_dotenv(dotenv_path=env_path)
      return os.getenv(key)
  except Exception as e:
      print(f"An error occurred: {e}")
      return None
  
def generate_random_string(length=16):
    """
    Generates a random string of a specified length using only
    letters (A-Z, a-z) and digits (0-9).
    """
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for i in range(length))