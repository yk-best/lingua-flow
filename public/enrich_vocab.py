import json
import re
import sys

# --- CONFIGURATION ---
VOCAB_FILE = '30k-explained.txt'
SENTENCES_FILE = 'eng_sentences.tsv' 
OUTPUT_FILE = 'vocab_30k.json'
MAX_EXAMPLES = 2 

def parse_file():
    # 1. Parse Vocab
    print(f"--- Reading {VOCAB_FILE} ---")
    try:
        with open(VOCAB_FILE, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
    except FileNotFoundError:
        print(f"❌ Error: {VOCAB_FILE} not found.")
        return

    blocks = re.split(r'\n\s*\n', content.strip())
    words_map = {} 
    words_list = []

    for i, block in enumerate(blocks):
        lines = block.strip().split('\n')
        if len(lines) < 2: continue

        try:
            header_parts = lines[0].strip().split()
            if not header_parts: continue
            word_text = header_parts[0]
            
            # Phonetics
            phonetic = ""
            if len(lines) > 1:
                p_parts = lines[1].strip().split('  ')
                if p_parts: phonetic = f"/{p_parts[0]}/"

            # Defs
            raw_def = " ".join([l.strip() for l in lines[2:]])
            
            entry = {
                "id": f"30k_{i}",
                "word": word_text,
                "phonetic": phonetic,
                "category": get_category(i),
                "status": "new",
                "definitions": [{"pos": "mix", "en": "", "cn": raw_def}],
                "examples": [], 
                "note": "",
                "srs": { "interval": 0, "repetition": 0, "efactor": 2.5, "dueDate": 0 }
            }
            
            words_list.append(entry)
            # Store lower case for matching
            words_map[word_text.lower()] = entry
            
        except Exception:
            continue

    print(f"✅ Loaded {len(words_list)} words.")

    # 2. Enrich with Sentences
    print(f"--- Processing {SENTENCES_FILE} ---")
    match_count = 0
    try:
        with open(SENTENCES_FILE, 'r', encoding='utf-8', errors='ignore') as f:
            for line_idx, line in enumerate(f):
                if line_idx % 100000 == 0:
                    print(f"Processed {line_idx} lines... (Matches found: {match_count})")

                # Robust Splitting: Try tab first, then space if tab fails
                parts = line.strip().split('\t')
                if len(parts) < 3:
                    # Fallback for space-separated files
                    # Format: ID LANG TEXT -> 1276 eng Text...
                    parts = line.strip().split(maxsplit=2)
                
                if len(parts) < 3: continue
                
                lang = parts[1]
                text = parts[2]

                # Ensure it is English
                if lang != 'eng': continue
                
                # Skip very long/short sentences
                if len(text) > 100 or len(text) < 10: continue

                # Tokenize sentence (remove punctuation, lowercase)
                # "Hello, world!" -> {"hello", "world"}
                tokens = set(re.findall(r'\b[a-z]+\b', text.lower()))
                
                for token in tokens:
                    if token in words_map:
                        entry = words_map[token]
                        # Only add if we need more examples
                        if len(entry['examples']) < MAX_EXAMPLES:
                            # Check duplicates
                            if not any(ex['en'] == text for ex in entry['examples']):
                                entry['examples'].append({
                                    "en": text,
                                    "cn": "" 
                                })
                                match_count += 1
                                
                                # Optimization: If full, remove from map? 
                                # NO, because words might appear multiple times in our list if duplicates exist.
                                # But for speed, if we assume unique words:
                                if len(entry['examples']) >= MAX_EXAMPLES:
                                    del words_map[token]

    except FileNotFoundError:
        print(f"❌ Error: {SENTENCES_FILE} not found.")

    # 3. Stats & Save
    filled_count = sum(1 for w in words_list if len(w['examples']) > 0)
    print(f"--- Stats ---")
    print(f"Total Words: {len(words_list)}")
    print(f"Words with Examples: {filled_count}")
    
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(words_list, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Saved to {OUTPUT_FILE}")

def get_category(rank):
    if rank < 4000: return "Common"
    if rank < 8000: return "Intermediate"
    if rank < 15000: return "Advanced"
    return "Master"

if __name__ == "__main__":
    parse_file()