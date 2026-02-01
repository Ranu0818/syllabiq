"use server";

import { Flashcard, Quiz } from "@/lib/supabase";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GEMINI_API_KEY = process.env.GOOGLE_AI_API_KEY;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

// Timeout helper - switches to fallback if model is too slow
const fetchWithTimeout = async (url: string, options: RequestInit, timeoutMs: number = 30000): Promise<Response> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        return response;
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
 * Orchestrates study pack generation with fallback logic
 */
export async function generateStudyPackAction(
    content: string,
    contentType: "youtube" | "pdf" | "text",
    grade: string,
    stream?: string | null
): Promise<GeneratedStudyPack> {
    let finalContent = content;

    // 1. Pre-process Content (YouTube Transcript)
    if (contentType === "youtube") {
        console.log("[AI Action] Processing YouTube URL...");
        const videoId = extractVideoId(content);
        if (!videoId) throw new Error("Invalid YouTube URL format.");

        finalContent = await getYouTubeTranscript(videoId);
        if (finalContent.length > 100000) {
            finalContent = finalContent.substring(0, 100000) + "...";
        }
    }

    const systemPrompt = `
You are an expert Sri Lankan educator. Your task is to take the provided study material (from ${contentType}) and generate a structured "Study Pack" for a Grade ${grade} student${stream ? ` in the ${stream} stream` : ""}.

CRITICAL REQUIREMENTS:
- All information MUST be factually accurate and aligned with the Sri Lankan O/L or A/L syllabus.
- Use language and complexity suitable for Grade ${grade}.
- The notes should be **VISUAL STUDY NOTES** style: friendly, scannable, and engaging.

### Content Style Guide:
- **Emojis**: Use relevant emojis (🧬, ⚡, 🔬, 📚) to make headings and key points visually distinct.
- **Headings**: Clear markdown headings (##, ###).
- **Blockquotes**: Use \`>\` for definitions and important concepts.
- **Tables**: Use markdown tables to compare concepts where applicable.
- **Bullet Points**: Keep paragraphs short (2-3 sentences max) and use bullet points heavily.
- **Exam Tips**: Use "**🎯 Exam Tip:**" callouts for exam-specific advice.
- **Summary**: A brief, encouraging summary at the end.

The Study Pack must be valid JSON with:
1. "title": A concise, descriptive title for the lesson.
2. "subject": The subject area (e.g., Biology, Physics, Maths, Science).
3. "notes": Comprehensive markdown notes (minimum 600 words) based on the content. Follow the Style Guide.
4. "flashcards": Array of 10-12 flashcards as { "question": string, "answer": string }.
5. "quizzes": Array of 6-8 quiz questions as { "question": string, "options": string[4], "correct_index": number (0-3), "explanation": string }.
6. "suggestedQuestions": Array of 3-5 SHORT follow-up questions (max 10 words each) the student might ask to deepen understanding. REQUIRED.

Output ONLY the JSON object. Do not include any markdown code fences or explanations.
`.trim();

    // 2. Try Gemini First (Fastest & Free)
    if (GEMINI_API_KEY && GEMINI_API_KEY !== "placeholder-api-key") {
        try {
            console.log("[AI Action] Attempting generation with Google Gemini...");
            return await generateWithGemini(systemPrompt, finalContent);
        } catch (error) {
            console.warn("[AI Action] Gemini failed, falling back to GROQ:", error);
        }
    }

    // 3. Fallback to GROQ
    if (GROQ_API_KEY) {
        console.log("[AI Action] Attempting generation with GROQ...");
        return await generateWithGROQ(systemPrompt, finalContent);
    }

    throw new Error("No AI providers (Gemini or GROQ) are configured correctly.");
}

/**
 * Generate a study pack from a topic search query (no source content needed)
 */
export async function generateFromTopicAction(
    topic: string,
    grade: string,
    stream?: string | null
): Promise<GeneratedStudyPack> {
    console.log(`[AI Action] Generating study pack for topic: "${topic}" (Grade ${grade})`);

    const systemPrompt = `
You are an expert Sri Lankan educator. Generate a comprehensive, FACTUALLY ACCURATE study pack on the topic: "${topic}" for a Grade ${grade} student${stream ? ` in the ${stream} stream` : ""}.

CRITICAL REQUIREMENTS:
- All information MUST be factually accurate and aligned with the Sri Lankan O/L or A/L syllabus.
- Use language and complexity suitable for Grade ${grade}.
- The notes should be **VISUAL STUDY NOTES** style: friendly, scannable, and engaging.

### Content Style Guide:
- **Emojis**: Use relevant emojis (🧬, ⚡, 🔬, 📚) to make headings and key points visually distinct.
- **Headings**: Clear markdown headings (##, ###).
- **Blockquotes**: Use \`>\` for definitions and important concepts.
- **Tables**: Use markdown tables to compare concepts (e.g., Difference between X and Y) where applicable.
- **Bullet Points**: Keep paragraphs short (2-3 sentences max) and use bullet points heavily.
- **Exam Tips**: Use "**🎯 Exam Tip:**" callouts for exam-specific advice.
- **Summary**: A brief, encouraging summary at the end.

The Study Pack must be valid JSON with:
1. "title": A concise, descriptive title for the topic.
2. "subject": The subject area (e.g., Biology, Physics, Chemistry, Maths, Science, History, Geography, ICT).
3. "notes": Comprehensive markdown notes (minimum 600 words) following the Style Guide above.
4. "flashcards": Array of 10-12 flashcards as { "question": string, "answer": string }. Cover all key concepts.
5. "quizzes": Array of 6-8 quiz questions as { "question": string, "options": string[4], "correct_index": number (0-3), "explanation": string }. Vary difficulty.
6. "suggestedQuestions": Array of 3-5 SHORT follow-up questions (max 10 words each) the student might ask to deepen understanding. REQUIRED.

Output ONLY the JSON object. Do not include any markdown code fences or explanations.
`.trim();

    const userContent = `Generate a study pack for the topic: "${topic}"`;

    // Try Gemini first
    if (GEMINI_API_KEY && GEMINI_API_KEY !== "placeholder-api-key") {
        try {
            console.log("[AI Action] Attempting topic generation with Google Gemini...");
            return await generateWithGemini(systemPrompt, userContent);
        } catch (error) {
            console.warn("[AI Action] Gemini failed, falling back to GROQ:", error);
        }
    }

    // Fallback to GROQ
    if (GROQ_API_KEY) {
        console.log("[AI Action] Attempting topic generation with GROQ...");
        return await generateWithGROQ(systemPrompt, userContent);
    }

    throw new Error("No AI providers (Gemini or GROQ) are configured correctly.");
}

