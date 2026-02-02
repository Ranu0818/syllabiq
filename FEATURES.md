# 🚀 SyllabiQ - Key Features
### "Design Your Dreams into Reality" - DEV{thon} 3.0 Submission

SyllabiQ is an AI-powered Smart Study Companion designed to democratize education for Sri Lankan students by converting high-bandwidth content into low-data, syllabus-aligned study materials.

## 🌟 Core Features

### 1. 🧠 AI-Powered Study Engine
- **Youtube to StudyPack**: Enhanced multi-method transcript extraction (Internal + Proxy API) with "Super-Brain" fallback if transcripts are blocked.
- **Direct PDF Upload**: Client-side text extraction using `pdf.js` for privacy-aware study material generation.
- **Topic Search**: Generates comprehensive lesson packs from a simple topic keyword.
- **AI Study Mate**: Tailored conversational tutor supporting the Sri Lankan curriculum with Markdown-rich, mobile-friendly responses.
- **Parallel Processing**: Uses concurrent AI agents to generate Notes, Flashcards, and Quizzes simultaneously.

### 2. 📱 PWA & Offline Capabilities (Low-Data First)
- **Offline Mode**: Fully functional offline access to the app shell and cached study packs.
- **Installable App**: Can be installed on mobile devices (Android/iOS) via "Add to Home Screen".
- **Data Saver**: Optimized for unstable 3G/4G connections common in rural areas.

### 3. 🎯 Interactive Learning Tools
- **Smart Flashcards**: Swipeable flashcards with spaced repetition concepts to aid memorization.
- **Self-Grading Quizzes**: 10-question quizzes with instant feedback and explanations.
- **Progress Tracking**: Daily Streak system and "XP" gamification to keep students motivated.

### 4. 🎨 "Digital Clarity" UI/UX
- **Glassmorphism Design**: Modern, premium aesthetic with smooth Framer Motion animations.
- **Responsive Layout**: Seamless experience across Desktop, Tablet, and Mobile.
- **Visual Notes**: Markdown rendering with tables, emojis, and highlighting for better readability.

## 🛠️ Tech Stack
- **Frontend**: Next.js 15 (React 19), Tailwind CSS, Framer Motion
- **Backend/Db**: Firebase (Cloud Firestore, Authentication, Analytics)
- **AI**: Google Gemini 2.0 Flash, GROQ (Llama 3.3)
- **PDF Logic**: Client-side extraction via `pdfjs-dist`
- **PWA**: Service Workers with advanced offline caching

## 🛡️ Hackathon Special Features
- **API Key Rotation**: Application automatically rotates between multiple API keys to prevent rate-limiting during demos.
- **Mock Fallback**: If internet/AI fails during the presentation, the system gracefully degrades to high-quality mock data so the demo never crashes.
