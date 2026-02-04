"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    Sparkles,
    Youtube,
    FileText,
    Type,
    Upload,
    Search,
    Loader2,
    X
} from "lucide-react";
import { Button, Input } from "@/components/ui";
import { BottomSheet } from "@/components/ui/Modal";
import { useAuth } from "@/contexts/AuthContext";
import { useCreation } from "@/contexts/CreationContext";
import { generateId } from "@/lib/utils";
import { generateStudyPackAction, generateFromTopicAction } from "@/app/actions/ai";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { saveStudyPackToIDB } from "@/lib/idb";

// Import pdfjs for client-side extraction
import * as pdfjsLib from 'pdfjs-dist';

// Safe worker assignment
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

interface StudyPackCreatorProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function StudyPackCreator({ isOpen, onClose, onSuccess }: StudyPackCreatorProps) {
    const router = useRouter();
    const { user, profile, isAuthenticated, updateProfile } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [createType, setCreateType] = useState<"youtube" | "pdf" | "text" | "topic" | null>(null);
    const [youtubeUrl, setYoutubeUrl] = useState("");
    const [pdfUrl, setPdfUrl] = useState("");
    const [textContent, setTextContent] = useState("");
    const [topicQuery, setTopicQuery] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [isExtracting, setIsExtracting] = useState(false);
    const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

    const { initialType, initialTopic } = useCreation();

    // Initialize with initial values if provided
    useEffect(() => {
        if (isOpen) {
            if (initialType) setCreateType(initialType);
            if (initialTopic) setTopicQuery(initialTopic);
        }
    }, [isOpen, initialType, initialTopic]);

    const handleTypeSelect = (type: "youtube" | "pdf" | "text" | "topic") => {
        setCreateType(type);
    };

