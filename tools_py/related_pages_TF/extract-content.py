import os
import glob
import markdown
import pandas as pd

def extract_content(directory):
    data = []
    for filename in glob.glob(f'{directory}/**/*.md', recursive=True):
        with open(filename, 'r', encoding='utf-8') as file:
            
            md_content = file.read()
            html_content = markdown.markdown(md_content)
            data.append({
                'filename': filename,
                'content': html_content
            })
    return pd.DataFrame(data)

pages = extract_content('../doc-contents')
content_df = pd.concat([pages], ignore_index=True)

content_df.to_csv('content.csv', index=False)
