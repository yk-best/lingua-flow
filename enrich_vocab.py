import json
import re
import sys

# --- CONFIGURATION ---
VOCAB_FILE = '30k-explained.txt'
# Using a regex to find the sentence file if the name varies (e.g. .tsp, .tsv, .txt)
SENTENCES_FILE_NAME = 'eng_sentences.tsv' 
OUTPUT_FILE = 'vocab_30k.json'
MAX_EXAMPLES = 2 

def parse_file():
    print(f"\n🔍 STARTING DEBUG PROCESS...")
    
    # 1. LOAD VOCAB WORDS
    print(f"\n--- 1. Reading Vocabulary ({VOCAB_FILE}) ---")
    try:
        with open(VOCAB_FILE, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
    except FileNotFoundError:
        print(f"❌ CRITICAL ERROR: '{VOCAB_FILE}' not found.")
        return

    # Split by double newlines
    blocks = re.split(r'\n\s*\n', content.strip())
    words_map = {} 
    words_list = []

    for i, block in enumerate(blocks):
        lines = block.strip().split('\n')
        if len(lines) < 2: continue

        try:
            # Check first line for word
            header_parts = lines[0].strip().split()
            if not header_parts: continue
            
            # The first part is the word (e.g., "the" or "sob")
            word_text = header_parts[0]
            
            # DEBUG: Print first 3 words found to verify parsing
            if i < 3:
                print(f"   Parsed Word #{i}: {word_text}")

            # Phonetics & Defs
            phonetic = ""
            if len(lines) > 1:
                p_parts = lines[1].strip().split('  ')
                if p_parts: phonetic = f"/{p_parts[0]}/"

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
            words_map[word_text.lower()] = entry
            
        except Exception:
            continue

    print(f"✅ Successfully loaded {len(words_list)} words into memory.")
    if len(words_list) == 0:
        print("❌ ERROR: No words found. Check if 30k-explained.txt is empty or has different formatting.")
        return

    # 2. LOAD SENTENCES
    print(f"\n--- 2. Reading Sentences ({SENTENCES_FILE_NAME}) ---")
    match_count = 0
    
    try:
        with open(SENTENCES_FILE_NAME, 'r', encoding='utf-8', errors='ignore') as f:
            for line_idx, line in enumerate(f):
                # DEBUG: Print first 3 lines of sentence file
                if line_idx < 3:
                    print(f"   Raw Line #{line_idx}: {repr(line.strip())}")

                if line_idx % 200000 == 0 and line_idx > 0:
                    print(f"   Processed {line_idx} lines... (Matches found so far: {match_count})")

                # Robust Splitting: Handles Tab OR 2+ Spaces
                parts = re.split(r'\t| {2,}', line.strip())
                
                if len(parts) < 3: 
                    continue
                
                # Assuming format: ID  LANG  TEXT
                lang = parts[1].strip()
                text = parts[2].strip()

                # DEBUG: Check first parse result
                if line_idx == 0:
                    print(f"   Parsed Line #0 -> Lang: '{lang}', Text: '{text}'")

                if lang != 'eng': continue
                if len(text) > 150 or len(text) < 5: continue

                # Match logic
                # "Let's try" -> tokens: "lets", "try" (removes punctuation)
                clean_text = re.sub(r"[^\w\s']", '', text.lower()) 
                tokens = set(clean_text.split())
                
                for token in tokens:
                    if token in words_map:
                        entry = words_map[token]
                        if len(entry['examples']) < MAX_EXAMPLES:
                            # Deduplicate
                            if not any(ex['en'] == text for ex in entry['examples']):
                                entry['examples'].append({ "en": text, "cn": "" })
                                match_count += 1
                                if match_count < 4:
                                    print(f"   ✅ MATCH #{match_count}: Added example for '{token}' -> \"{text}\"")

    except FileNotFoundError:
        print(f"❌ Error: '{SENTENCES_FILE_NAME}' not found. Please make sure the file name matches exactly.")
        return

    # 3. SAVE
    print(f"\n--- 3. Stats & Save ---")
    words_with_ex = sum(1 for w in words_list if len(w['examples']) > 0)
    print(f"Total Words: {len(words_list)}")
    print(f"Words with Examples: {words_with_ex} ({(words_with_ex/len(words_list))*100:.1f}%)")
    
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(words_list, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Saved to {OUTPUT_FILE}")
    print("👉 Now move this file to your 'public/' folder and reload the app.")

def get_category(rank):
    if rank < 4000: return "Common"
    if rank < 8000: return "Intermediate"
    if rank < 15000: return "Advanced"
    return "Master"

if __name__ == "__main__":
    parse_file()