    const handleFileSelect = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || file.type !== "application/pdf") {
            if (file) alert("Please select a PDF file.");
            return;
        }

        setIsExtracting(true);
        setSelectedFileName(file.name);

        try {
            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            const pdf = await loadingTask.promise;

            let fullText = "";
            const maxPages = Math.min(pdf.numPages, 30); // Prevent massive files from crashing

            for (let i = 1; i <= maxPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items
                    .map((item: any) => item.str)
                    .join(" ");
                fullText += pageText + "\n\n";
            }

            setTextContent(fullText.trim());
            console.log(`Extracted ${fullText.length} characters from ${file.name}`);
        } catch (error) {
            console.error("PDF extraction error:", error);
            alert("Failed to extract text from PDF. Please try copying the text manually.");
            setSelectedFileName(null);
        } finally {
            setIsExtracting(false);
        }
    };

    const handleGenerate = async () => {
        if (!isAuthenticated) {
            alert("Please sign in to generate study packs.");
            return;
        }

        if (!profile) {
            alert("We're still setting up your profile. Please wait a moment or try refreshing the page.");
            return;
        }

        if (createType === "topic") return; // Topic uses separate handler

        setIsGenerating(true);
        try {
            console.log("Starting manual generation for type:", createType);
            let content = textContent;

            // For PDF, if we have extracted text, use it as 'text' type to avoid re-extraction attempt
            let effectiveType: "youtube" | "pdf" | "text" = createType || "text";

            if (createType === "youtube") {
                content = youtubeUrl;
            } else if (createType === "pdf") {
                if (textContent.trim()) {
                    // We have extracted text from a file/manual paste
                    content = textContent;
                    effectiveType = "text";
                } else if (pdfUrl) {
                    content = pdfUrl;
                    effectiveType = "pdf";
                }
            }

            if (!content) {
                alert("Please provide content or a URL.");
                setIsGenerating(false);
                return;
            }

            const generated = await generateStudyPackAction(
                content,
                effectiveType,
                profile.grade || "10",
                profile.stream
            );
            console.log("AI Generation successful:", generated.title);

            // Save to Firestore
            let finalGrade = profile.grade;
            if (!finalGrade || finalGrade === "null" || finalGrade === "undefined") finalGrade = "11";

            const payload = {
                user_id: user?.uid, // Firebase uses uid
                title: generated.title || "Untitled Pack",
                subject: generated.subject || "General",
                grade: finalGrade,
                content_type: createType || "text",
                source_url: createType === "youtube" ? youtubeUrl : (createType === "pdf" ? pdfUrl : null),
                notes: generated.notes || "",
                flashcards: generated.flashcards.map(f => ({ ...f, id: generateId(), mastered: false })),
                quizzes: generated.quizzes.map(q => ({ ...q, id: generateId() })),
                is_offline: false,
                suggested_questions: generated.suggestedQuestions || [],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            console.log("Attempting to save to Firestore...");
            // Pre-generate a local id in case we need to save locally
            const localId = generateId();
            payload.id = localId;

            try {
                const docRef = await addDoc(collection(db, "study_packs"), payload);
                console.log("Successfully saved manual pack to Firestore:", docRef.id);

                // Save synced copy to IndexedDB with server id
                const syncedPayload = { ...payload, id: docRef.id, is_offline: false };
                await saveStudyPackToIDB(syncedPayload);

                // Navigate to the new study pack
                router.push(`/study/${docRef.id}`);
            } catch (err) {
                console.warn("Firestore save failed, saving pack to IndexedDB for offline:", err);
                payload.is_offline = true;
                await saveStudyPackToIDB(payload);
                alert("You're offline — the study pack was saved locally and will sync when you're back online.");

                // Navigate to library so the user can find the offline pack
                router.push('/library');
            }

            // Update user stats (XP + Data Saved)
            const newXp = (profile.xp || 0) + 50; // 50 XP per pack
            const newDataSaved = (profile.data_saved_mb || 0) + 15; // Mock 15MB saved
            await updateProfile({
                xp: newXp,
                data_saved_mb: newDataSaved
            });

            // Cleanup
            setYoutubeUrl("");
            setPdfUrl("");
            setTextContent("");
            setTopicQuery("");
            setSelectedFileName(null);
            setCreateType(null);
            onClose();

            if (onSuccess) onSuccess();

        } catch (error: any) {
            console.error("Manual generation error:", error);
            alert(`Error: ${error.message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleTopicGenerate = async () => {
        if (!isAuthenticated) {
            alert("Please sign in to generate study packs.");
            return;
        }

        if (!profile) {
            alert("We're still setting up your profile. Please wait a moment or try refreshing the page.");
            return;
        }

        if (!topicQuery.trim()) {
            alert("Please enter a topic to search.");
            return;
        }

        setIsGenerating(true);
        try {
            console.log("Starting generation for topic:", topicQuery.trim());
            const generated = await generateFromTopicAction(
                topicQuery.trim(),
                profile.grade || "10",
                profile.stream
            );
            console.log("AI Generation successful:", generated.title);

            // Save to Firestore
            let finalGrade = profile.grade;
            if (!finalGrade || finalGrade === "null" || finalGrade === "undefined") finalGrade = "11";

            const payload = {
                user_id: user?.uid,
                title: generated.title || "Untitled Pack",
                subject: generated.subject || "General",
                grade: finalGrade,
                content_type: "text",
                source_url: null,
                notes: generated.notes || "",
                flashcards: generated.flashcards.map(f => ({ ...f, id: generateId(), mastered: false })),
                quizzes: generated.quizzes.map(q => ({ ...q, id: generateId() })),
                is_offline: false,
                suggested_questions: generated.suggestedQuestions || [],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            // Pre-generate a local id in case we need to save locally
            const localId = generateId();
            payload.id = localId;

            try {
                const docRef = await addDoc(collection(db, "study_packs"), payload);
                // Save synced copy to IndexedDB with server id
                const syncedPayload = { ...payload, id: docRef.id, is_offline: false };
                await saveStudyPackToIDB(syncedPayload);

                // Update stats
                const newXp = (profile.xp || 0) + 50;
                const newDataSaved = (profile.data_saved_mb || 0) + 15;
                await updateProfile({
                    xp: newXp,
                    data_saved_mb: newDataSaved
                });

                setTopicQuery("");
                setCreateType(null);
                onClose();

                if (onSuccess) onSuccess();

                router.push(`/study/${docRef.id}`);
            } catch (err) {
                console.warn("Firestore save failed, saving pack to IndexedDB for offline:", err);
                payload.is_offline = true;
                await saveStudyPackToIDB(payload);
                alert("You're offline — the study pack was saved locally and will sync when you're back online.");

                // Update stats locally where possible
                const newXp = (profile.xp || 0) + 50;
                const newDataSaved = (profile.data_saved_mb || 0) + 15;
                await updateProfile({
                    xp: newXp,
                    data_saved_mb: newDataSaved
                });

                setTopicQuery("");
                setCreateType(null);
                onClose();

                if (onSuccess) onSuccess();

                router.push('/library');
            }

        } catch (error: any) {
            console.error("Topic generation error:", error);
            alert(`Error: ${error.message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <BottomSheet
            isOpen={isOpen}
            onClose={() => {
                onClose();
                setTimeout(() => {
                    setCreateType(null);
                    setSelectedFileName(null);
                }, 300);
            }}
            title={createType ? `Add ${createType === "youtube" ? "YouTube Video" : createType === "pdf" ? "PDF" : createType === "topic" ? "Search Topic" : "Text"}` : "Create Study Pack"}
        >
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf"
                className="hidden"
            />

            {!createType ? (
                <div className="space-y-3">
                    <p className="text-[var(--text-secondary)] mb-4">
                        Choose how you want to create your study materials:
                    </p>
                    <button
                        onClick={() => handleTypeSelect("topic")}
                        className="w-full glass-card p-4 flex items-center gap-4 hover:border-[var(--accent-cyan)] transition-colors border-2 border-[var(--accent-cyan)]/30"
                    >
                        <div className="w-12 h-12 rounded-xl bg-[var(--accent-cyan)]/20 flex items-center justify-center">
                            <Search className="text-[var(--accent-cyan)]" size={24} />
                        </div>
                        <div className="text-left">
                            <p className="font-semibold">Search Topic <span className="text-xs text-[var(--accent-cyan)]">(AI)</span></p>
                            <p className="text-sm text-[var(--text-muted)]">
                                Type any topic and AI generates notes
                            </p>
                        </div>
                    </button>
                    <button
                        onClick={() => handleTypeSelect("youtube")}
                        className="w-full glass-card p-4 flex items-center gap-4 hover:border-[var(--accent-cyan)] transition-colors"
                    >
                        <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                            <Youtube className="text-red-500" size={24} />
                        </div>
                        <div className="text-left">
                            <p className="font-semibold">YouTube Video</p>
                            <p className="text-sm text-[var(--text-muted)]">
                                Paste a video link to extract notes
                            </p>
                        </div>
                    </button>
                    <button
                        onClick={() => handleTypeSelect("pdf")}
                        className="w-full glass-card p-4 flex items-center gap-4 hover:border-[var(--accent-cyan)] transition-colors"
                    >
                        <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                            <FileText className="text-orange-500" size={24} />
                        </div>
                        <div className="text-left">
                            <p className="font-semibold">PDF File / Document</p>
                            <p className="text-sm text-[var(--text-muted)]">
                                Upload file or past paper
                            </p>
                        </div>
                    </button>
                    <button
                        onClick={() => handleTypeSelect("text")}
                        className="w-full glass-card p-4 flex items-center gap-4 hover:border-[var(--accent-cyan)] transition-colors"
                    >
                        <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                            <Type className="text-blue-500" size={24} />
                        </div>
                        <div className="text-left">
                            <p className="font-semibold">Paste Text</p>
                            <p className="text-sm text-[var(--text-muted)]">
                                WhatsApp notes or copied content
                            </p>
                        </div>
                    </button>
                </div>
            ) : createType === "topic" ? (
                <div className="space-y-4">
                    <Input
                        label="Search Topic"
                        placeholder="e.g., Photosynthesis, Quadratic Equations..."
                        value={topicQuery}
                        onChange={(e) => setTopicQuery(e.target.value)}
                        leftIcon={<Search size={18} />}
                    />
                    <p className="text-xs text-[var(--text-muted)]">
                        AI will generate study notes, flashcards, and quizzes tailored to your grade{profile?.grade ? ` (Grade ${profile.grade})` : ""}.
                    </p>
                    <Button
                        variant="primary"
                        fullWidth
                        disabled={!topicQuery.trim() || isGenerating}
                        isLoading={isGenerating}
                        onClick={handleTopicGenerate}
                        rightIcon={<Sparkles size={18} />}
                    >
                        {isGenerating ? "Generating..." : "Generate Study Pack"}
                    </Button>
                    <Button variant="ghost" fullWidth onClick={() => setCreateType(null)}>Back</Button>
                </div>
            ) : createType === "youtube" ? (
                <div className="space-y-4">
                    <Input
                        label="YouTube URL"
                        placeholder="https://youtube.com/watch?v=..."
                        value={youtubeUrl}
                        onChange={(e) => setYoutubeUrl(e.target.value)}
                        leftIcon={<Youtube size={18} />}
                    />
                    <Button
                        variant="primary"
                        fullWidth
                        disabled={!youtubeUrl || isGenerating}
                        isLoading={isGenerating}
                        onClick={handleGenerate}
                        rightIcon={<Sparkles size={18} />}
                    >
                        {isGenerating ? "Processing..." : "Generate Study Pack"}
                    </Button>
                    <Button variant="ghost" fullWidth onClick={() => setCreateType(null)}>Back</Button>
                </div>
            ) : createType === "pdf" ? (
                <div className="space-y-4">
                    {selectedFileName ? (
                        <div className="p-4 border-2 border-[var(--accent-cyan)] bg-[var(--accent-cyan)]/5 rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <FileText className="text-[var(--accent-cyan)] flex-shrink-0" size={24} />
                                <div className="overflow-hidden">
                                    <p className="text-sm font-medium truncate">{selectedFileName}</p>
                                    <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Ready to Generate</p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setSelectedFileName(null);
                                    setTextContent("");
                                }}
                                className="p-1 hover:bg-white/10 rounded-full text-white/50"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={handleFileSelect}
                            disabled={isExtracting}
                            className="w-full p-8 border-2 border-dashed border-[var(--accent-cyan)]/30 rounded-xl bg-[var(--accent-cyan)]/5 flex flex-col items-center justify-center text-center hover:bg-[var(--accent-cyan)]/10 transition-all group"
                        >
                            {isExtracting ? (
                                <Loader2 className="text-[var(--accent-cyan)] animate-spin mb-4" size={40} />
                            ) : (
                                <Upload className="text-[var(--accent-cyan)] mb-4 group-hover:scale-110 transition-transform" size={40} />
                            )}
                            <p className="text-sm font-bold">{isExtracting ? "Extracting Content..." : "Choose PDF from Device"}</p>
                            <p className="text-xs text-[var(--text-muted)] mt-2">Max 30 pages supported</p>
                        </button>
                    )}

                    <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-[var(--text-muted)]/20"></span>
                        </div>
                        <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
                            <span className="bg-[#0f172a] px-3 text-[var(--text-muted)]">or use URL / Paste</span>
                        </div>
                    </div>

                    <Input
                        placeholder="Paste PDF public URL..."
                        value={pdfUrl}
                        onChange={(e) => setPdfUrl(e.target.value)}
                        leftIcon={<FileText size={16} />}
                        className="text-xs"
                    />

                    <textarea
                        className="w-full h-24 glass-card p-3 rounded-xl text-xs outline-none focus:border-[var(--accent-cyan)]/50 transition-colors bg-white/5 resize-none"
                        placeholder="Alternatively, paste text from your PDF here..."
                        value={textContent}
                        onChange={(e) => setTextContent(e.target.value)}
                    />

                    <Button
                        variant="primary"
                        fullWidth
                        disabled={(!pdfUrl && !textContent.trim() && !selectedFileName) || isGenerating || isExtracting}
                        isLoading={isGenerating}
                        onClick={handleGenerate}
                        rightIcon={<Sparkles size={18} />}
                    >
                        {isGenerating ? "Analyzing Content..." : "Generate Study Pack"}
                    </Button>
                    <Button variant="ghost" fullWidth onClick={() => setCreateType(null)}>Back</Button>
                </div>
            ) : (
                <div className="space-y-4">
                    <textarea
                        className="w-full h-48 glass-card p-4 rounded-xl text-sm outline-none focus:border-[var(--accent-cyan)]/50 transition-colors bg-white/5"
                        placeholder="Paste your notes or study content here..."
                        value={textContent}
                        onChange={(e) => setTextContent(e.target.value)}
                    />
                    <Button
                        variant="primary"
                        fullWidth
                        disabled={!textContent || isGenerating}
                        isLoading={isGenerating}
                        onClick={handleGenerate}
                        rightIcon={<Sparkles size={18} />}
                    >
                        {isGenerating ? "Processing..." : "Generate Study Pack"}
                    </Button>
                    <Button variant="ghost" fullWidth onClick={() => setCreateType(null)}>Back</Button>
                </div>
            )}
        </BottomSheet>
    );
}
