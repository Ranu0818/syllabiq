# SyllabiQ - Project Documentation

## 📝 Project Description
SyllabiQ is a revolutionary educational platform built for the **DEV{thon} 3.0** hackathon. It addresses the "Digital Divide" in Sri Lanka by transforming complex, high-bandwidth educational content (like YouTube lectures and long PDFs) into lightweight, syllabus-aligned study materials. 

The platform is built with a **"Low-Data First"** philosophy, ensuring that students in areas with unstable internet can still access high-quality learning resources offline through Progressive Web App (PWA) technology.

---

## ✨ Key Features

### 1. 🤖 AI-Driven Content Generation
*   **YouTube Transcription**: Extracts text from any educational video and summarizes it into structured study notes.
*   **Topic-Based Learning**: Users can search for any syllabus topic (e.g., "Photosynthesis"), and the AI generates a complete study pack.
*   **Intelligent Q&A**: A built-in tutor that answers follow-up questions based on the generated notes.
*   **Parallel Processing**: Generates notes, flashcards, and quizzes simultaneously to minimize wait times.

### 2. 📡 Offline & PWA Capabilities
*   **Full PWA Support**: Can be "installed" on Android, iOS, and Desktop as a native app.
*   **App Shell Caching**: Instant loading even when offline using advanced Service Workers.
*   **Offline Visibility**: Clear UI indicators for connectivity status.

### 3. 🎯 Gamified Learning
*   **Active Recall Flashcards**: Interactive cards with flip animations to aid memorization.
*   **Self-Assessment Quizzes**: Instant-feedback quizzes with detailed explanations for correct/incorrect answers.
*   **Streak System**: Encourages daily study habits by tracking consecutive days of activity.

### 4. 💎 "Digital Clarity" UI/UX
*   **Distraction-Free Reading**: A clean, premium academic interface.
*   **Responsive Design**: Optimized for everything from 24-inch monitors to 5-inch smartphone screens.
*   **Markdown Support**: Beautifully rendered notes with tables, bold text, and code blocks.

---

## 🛠️ Technical Implementation
*   **Frontend**: Next.js 15, React 19, Tailwind CSS.
*   **Animations**: Framer Motion.
*   **Backend**: Supabase (Auth, Postgres, RLS).
*   **AI Engine**: Google Gemini 2.0 & GROQ Llama 3.3.
*   **Persistence**: Real-time DB sync and IndexedDB for offline support.
