# SyllabiQ - Smart Study Companion 🎓
### DEV{thon} 3.0 - Web Implementation Round (School Category)


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
*   **Database & Auth:** Firebase (Firestore, Auth)
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
    NEXT_PUBLIC_FIREBASE_API_KEY=your_key
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_id
    NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
    GOOGLE_AI_API_KEY=your_gemini_key_1,your_gemini_key_2
    GROQ_API_KEY=your_groq_key
    ```

4.  **Run Development Server**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) in your browser.

## ✨ Key Features
*   **AI Study Packs:** Generate Notes, Flashcards, and Quizzes from YouTube, PDFs, or Text.
*   **AI Study Mate:** A conversational tutor tailored to the Sri Lankan curriculum for follow-up questions.
*   **Direct PDF Upload:** Extract text locally from PDF files for instant study engine processing.
*   **Offline Mode:** Fully functional PWA that works without internet once content is cached.
*   **Gamification:** Daily Streaks, XP system, and personalized Grade/Stream content.

## 📄 Documentation
See [FEATURES.md](./FEATURES.md) for a detailed list of functionality.
