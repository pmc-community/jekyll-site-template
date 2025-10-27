import os
import sys
import re
import yaml
from langdetect import detect
from symspellpy import SymSpell, Verbosity
import pkg_resources
from rich.console import Console
from rich.table import Table, Column
from rich.live import Live
from rich import box
import tempfile
import re

console = Console()

output_table = Table(
    # --- 1. POSITIONAL ARGUMENTS (Column definitions FIRST) ---
    Column(header="", min_width=2, style="yellow"),
    Column(header="No.", min_width=4, style="yellow"),
    Column(header="Permalink", min_width=30, overflow="fold", style="yellow"), # Handles wrapping
    Column(header="File", min_width=40, overflow="fold", style="yellow"), # Handles wrapping
    Column(header="Misspellings", min_width=5, justify="right", style="yellow"),
    Column(header="Lang", min_width=4, style="yellow"),

    # --- 2. KEYWORD ARGUMENTS (title, show_header, etc. LAST) ---
    title=f"",
    show_header=True,        # Meets "no headers" requirement
    caption="",

    # ------------------ ADDED STYLING ------------------
    box=box.HEAVY_HEAD,      # Sets the style of the box/borders (HEAVY_HEAD shows all lines)
    show_lines=True,         # Ensures lines are drawn between rows
    border_style="purple",   # Sets the color of the entire border/box structure
    # ---------------------------------------------------
)


# --- Supported languages and dictionary files ---
SUPPORTED_LANGS = {
    "en": "frequency_dictionary_en_82_765.txt",
    "ca": "ca.txt",
}

# --- Cache for SymSpell instances ---
symspell_cache = {}

def load_symspell_for_lang(lang_code):
    if lang_code in symspell_cache:
        return symspell_cache[lang_code]

    if lang_code not in SUPPORTED_LANGS:
        print(f"❌ Unsupported language code: {lang_code}")
        return None

    dictionary_filename = SUPPORTED_LANGS[lang_code]

    # Use pkg_resources to get the path to the file inside the package
    try:
        dictionary_path = pkg_resources.resource_filename("symspellpy", dictionary_filename)
    except Exception as e:
        print(f"❌ Failed to find resource file for {lang_code}: {e}")
        return None

    if not os.path.exists(dictionary_path):
        print(f"❌ Dictionary file does not exist for {lang_code}: {dictionary_path}")
        return None

    # Check if the dictionary has a frequency column
    try:
        with open(dictionary_path, "r", encoding="utf-8") as f:
            first_line = f.readline().strip().split()
            has_freq_col = len(first_line) >= 2
    except Exception as e:
        print(f"❌ Error reading dictionary file for {lang_code}: {e}")
        return None

    sym_spell = SymSpell(max_dictionary_edit_distance=2, prefix_length=7)

    if has_freq_col:
        success = sym_spell.load_dictionary(dictionary_path, term_index=0, count_index=1)
    else:
        #print(f"⚠️ No frequency column found for {lang_code}. Assigning frequency=1 to all words...")
        temp_path = None
        try:
            # create a temporary file with frequency column
            with tempfile.NamedTemporaryFile(mode="w+", delete=False, encoding="utf-8") as tmp:
                temp_path = tmp.name
                with open(dictionary_path, "r", encoding="utf-8") as f:
                    for line in f:
                        word = line.strip().split()[0]
                        if word:
                            tmp.write(f"{word} 1\n")
            success = sym_spell.load_dictionary(temp_path, term_index=0, count_index=1)
        except Exception as e:
            print(f"❌ Failed to prepare temporary frequency file for {lang_code}: {e}")
            return None
        finally:
            if temp_path and os.path.exists(temp_path):
                os.remove(temp_path)

    if not success:
        print(f"❌ Failed to load dictionary for {lang_code}: {dictionary_path}")
        return None

    symspell_cache[lang_code] = sym_spell
    print(f"✅ Loaded SymSpell dictionary for {lang_code} ({'with' if has_freq_col else 'without'} frequencies).")
    return sym_spell

def get_txt_files(folder):
    txt_files = []
    for root, _, files in os.walk(folder):
        for file in files:
            if file.lower().endswith(".txt"):
                txt_files.append(os.path.join(root, file))
    return sorted(txt_files)


def tokenize_words(text):
    """Return lowercase Unicode words with at least 2 letters, excluding numeric-only and alphanumeric tokens."""
    words = re.findall(r"\b\w{2,}\b", text, re.UNICODE)
    filtered_words = []
    for w in words:
        if w.isdigit():
            continue
        has_digit = any(char.isdigit() for char in w)
        has_letter = any(char.isalpha() for char in w)
        if has_digit and has_letter:
            continue
        filtered_words.append(w.lower())
    return filtered_words



