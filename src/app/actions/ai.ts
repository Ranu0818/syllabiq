"use server";

import { Flashcard, Quiz } from "@/lib/supabase";
import { YoutubeTranscript } from 'youtube-transcript';
import * as pdfjsLib from 'pdfjs-dist';


// Allow long-running AI tasks (up to 5 mins on compatible platforms)


const GROQ_KEYS = (process.env.GROQ_API_KEY || "").split(",").map(k => k.trim()).filter(Boolean);
const GEMINI_KEYS = (process.env.GOOGLE_AI_API_KEY || "").split(",").map(k => k.trim()).filter(Boolean);

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const getGeminiUrl = () => {
    const key = GEMINI_KEYS[Math.floor(Math.random() * GEMINI_KEYS.length)] || "placeholder";
    return `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
};

const getGroqAuth = () => {
    const key = GROQ_KEYS[Math.floor(Math.random() * GROQ_KEYS.length)] || "placeholder";
    return `Bearer ${key}`;
};

// Robust Fetch with Timeout
const fetchWithTimeout = async (url: string, options: RequestInit, timeoutMs: number = 60000): Promise<Response> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(timeout);
    }
};

export interface GeneratedStudyPack {
    title: string;
    subject: string;
    notes: string;
    flashcards: Omit<Flashcard, "id" | "mastered">[];
    quizzes: Omit<Quiz, "id">[];
    suggestedQuestions: string[];
}

/**
 * Orchestrates study pack generation with PARALLEL executions & ROBUST ERROR HANDLING
 */
export async function generateStudyPackAction(
    content: string,
    contentType: "youtube" | "pdf" | "text",
    grade: string,
    stream?: string | null
): Promise<GeneratedStudyPack> {
    let finalContent = content;

    try {
        // 1. Pre-process Content (YouTube/PDF) - HARD TIMEOUT 30s
        if (contentType === "youtube") {
            console.log("[AI Action] Processing YouTube URL...");
            const videoId = extractVideoId(content);
            if (!videoId) throw new Error("Invalid YouTube URL format.");

            try {
                finalContent = await Promise.race([
                    getYouTubeTranscript(videoId),
                    new Promise<string>((_, reject) => setTimeout(() => reject(new Error("YouTube transcript fetch timed out")), 30000))
                ]);

                // Check if we got the "unavailable" fallback message
                if (finalContent.includes("(Note: Precise transcript was unavailable.)")) {
                    console.log("[AI Action] Transcript unavailable, switching to TOPIC GENERATION based on title...");
                    const titleMatch = finalContent.match(/Video Title: (.*)/); // Removed trailing \n which might be missing
                    const videoTitle = titleMatch ? titleMatch[1].trim() : "General Knowledge";

                    console.log(`[AI Action] Redirecting to Topic Generation for: ${videoTitle}`);
                    // FALLBACK: Use the Topic Action instead because we have no content
                    return await generateFromTopicAction(videoTitle, grade, stream);
                }

            } catch (err) {
                console.warn("Video processing completely failed:", err);
                throw new Error("Could not access video details. Please try entering the 'Topic Name' directly in the Magic Create menu!");
            }
        } else if (contentType === "pdf" && content.startsWith("http")) {
            console.log("[AI Action] Processing PDF URL...");
            finalContent = await Promise.race([
                extractTextFromPdf(content),
                new Promise<string>((_, reject) => setTimeout(() => reject(new Error("PDF extraction timed out")), 40000))
            ]);
        }

        if (finalContent.length > 100000) {
            finalContent = finalContent.substring(0, 100000) + "...";
        }

        console.log(`[AI Action] Starting PARALLEL generation (Source: ${contentType}, Length: ${finalContent.length})...`);
        return await executeParallelGeneration(finalContent, grade, stream, contentType);

    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        console.error("Critical Generation Error:", error);
        throw new Error(error.message || "Failed to generate study pack.");
    }
}

/**
 * Generate a study pack from a topic search query
 */
export async function generateFromTopicAction(
    topic: string,
    grade: string,
    stream?: string | null
): Promise<GeneratedStudyPack> {
    console.log(`[AI Action] Generating study pack for TOPIC: "${topic}"`);
    // Explicitly prefix so the prompt knows it's a topic, not a full text
    return await executeParallelGeneration(`SPECIFIC TOPIC TO TEACH: ${topic}`, grade, stream, "topic search");
}

/**
 * Core Parallel Logic with FAIL-SAFE (doesn't crash if one part fails)
 */
async function executeParallelGeneration(
    content: string,
    grade: string,
    stream: string | null | undefined,
    sourceType: string
): Promise<GeneratedStudyPack> {

    const notesPrompt = `
You are an expert Academic Tutor and Professor.
Based on the provided ${sourceType} below, generate **EXTREMELY COMPREHENSIVE, UNIVERSITY-LEVEL STUDY NOTES**.

CRITICAL INSTRUCTION:
- **AUDIENCE:** College / University Students.
- **GOAL:** Provide a complete academic summary of the source material. DO NOT leave out technical details, formulas, or key arguments.
- **TONE:** Formal, Professional, Academic, and Objective.
- **NO LOCALIZATION:** Do not force specific country contexts unless inherent in the source text.
- **LENGTH TARGET:** MINIMUM 1200 WORDS. 

CRITICAL FORMATTING:
- Use **proper markdown** with headings (##, ###).
- Use **tables** (|) for complex data comparison.
- Use **blockquotes** (>) for primary definitions or theorems.
- **TITLE RULE**: Max 6 words. Academic style title.

REQUIRED STRUCTURE:
1. **Executive Summary** 🎓 (150-200 words abstract)
2. **Comprehensive Content Breakdown** ### (The core notes - organize logically by sub-topic)
3. **Advanced Academic Analysis** 🔬 (Critical thinking, implications, methodology)
4. **Key Definitions & Terminology** 📖 (Glossary style)
5. **Summary of Key Arguments/Theoretics**
6. **Common Misconceptions** ⚠️
7. **Study & Review Questions** (High-level analysis questions)

Output in this EXACT JSON format:
{ 
  "title": "Short Academic Title", 
  "subject": "Academic Subject",
  "notes": "# Title\\n\\n## Executive Summary 🎓\\n\\n...",
  "suggestedQuestions": ["Q1?", "Q2?", "Q3?", "Q4?", "Q5?"]
}

CONTENT TO PROCESS:
${content}
`.trim();

    const flashcardsPrompt = `
Create **15 HIGH-QUALITY FLASHCARDS** for Grade ${grade} based on this content:
${content}

Output JSON: { "flashcards": [{ "question": "...", "answer": "..." }] }
`.trim();

    const quizPrompt = `
Create **10 QUIZ QUESTIONS** for Grade ${grade} based on this content:
${content}

Output JSON: { "quizzes": [{ "question": "...", "options": ["..."], "correct_index": 0, "explanation": "..." }] }
`.trim();

    // Parallel Execution safely
    const [notesRes, cardsRes, quizRes] = await Promise.allSettled([
        generateWithGemini<any>(notesPrompt, content, 60000), // eslint-disable-line @typescript-eslint/no-explicit-any
        generateWithGemini<any>(flashcardsPrompt, content, 30000), // eslint-disable-line @typescript-eslint/no-explicit-any
        generateWithGemini<any>(quizPrompt, content, 30000) // eslint-disable-line @typescript-eslint/no-explicit-any
    ]);

    // Process Results
    let notesData: any = {}; // eslint-disable-line @typescript-eslint/no-explicit-any
    let flashcardsData: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any
    let quizzesData: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any

    // Notes (Critical)
    if (notesRes.status === "fulfilled") {
        notesData = notesRes.value;
    } else {
        console.error("Notes generation failed:", notesRes.reason);
        throw new Error("Failed to generate main notes content. Please try again.");
    }

    // Flashcards (Optional - Fail Gracefully)
    if (cardsRes.status === "fulfilled" && cardsRes.value) {
        flashcardsData = cardsRes.value.flashcards || [];
    } else {
        console.warn("Flashcards generation failed (skipping):", cardsRes.status === "rejected" ? cardsRes.reason : "Empty result");
    }

    // Quizzes (Optional - Fail Gracefully)
    if (quizRes.status === "fulfilled" && quizRes.value) {
        quizzesData = quizRes.value.quizzes || [];
    } else {
        console.warn("Quiz generation failed (skipping):", quizRes.status === "rejected" ? quizRes.reason : "Empty result");
    }

    return {
        title: notesData.title || "Untitled Lesson",
        subject: notesData.subject || "General",
        notes: notesData.notes || "Error loading notes.",
        suggestedQuestions: notesData.suggestedQuestions || [],
        flashcards: flashcardsData,
        quizzes: quizzesData
    };
}

/**
 * Generic Generator Helper with Timeout Injection
 */
async function generateWithGemini<T>(systemPrompt: string, content: string, timeout: number = 45000): Promise<T> {
    if (GEMINI_KEYS.length > 0) {
        try {
            console.log(`[AI TRACE] Attempting Gemini generation (Timeout: ${timeout}ms)...`);
            const response = await fetchWithTimeout(getGeminiUrl(), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: `${systemPrompt}\n\nExisting Content:\n${content}` }] }],
                    generationConfig: { temperature: 0.7, responseMimeType: "application/json", maxOutputTokens: 2048 }
                }),
            }, timeout);

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                console.error(`[AI ERROR] Gemini responded with ${response.status}:`, errData);
                throw new Error(`Gemini API Error ${response.status}`);
            }

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
                console.log("[AI TRACE] Gemini success!");
                // Strip markdown code blocks if present
                const cleanText = text.replace(/```json\n?|\n?```/g, "").trim();
                return JSON.parse(cleanText) as T;
            }
            throw new Error("No response from Gemini");
        } catch (e) {
            console.warn(`[AI WARN] Gemini attempt failed:`, e);
        }
    }

    if (GROQ_KEYS.length > 0) return await generateWithGROQ<T>(systemPrompt, content);

    console.warn("All AI providers failed.");
    return null as unknown as T;
}


async function generateWithGROQ<T>(systemPrompt: string, content: string): Promise<T> {
    const response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: { "Authorization": getGroqAuth(), "Content-Type": "application/json" },
        body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "system", content: systemPrompt }, { role: "user", content: `Context:\n${content}` }],
            response_format: { type: "json_object" }, temperature: 0.7
        }),
    });
    if (!response.ok) throw new Error("Groq API Error");
    const data = await response.json();
    return JSON.parse(data.choices[0].message.content) as T;
}


function extractVideoId(url: string): string | null {
    // Handle various YouTube URL formats
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/e\/)([^&\n?#]{11})/,
        /([a-zA-Z0-9_-]{11})/ // Direct video ID
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }
    return null;
}

async function getYouTubeTranscript(videoId: string): Promise<string> {
    // Method 1: Internal youtube-transcript
    try {
        console.log(`[Transcript] Method 1: Fetching with youtube-transcript: ${videoId}`);
        const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
        if (transcriptItems && transcriptItems.length > 0) {
            return transcriptItems.map(item => item.text).join(' ');
        }
    } catch (error) {
        console.log('[Transcript] Method 1 failed');
    }

    // Method 2: Public Proxy API (provided by user)
    try {
        console.log(`[Transcript] Method 2: Fetching via Proxy API: ${videoId}`);
        const response = await fetchWithTimeout(
            `https://youtube-transcript-api.vercel.app/api/transcript?videoId=${videoId}`,
            {},
            10000
        );
        if (response.ok) {
            const data = await response.json();
            if (data.transcript && Array.isArray(data.transcript)) {
                return data.transcript.map((item: any) => item.text).join(' ');
            }
        }
    } catch (error) {
        console.log('[Transcript] Method 2 failed');
    }

    // FINAL FALLBACK: Get Title via oEmbed/noembed for "Super-Brain" Topic Generation
    console.warn("[Transcript] All transcript methods failed. Attempting 'Super-Brain' fallback via Title...");
    try {
        const response = await fetchWithTimeout(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`, {}, 5000);
        const data = await response.json();
        const title = data.title ? data.title.replace(/[|] YouTube$/, "").trim() : "Unknown Topic";
        console.log(`[Metadata] Retrieved title: ${title}`);
        return `Video Title: ${title}\n(Note: Precise transcript was unavailable.)`;
    } catch (e) {
        console.error("[Metadata] Final fallback failed:", e);
        throw new Error(
            'Could not auto-fetch transcript. Please try:\n' +
            '1. Paste the video transcript directly using "Text Content" mode\n' +
            '2. Copy the video description/summary and paste it here\n' +
            '3. On YouTube, click "...More" -> "Show transcript" and copy it manually'
        );
    }
}

async function extractTextFromPdf(pdfUrl: string): Promise<string> {
    try {
        console.log(`[PDF] Fetching document: ${pdfUrl}`);
        // Fetch as arrayBuffer for better server-side handling
        const response = await fetch(pdfUrl);
        if (!response.ok) throw new Error(`Failed to fetch PDF: ${response.statusText}`);

        const data = await response.arrayBuffer();
        const doc = await pdfjsLib.getDocument({
            data,
            useSystemFonts: true,
            disableFontFace: true
        }).promise;

        let fullText = "";

        for (let i = 1; i <= Math.min(doc.numPages, 20); i++) { // Limit to 20 pages
            const page = await doc.getPage(i);
            const content = await page.getTextContent();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const pageText = content.items.map((item: any) => item.str).join(" ");
            fullText += pageText + "\n\n";
        }

        return fullText.trim();
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        console.error("PDF extraction error:", error.message);
        throw new Error("Failed to extract text from PDF. Ensure the link is public and direct.");
    }
}

export async function askFollowUpAction(
    question: string,
    topicContext: string,
    grade: string
): Promise<string> {
    console.log(`[AI Action] Answering follow-up: "${question}"`);

    const systemPrompt = `
You are a helpful and expert Sri Lankan tutor. 
Context: "${topicContext}"
Grade: ${grade}

YOUR TASK:
Answer the student's question clearly and helpfuly based on the context.

FORMATTING RULES:
- Use **proper markdown**.
- Use **bullet points** or **numbered lists** for steps, features, or lists of items.
- Keep paragraphs short (2-3 sentences max) for better mobile readability.
- Use **bold** for key terms.
- Use simple language suitable for a Grade ${grade} student.
- Add relevant emojis sparingly.
- LIMIT: 200 words max.
`.trim();

    // Reuse generateWithGemini logic but specialized for text return
    if (GEMINI_KEYS.length > 0) {
        try {
            const response = await fetch(getGeminiUrl(), {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt + "\nQ: " + question }] }] })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Gemini API Error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!text) {
                throw new Error("Empty response from Gemini");
            }
            return text;
        } catch (e) {
            console.warn("Gemini Q&A failed, falling back if possible:", e);
            // Fall through to Groq if allowed
        }
    }
    if (GROQ_KEYS.length > 0) {
        const auth = getGroqAuth();
        const response = await fetch(GROQ_API_URL, {
            method: "POST",
            headers: {
                "Authorization": auth,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "llama-3.1-8b-instant",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: question }
                ],
                temperature: 0.7,
                max_tokens: 512
            })
        });
        const data = await response.json();
        return data.choices?.[0]?.message?.content || "Error";
    }

    return "No AI provider available.";
}

/**
 * AI Study Mate - Conversational Learning Assistant
 */
export async function askStudyMateAction(
    message: string,
    grade: string,
    stream?: string | null,
    conversationHistory?: { role: 'user' | 'assistant'; content: string }[]
): Promise<string> {
    console.log(`[Study Mate] Processing message for Grade ${grade}${stream ? ` (${stream})` : ''}`);

    // Build context-aware system prompt
    const systemPrompt = `You are a knowledgeable and professional Academic AI Tutor.

STUDENT CONTEXT:
- Academic Level: College / University Prep
- Goal: Deep understanding of concepts

YOUR ROLE:
- Provide clear, accurate, and high-level academic explanations.
- Be objective and scholarly methods.
- Avoid unnecessary local slang or forced cultural references.
- Explain complex concepts simply but maintaining academic rigor.
- Use relevant examples from global academic standards.

GUIDELINES:
- Keep responses concise (max 300 words).
- Focus on the "Why" and "How".
- Be encouraging but professional.
- If unsure, provide general academic guidance.

Current conversation:`;

    // Build conversation context
    let conversationContext = systemPrompt;
    if (conversationHistory && conversationHistory.length > 0) {
        // Include last 5 messages for context
        const recentHistory = conversationHistory.slice(-5);
        conversationContext += "\n" + recentHistory.map(msg =>
            `${msg.role === 'user' ? 'Student' : 'AI Study Mate'}: ${msg.content}`
        ).join('\n');
    }
    conversationContext += `\nStudent: ${message}\nAI Study Mate:`;

    // Try Gemini first
    if (GEMINI_KEYS.length > 0) {
        try {
            const response = await fetch(getGeminiUrl(), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: conversationContext }] }],
                    generationConfig: { temperature: 0.8, maxOutputTokens: 512 }
                })
            });

            if (!response.ok) {
                throw new Error(`Gemini API Error: ${response.status}`);
            }

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!text) {
                throw new Error("Empty response from Gemini");
            }
            return text.trim();
        } catch (e) {
            console.warn("Gemini Study Mate failed, trying Groq:", e);
        }
    }

    // Fallback to Groq
    if (GROQ_KEYS.length > 0) {
        try {
            const response = await fetch(GROQ_API_URL, {
                method: "POST",
                headers: {
                    "Authorization": getGroqAuth(),
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: "llama-3.1-8b-instant",
                    messages: [
                        { role: "system", content: systemPrompt },
                        ...(conversationHistory || []).slice(-5),
                        { role: "user", content: message }
                    ],
                    temperature: 0.8,
                    max_tokens: 512
                })
            });
            const data = await response.json();
            return data.choices?.[0]?.message?.content || "Sorry, I couldn't process that. Please try again.";
        } catch (e) {
            console.error("Groq Study Mate failed:", e);
        }
    }

    return "I'm having trouble connecting right now. Please try again in a moment! 🔄";
}
