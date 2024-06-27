import tensorflow as tf
import tensorflow_hub as hub
import numpy as np
import pandas as pd
import json

# Load content data
content_df = pd.read_csv('tools_py/content.csv')

# Load the Universal Sentence Encoder
embed = hub.load("https://tfhub.dev/google/universal-sentence-encoder/4")

# Embed the content
content_embeddings = embed(content_df['content'].tolist())

# Calculate cosine similarity
cosine_similarities = np.inner(content_embeddings, content_embeddings)

# Convert the similarities to a list and save as JSON
cosine_similarities_list = cosine_similarities.tolist()

with open('tools_py/cosine_similarities.json', 'w') as f:
    json.dump(cosine_similarities_list, f)