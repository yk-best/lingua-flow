# 🧠 LinguaFlow

**LinguaFlow** is a modern, Progressive Web App (PWA) designed to help Chinese speakers master English vocabulary through context and Spaced Repetition.

Unlike simple flashcards, LinguaFlow focuses on **context-first learning** (definitions, examples, pronunciation) and uses the **SuperMemo-2 (SM-2) algorithm** to schedule reviews at the optimal time to prevent forgetting.



[Image of spaced repetition forgetting curve]


---

## ✨ Key Features

* **🚀 Spaced Repetition System (SRS):** Automatically schedules words for review based on your performance ratings (Easy/Hard/Forgot).
* **📚 Massive 30k Word Bank:** Built-in support for a 30,000+ word frequency database.
* **🗣️ Natural Examples:** Uses high-quality sentences from the **Tatoeba Project** (human-translated) instead of robotic dictionary definitions.
* **☁️ Cross-Platform Sync:** Sync your progress seamlessly between Desktop and Mobile using a free GitHub Gist (no servers required).
* **🔊 Text-to-Speech:** Native browser audio pronunciation for words and example sentences.
* **📱 PWA Support:** Installable on iOS and Android. Works offline and feels like a native app.
* **📊 Smart Queue:** Intelligently prioritizes overdue reviews before introducing new words.

---

## 🛠️ Tech Stack

* **Framework:** React 18 + TypeScript
* **Build Tool:** Vite
* **Styling:** Tailwind CSS
* **Icons:** Lucide React
* **Storage:** LocalStorage (Offline) + GitHub Gist API (Cloud Sync)
* **Deployment:** GitHub Pages

---

## 🚀 Getting Started

### Prerequisites
* Node.js (v18 or higher)
* npm

### Installation

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/YOUR_USERNAME/lingua-flow.git](https://github.com/YOUR_USERNAME/lingua-flow.git)
    cd lingua-flow
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    ```
    Open `http://localhost:5173` in your browser.

---

## 📚 Data Setup (The 30k Database)

To enable the massive 30,000 word library with examples, you need to generate the database file locally.

### 1. Download Source Files
You need two source files in your project root (or `scripts/` folder):

* **`30k-explained.txt`**: The word list.
    * **Source:** [high-frequency-vocabulary](https://github.com/arstgit/high-frequency-vocabulary?tab=readme-ov-file)
* **`eng_sentences.tsv`**: The example sentences.
    * **Source:** [Tatoeba Downloads](https://tatoeba.org/en/downloads) -> Download "English" sentences (`eng_sentences.tsv.tar.bz2`) and extract it.

### 2. Generate the JSON
Run the included script to merge these files into a format the app can read:

```bash
# Make sure you are in the root folder
python3 scripts/enrich_vocab.py