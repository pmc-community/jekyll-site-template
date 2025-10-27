import os
import sys
import re
import yaml
from langdetect import detect
from symspellpy import SymSpell, Verbosity
import pkg_resources

# --- Supported languages and dictionary files ---
SUPPORTED_LANGS = {
    "en": "frequency_dictionary_en_82_765.txt",
}

# --- Cache for SymSpell instances ---
symspell_cache = {}

def load_symspell_for_language(lang_code):
    """Load (or reuse) a SymSpell instance for the given language code."""
    lang_code = lang_code.lower()
    if lang_code in symspell_cache:
        return symspell_cache[lang_code]

    if lang_code not in SUPPORTED_LANGS:
        print(f"🚩 Unsupported language '{lang_code}'. Skipping spellcheck.")
        return None

    dictionary_filename = SUPPORTED_LANGS[lang_code]
    try:
        dictionary_path = pkg_resources.resource_filename("symspellpy", dictionary_filename)
    except Exception as e:
        print(f"❌ Failed to find resource file for {lang_code}. Error: {e}")
        return None

    sym_spell = SymSpell(max_dictionary_edit_distance=2, prefix_length=7)
    if not sym_spell.load_dictionary(dictionary_path, term_index=0, count_index=1):
        print(f"❌ Failed to load dictionary for {lang_code}: {dictionary_path}")
        return None

    symspell_cache[lang_code] = sym_spell
    print(f"📚 Loaded dictionary for {lang_code}")
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


def detect_misspellings(text, sym_spell):
    """Return list of misspelled words only using the given SymSpell instance."""
    if not sym_spell:
        return []
    words = tokenize_words(text)
    misspelled = []
    for w in words:
        suggestions = sym_spell.lookup(w, Verbosity.CLOSEST, max_edit_distance=2)
        if not suggestions or suggestions[0].term.lower() != w.lower():
            misspelled.append(w)
    return sorted(set(misspelled))


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
            print(f"⚪ Skipping empty file: {file_path}")
            return

        # --- Detect language ---
        try:
            lang = detect(text)
        except Exception:
            lang = "unknown"

        sym_spell = load_symspell_for_language(lang)
        misspelled = detect_misspellings(text, sym_spell)

        filename = os.path.basename(file_path)
        filename_no_ext = os.path.splitext(filename)[0]
        transformed_path = filename_no_ext.replace("_", "/")

        # --- Find matching .md file ---
        md_rel_path = find_md_by_permalink(transformed_path, md_root_folder)

        out_f.write(f"Permalink: {transformed_path}\n")
        out_f.write(f"File: {md_rel_path if md_rel_path else '(no matching .md file found)'}\n")
        out_f.write(f"Language detected: {lang}\n")

        if not sym_spell:
            out_f.write("Language not supported for spellcheck.\n\n")
            status_icon = "🚩"
        elif misspelled:
            out_f.write(f"Misspelled words: {', '.join(misspelled)}\n\n")
            status_icon = "🔸"
        else:
            out_f.write("No misspellings detected.\n\n")
            status_icon = "🔹"

        out_f.flush()
        print(f"{status_icon} Processed {file_index}/{total_files}: {transformed_path} ({lang})")

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

    print(f"✅ All files processed. Results saved in '{result_file}'.")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python spellcheck_symspell.py <txt_folder> <md_folder>")
        sys.exit(1)
    txt_folder = sys.argv[1]
    md_folder = sys.argv[2]
    main(txt_folder, md_folder)
