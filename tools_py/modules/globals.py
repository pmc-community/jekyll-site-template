from langdetect import detect
import yaml
import string
import re

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