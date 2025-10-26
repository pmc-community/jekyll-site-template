import os
import sys
import re
from langdetect import detect
from symspellpy import SymSpell, Verbosity
import pkg_resources

# --- Setup SymSpell ---
# max_dictionary_edit_distance=2 is enough for most typos
sym_spell = SymSpell(max_dictionary_edit_distance=2, prefix_length=7)

# Load the included English frequency dictionary
dictionary_path = pkg_resources.resource_filename(
    "symspellpy", "frequency_dictionary_en_82_765.txt"
)
if not sym_spell.load_dictionary(dictionary_path, term_index=0, count_index=1):
    print("Error loading SymSpell dictionary")
    sys.exit(1)


def get_txt_files(folder):
    txt_files = []
    for root, _, files in os.walk(folder):
        for file in files:
            if file.lower().endswith(".txt"):
                txt_files.append(os.path.join(root, file))
    return sorted(txt_files)


def tokenize_words(text):
    """Return lowercase alphabetic words only, ignoring single-letter words."""
    return [w.lower() for w in re.findall(r'\b[a-zA-Z]{2,}\b', text)]  # words with 2+ letters


def detect_misspellings(text):
    """Return list of misspelled words only."""
    words = tokenize_words(text)
    misspelled = []
    for w in words:
        suggestions = sym_spell.lookup(w, Verbosity.CLOSEST, max_edit_distance=2)
        if not suggestions or suggestions[0].term.lower() != w.lower():
            misspelled.append(w)
    return sorted(set(misspelled))


def process_file(file_path, out_f):
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            text = f.read()

        if not text.strip():
            print(f"⚪ Skipping empty file: {file_path}")
            return

        try:
            lang = detect(text)
        except Exception:
            lang = "unknown"

        misspelled = detect_misspellings(text)
        
        filename = os.path.basename(file_path)       # get only the file name
        filename_no_ext = os.path.splitext(filename)[0]
        transformed_path = filename_no_ext.replace("_", "/") # replace _ with /
        out_f.write(f"Permalink: {transformed_path} (Language detected: {lang})\n")

        if misspelled:
            out_f.write(f"Misspelled words: {', '.join(misspelled)}\n")
        else:
            out_f.write("No misspellings detected.\n")
        out_f.write("\n")
        out_f.flush()

        #print(f"✅ Processed: {os.path.basename(file_path)} ({lang})")

    except Exception as e:
        out_f.write(f"Error processing {file_path}: {e}\n\n")
        out_f.flush()
        print(f"❌ Error in {file_path}: {e}")


def main(folder):
    #result_file = os.path.join(folder, "tools/ckecks/misspelled_words.txt")
    result_file =  "tools/checks/misspelled_words.txt"

    # Delete previous output
    if os.path.exists(result_file):
        os.remove(result_file)
        #print(f"🗑 Previous result file deleted: {result_file}")

    txt_files = get_txt_files(folder)
    if not txt_files:
        print("No .txt files found in the folder.")
        return

    #print(f"\n📘 Writing incremental results to: {result_file}\n")

    with open(result_file, "a", encoding="utf-8") as out_f:
        for i, file_path in enumerate(txt_files, 1):
            filename = os.path.basename(file_path)               # keep only the file
            filename_no_ext = os.path.splitext(filename)[0]     # remove extension
            transformed_path = filename_no_ext.replace("_", "/") # replace _ with /
            #print(f"🔹 [{i}/{len(txt_files)}] Checking: {transformed_path}")
            process_file(file_path, out_f)

    print(f"✅ All files processed. Results saved in '{result_file}'.")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python spellcheck_symspell.py <folder_path>")
        sys.exit(1)
    folder_path = sys.argv[1]
    main(folder_path)