/**
 * Generate with Gemini 2.0 Flash (with 30s timeout)
 */
async function generateWithGemini(systemPrompt: string, content: string): Promise<GeneratedStudyPack> {
    const response = await fetchWithTimeout(GEMINI_API_URL!, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{
                parts: [{ text: `${systemPrompt}\n\nContent to summarize:\n${content}` }]
            }],
            generationConfig: {
                temperature: 0.7,
                topP: 0.8,
                topK: 40,
                maxOutputTokens: 2048,
                responseMimeType: "application/json",
            }
        }),
    }, 30000); // 30 second timeout

    if (!response.ok) {
        const err = await response.json();
        throw new Error(`Gemini API Error: ${err.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Gemini returned empty response");

    return JSON.parse(text) as GeneratedStudyPack;
}

/**
 * Generate with GROQ (Fallback)
 */
async function generateWithGROQ(systemPrompt: string, content: string): Promise<GeneratedStudyPack> {
    const response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${GROQ_API_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Generate a study pack from this content:\n\n${content}` },
            ],
            response_format: { type: "json_object" },
            temperature: 0.7,
        }),
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(`GROQ API Error: ${err.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content) as GeneratedStudyPack;
}

/**
 * Extracts YouTube Video ID from various URL formats
 */
function extractVideoId(url: string): string | null {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

/**
 * Fetches YouTube transcript directly without an API key
 */
async function getYouTubeTranscript(videoId: string): Promise<string> {
    try {
        const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
        const html = await response.text();

        // Find the captions data in the HTML
        const parts = html.split('"captions":');
        if (parts.length < 2) {
            throw new Error("No captions found for this video. Please try another video or paste text.");
        }

        const captionsJsonStr = parts[1].split(',"videoDetails"')[0];
        const captionsData = JSON.parse(captionsJsonStr);

        const captionTracks = captionsData.playerCaptionsTracklistRenderer?.captionTracks;
        if (!captionTracks || captionTracks.length === 0) {
            throw new Error("No transcript tracks available for this video.");
        }

        // Prefer English, then take the first one available
        const track = captionTracks.find((t: any) => t.languageCode === 'en' || t.languageCode === 'si') || captionTracks[0];
        const transcriptResponse = await fetch(track.baseUrl);
        const transcriptXml = await transcriptResponse.text();

        // Simple regex to extract text from XML tags
        const text = transcriptXml
            .replace(/<text[^>]*>/g, ' ')
            .replace(/<\/text>/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&#39;/g, "'")
            .replace(/&quot;/g, '"')
            .replace(/\s+/g, ' ')
            .trim();

        return text;
    } catch (error: any) {
        console.error("Transcript extraction error:", error);
        throw new Error(error.message || "Could not retrieve transcript from YouTube.");
    }
}

/**
 * Answer a follow-up question based on a study pack's topic
 */
export async function askFollowUpAction(
    question: string,
    topicContext: string,
    grade: string
): Promise<string> {
    console.log(`[AI Action] Answering follow-up question: "${question}"`);

    const systemPrompt = `
You are a helpful Sri Lankan tutor. The student is studying "${topicContext}" at Grade ${grade} level.
Answer their question clearly and concisely. Use simple language appropriate for their grade.
PRIORITIZE the study context, but if the question requires general knowledge to explain fully, USE YOUR GENERAL KNOWLEDGE.
Do NOT refuse to answer reasonable follow-up questions.
Keep your answer under 200 words. Use bullet points if helpful.
`.trim();

    const userContent = question;

    // Try Gemini first
    if (GEMINI_API_KEY && GEMINI_API_KEY !== "placeholder-api-key") {
        try {
            const response = await fetch(GEMINI_API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [
                        { role: "user", parts: [{ text: systemPrompt + "\n\nStudent's question: " + userContent }] }
                    ],
                    generationConfig: { temperature: 0.7, maxOutputTokens: 512 }
                })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error?.message || "Gemini API error");
            return data.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't generate a response.";
        } catch (error) {
            console.warn("[AI Action] Gemini Q&A failed, falling back to GROQ:", error);
        }
    }

    // Fallback to GROQ
    if (GROQ_API_KEY) {
        const response = await fetch(GROQ_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: "llama-3.1-8b-instant",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userContent }
                ],
                temperature: 0.7,
                max_tokens: 512
            })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || "GROQ API error");
        return data.choices?.[0]?.message?.content || "I couldn't generate a response.";
    }

    throw new Error("No AI providers configured.");
}
