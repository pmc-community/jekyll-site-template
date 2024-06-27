import re
from transformers import BartTokenizer, TFBartForConditionalGeneration
import sys
import json

model_name = "facebook/bart-large-cnn"
tokenizer = BartTokenizer.from_pretrained(model_name)
model = TFBartForConditionalGeneration.from_pretrained(model_name)

# Function to preprocess the content
def preprocess_text(text):

    # Remove non-alphanumeric characters and extra whitespace
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'[^\w\s]', '', text)
    return text.strip()

# Function to generate summary using Transformers
def summarize_text(text):

    # Preprocess the text for DistilBART
    inputs = tokenizer.encode(text, return_tensors="tf", max_length=512)

    # Generate the summary
    outputs = model.generate(inputs, max_length=20, min_length=10, early_stopping=True)
    summary = tokenizer.decode(outputs[0], skip_special_tokens=True).split()[:20]  # Keep first 20 words
    summary = " ".join(summary).lower()  # Join back into a string
    return summary

if __name__ == "__main__":
    parameter = sys.argv[1] if len(sys.argv) > 1 else None

    if parameter:
        parameter_json = json.loads(parameter)
        processed_result = summarize_text(preprocess_text(parameter_json['text']))
        print(json.dumps(processed_result))
    else:
        print("No text parameter provided.")
