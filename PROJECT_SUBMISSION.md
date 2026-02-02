# SyllabiQ - Project Submission 🎓
### DEV{thon} 3.0 - Web Implementation Round (School Category)
**Motto:** "Design Your Dreams into Reality"

---

## 👥 Team Members

*   **S V S Ransaja Vithanage**
*   **E A Pushpika Suhandakara**
*   **Thisanga Dihen**

---

## 📖 Project Overview

**SyllabiQ** is an AI-powered educational web application designed to democratize education for Sri Lankan students. It addresses the challenge of high data costs and bandwidth limitations by converting resource-heavy content (like 4K YouTube videos or large PDF textbooks) into lightweight, syllabus-aligned study packs.

Our "Digital Clarity" UI concept removes distractions, while the Offline First (PWA) architecture ensures learning continues even without an active internet connection.

---

## 🌟 Key Features List

### 1. 🧠 AI-Powered Study Engine
*   **Youtube to StudyPack**: Instantly converts educational videos into structured notes, using a robust multi-method extraction engine (Internal Lib + Proxy API + "Super-Brain" Metadata Fallback).
*   **Direct PDF Upload**: Client-side text extraction using `pdf.js` allows users to upload school documents for privacy-aware study generation.
*   **Topic Search**: Generates comprehensive lesson packs from a simple keyword (e.g., "Mixtures").
*   **AI Study Mate**: A conversational tutor tailored to the Sri Lankan curriculum for follow-up questions, supporting Markdown-rich responses.
*   **Parallel Processing**: Concurrent AI generation for Notes, Flashcards, and Quizzes ensures speed.

### 2. 📱 PWA & Offline Capabilities (Low-Data First)
*   **Offline Mode**: Fully functional offline access to the app shell and cached study packs.
*   **Installable App**: Can be installed on mobile devices (Android/iOS) via "Add to Home Screen".
*   **Data Saver**: Optimized for unstable 3G/4G connections common in rural areas.

### 3. 🎯 Interactive Learning Tools
*   **Smart Flashcards**: Swipeable flashcards with spaced repetition concepts to aid memorization.
*   **Self-Grading Quizzes**: 10-question quizzes with instant feedback and explanations.
*   **Progress Tracking**: Daily Streak system and "XP" gamification to keep students motivated.

### 4. 🎨 "Digital Clarity" UI/UX
*   **Glassmorphism Design**: Modern, premium aesthetic with smooth Framer Motion animations.
*   **Responsive Layout**: Seamless experience across Desktop, Tablet, and Mobile.
*   **Visual Notes**: Markdown rendering with tables, emojis, and highlighting for better readability.

---

## 🛠️ Tech Stack

*   **Frontend:** Next.js 15 (React 19), Tailwind CSS, Framer Motion
*   **Backend/Db:** Firebase (Cloud Firestore, Authentication, Analytics)
*   **AI Models:** Google Gemini 2.0 Flash / GROQ (Llama 3.3)
*   **PDF Logic:** Client-side extraction via `pdfjs-dist`
*   **PWA:** Service Workers with advanced offline caching

---

## 🛡️ Hackathon Special Features

*   **Fail-Safe Architecture**: Includes a robust fallback system (Mock Data) to ensure functionality even if API limits are reached during demos.
*   **API Key Rotation**: Application automatically rotates between multiple API keys to prevent rate-limiting.