def detect_misspellings(text, sym_spell, lang):
    ignored_languages = ["la"]
    """Return list of misspelled words using SymSpell, ignoring words in dict-ignore-{lang}.txt and URLs."""
    if not sym_spell:
        return []

    # 1. Define a regular expression for URLs
    # This pattern catches common http/https/ftp/www prefixes and generic domain formats.
    # It's a balance between accuracy and complexity for this task.
    URL_PATTERN = re.compile(
        r'(?:https?://|www\.)[^\s/$.?#].[^\s]*'
    )

    # Tokenize text (Assuming tokenize_words is defined elsewhere)
    words = tokenize_words(text)
    misspelled = []

    # SymSpell lookup
    for w in words:
        # 2. Skip the word if it matches a URL pattern
        if URL_PATTERN.match(w):
            continue
            
        # we want exact match because we only flag misspellings, we do not propose corretions
        # so we set max_edit_distance=0
        suggestions = sym_spell.lookup(w, Verbosity.CLOSEST, max_edit_distance=0)
        
        # 3. Flag as misspelled if not found exactly in the dictionary
        if not suggestions or suggestions[0].term.lower() != w.lower():
            misspelled.append(w)

    # Remove duplicates
    misspelled = sorted(set(misspelled))

    # Check for locale-specific ignore dictionary
    ignore_file = os.path.join("assets", "locales", f"dict-ignore-{lang}.txt")
    if os.path.exists(ignore_file):
        with open(ignore_file, "r", encoding="utf-8") as f:
            ignore_words = set(line.strip().lower() for line in f if line.strip())
        # Remove ignored words
        misspelled = [w for w in misspelled if w.lower() not in ignore_words]

    # Check for global ignore dictionary
    ignore_file = os.path.join("assets", "locales", "dict-ignore-global.txt")
    if os.path.exists(ignore_file):
        with open(ignore_file, "r", encoding="utf-8") as f:
            ignore_words = set(line.strip().lower() for line in f if line.strip())
        # Remove ignored words
        misspelled = [w for w in misspelled if w.lower() not in ignore_words]

    return misspelled

def find_md_by_permalink(permalink, md_root_folder):
    """Search all .md files for a front matter permalink that matches the given one."""
    for root, _, files in os.walk(md_root_folder):
        for file in files:
            if file.lower().endswith(".md"):
                md_path = os.path.join(root, file)
                try:
                    with open(md_path, "r", encoding="utf-8") as f:
                        content = f.read()
                    # Extract YAML front matter between ---
                    match = re.match(r"^---\s*\n(.*?)\n---", content, re.DOTALL)
                    if not match:
                        continue
                    front_matter = yaml.safe_load(match.group(1))
                    if isinstance(front_matter, dict) and "permalink" in front_matter:
                        if str(front_matter["permalink"]).strip("/") == permalink.strip("/"):
                            rel_path = os.path.relpath(md_path, md_root_folder)
                            return rel_path
                except Exception:
                    continue
    return None


def process_file(file_path, out_f, file_index, total_files, md_root_folder):
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            text = f.read()

        if not text.strip():
            # print(f"❌ Skipping empty file: {file_path}")
            return

        # --- Detect language ---
        try:
            lang = detect(text)
        except Exception:
            lang = "unknown"

        sym_spell = load_symspell_for_lang(lang)
        misspelled = detect_misspellings(text, sym_spell, lang)

        filename = os.path.basename(file_path)
        filename_no_ext = os.path.splitext(filename)[0]
        transformed_path = filename_no_ext.replace("_", "/")

        # --- Find matching .md file ---
        md_rel_path = find_md_by_permalink(transformed_path, md_root_folder)

        out_f.write(f"Permalink: {transformed_path}\n")
        out_f.write(f"File: {md_rel_path if md_rel_path else '(no matching .md file found)'}\n")
        out_f.write(f"Language detected: {lang}\n")

        if not sym_spell:
            out_f.write("Language not supported for spellcheck (possible missing dictionary).\n\n")
            status_icon = "❌"
        elif misspelled:
            out_f.write(f"Misspelled words: {', '.join(misspelled)}\n\n")
            status_icon = "🔸"
        else:
            out_f.write("No misspellings detected.\n\n")
            status_icon = "🔹"

        out_f.flush()
        #print(f"{status_icon} Processed {file_index}/{total_files}: {transformed_path} ({md_rel_path}) ({lang}): {len(misspelled)} possible misspelled word(s)")

        with Live(output_table, console=console, screen=True) as live:
            status = status_icon
            progress = f"{file_index}/{total_files}"
            misspelled_count = str(len(misspelled))
            language = lang

            # Add the new row to the table
            output_table.add_row(
                status,
                progress,
                transformed_path, # Rich handles wrapping this string automatically
                md_rel_path,
                misspelled_count,
                language
            )

    except Exception as e:
        out_f.write(f"Error processing {file_path}: {e}\n\n")
        out_f.flush()
        print(f"❌ Error {file_index}/{total_files} in {file_path}: {e}")


def main(txt_folder, md_folder):
    result_file = "tools/checks/misspelled_words.txt"

    if os.path.exists(result_file):
        os.remove(result_file)

    txt_files = get_txt_files(txt_folder)
    total_files = len(txt_files)
    if not txt_files:
        print("No .txt files found in the folder.")
        return

    os.makedirs(os.path.dirname(result_file), exist_ok=True)

    with open(result_file, "a", encoding="utf-8") as out_f:
        for i, file_path in enumerate(txt_files, 1):
            process_file(file_path, out_f, i, total_files, md_folder)
            
    console.print(output_table)

    print(f"✅ All files processed. Results saved in '{result_file}'.")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python spellcheck_symspell.py <txt_folder> <md_folder>")
        sys.exit(1)
    txt_folder = sys.argv[1]
    md_folder = sys.argv[2]
    main(txt_folder, md_folder)
