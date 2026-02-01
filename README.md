# SyllabiQ - Smart Study Companion 🎓
### DEV{thon} 3.0 - Web Implementation Round (School Category)
**Motto:** "Design Your Dreams into Reality"

## 👥 Team Members
* S V S Ransaja Vithanage
* E A Pushpika Suhandakara
* Thisanga Dihen

---

## 📖 Project Overview
SyllabiQ is an AI-powered educational web application designed to help Sri Lankan students convert high-bandwidth content (like YouTube videos) into low-data, syllabus-aligned study packs. It specifically targets the "Digital Clarity" UI concept to remove distractions and focus on learning.

**Live Demo:** [Add your Vercel URL here after deployment]

## 🛠️ Tech Stack
*   **Framework:** Next.js 15 (App Router)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS + Framer Motion
*   **Database:** Supabase (PostgreSQL)
*   **AI Models:** Google Gemini 2.0 Flash / GROQ (Llama 3.3)
*   **PWA:** Service Workers with Offline Support

## 🚀 Setup Instructions

1.  **Clone the repository**
    ```bash
    git clone https://github.com/your-username/syllabiq.git
    cd syllabiq
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Environment Variables**
    Create a `.env.local` file in the root directory and add the following:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    GOOGLE_AI_API_KEY=your_gemini_key_1,your_gemini_key_2
    GROQ_API_KEY=your_groq_key
    ```

4.  **Run Development Server**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) in your browser.

## ✨ Key Features
*   **AI Study Packs:** Generate Notes, Flashcards, and Quizzes from YouTube/Text.
*   **Offline Mode:** Fully functional PWA that works without internet.
*   **Gamification:** Daily Streaks and XP system.
*   **Hackathon Fail-Safe:** Smart fallbacks to prevent API crashes during demos.

## 📄 Documentation
See [FEATURES.md](./FEATURES.md) for a detailed list of functionality.
