# 🧠 LinguaFlow

**LinguaFlow** is a modern, Progressive Web App (PWA) designed to help Chinese speakers master English vocabulary through context and Spaced Repetition.

Unlike simple flashcards, LinguaFlow focuses on **context-first learning** (definitions, examples, pronunciation) and uses the **SuperMemo-2 (SM-2) algorithm** to schedule reviews at the optimal time to prevent forgetting.

![LinguaFlow App](https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=800&q=80)
*(Replace with a screenshot of your actual app)*

---

## ✨ Key Features

* **🚀 Spaced Repetition System (SRS):** Automatically schedules words for review based on your performance ratings (Easy/Hard/Forgot).
* **📚 Word Library:** Download curated word packs (TOEFL, CET-4, Business) or generate massive mock datasets for testing.
* **☁️ Cross-Platform Sync:** Sync your progress seamlessly between Desktop and Mobile using a free GitHub Gist (no servers required).
* **🔊 Text-to-Speech:** Native browser audio pronunciation for words and example sentences.
* **📱 PWA Support:** Installable on iOS and Android. Works offline and feels like a native app.
* **📊 Smart Queue:** Intelligently prioritizes overdue reviews before introducing new words.
* **✍️ Custom Vocabulary:** Add your own words manually with Chinese translations and examples.

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

## ☁️ How to Sync Data (Multi-Device)

LinguaFlow uses **GitHub Gists** as a free, private cloud database.

### Step 1: Get a GitHub Token
1.  Log in to [GitHub](https://github.com).
2.  Go to **Settings** -> **Developer settings** -> **Personal access tokens** -> **Tokens (classic)**.
3.  Click **Generate new token (classic)**.
4.  **Scopes:** Check **only** the `gist` box.
5.  Copy the generated token (starts with `ghp_...`).

### Step 2: Syncing
1.  Open LinguaFlow and go to **Settings**.
2.  Paste your Token into the **GitHub Token** field.
3.  **Device A (Source):** Click **Save to Cloud**. This creates a Gist ID.
4.  **Device B (Target):**
    * Paste the **same Token**.
    * Paste the **Gist ID** (from Device A) into the "Connected Gist ID" field.
    * Click **Load Data**.

---

## 📚 Managing Word Packs

The app comes with a "Word Bank" utility (`src/utils/word_bank.ts`).

* **Mock Mode:** By default, it generates infinite placeholder words for testing performance.
* **Real Mode:** You can connect real JSON files hosted on the internet (e.g., Raw GitHub Gists).
    * Update `src/utils/word_bank.ts`:
        ```typescript
        {
          id: 'toefl-core',
          sourceUrl: '[https://gist.githubusercontent.com/.../raw/toefl.json](https://gist.githubusercontent.com/.../raw/toefl.json)' 
        }
        ```

---

## 📦 Deployment

This project is configured for **GitHub Pages**.

1.  **Configure Base URL:**
    Open `vite.config.ts` and ensure the `base` property matches your repo name:
    ```typescript
    export default defineConfig({
      base: '/lingua-flow/', // Must match [https://user.github.io/lingua-flow/](https://user.github.io/lingua-flow/)
      // ...
    })
    ```

2.  **Deploy Script:**
    Run the following command to build and deploy to the `gh-pages` branch automatically:
    ```bash
    npm run deploy
    ```

---

## 📄 License

Distributed under the MIT License.