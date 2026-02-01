"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Sparkles,
    Youtube,
    FileText,
    Type,
    Upload,
    Search
} from "lucide-react";
import { Button, Input } from "@/components/ui";
import { BottomSheet } from "@/components/ui/Modal";
import { useAuth } from "@/contexts/AuthContext";
import { useCreation } from "@/contexts/CreationContext";
import { generateId } from "@/lib/utils";
import { generateStudyPackAction, generateFromTopicAction } from "@/app/actions/ai";
import { supabase } from "@/lib/supabase";

interface StudyPackCreatorProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function StudyPackCreator({ isOpen, onClose, onSuccess }: StudyPackCreatorProps) {
    const router = useRouter();
    const { user, profile, isAuthenticated } = useAuth();

    const [createType, setCreateType] = useState<"youtube" | "pdf" | "text" | "topic" | null>(null);
    const [youtubeUrl, setYoutubeUrl] = useState("");
    const [textContent, setTextContent] = useState("");
    const [topicQuery, setTopicQuery] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);

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

    const handleGenerate = async () => {
        if (!isAuthenticated || !profile) {
            alert("Please sign in to generate study packs.");
            return;
        }
        if (createType === "topic") return; // Topic uses separate handler

        setIsGenerating(true);
        try {
            const content = createType === "youtube" ? youtubeUrl : textContent;
            if (!content) return;

            const generated = await generateStudyPackAction(
                content,
                createType || "text",
                profile.grade || "10",
                profile.stream
            );

            // Save to Supabase (with fallback)
            let payload: any = {
                user_id: user?.id,
                title: generated.title,
                subject: generated.subject,
                grade: profile.grade,
                content_type: createType || "text",
                source_url: createType === "youtube" ? youtubeUrl : null,
                notes: generated.notes,
                flashcards: generated.flashcards.map(f => ({ ...f, id: generateId(), mastered: false })),
                quizzes: generated.quizzes.map(q => ({ ...q, id: generateId() })),
                is_offline: false,
                suggested_questions: generated.suggestedQuestions,
            };

            let { data, error } = await supabase.from("study_packs").insert(payload).select().single();

            if (error && error.message?.includes("suggested_questions")) {
                delete payload.suggested_questions;
                const retry = await supabase.from("study_packs").insert(payload).select().single();
                data = retry.data;
                error = retry.error;
            }

            if (error) throw error;

            setYoutubeUrl("");
            setTextContent("");
            setCreateType(null);
            onClose();

            if (onSuccess) onSuccess();

            // Navigate to the new study pack
            router.push(`/study/${data.id}`);

        } catch (error: any) {
            console.error("Generation error:", error);
            alert(`Error: ${error.message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleTopicGenerate = async () => {
        if (!isAuthenticated || !profile) {
            alert("Please sign in to generate study packs.");
            return;
        }
        if (!topicQuery.trim()) {
            alert("Please enter a topic to search.");
            return;
        }

        setIsGenerating(true);
        try {
            const generated = await generateFromTopicAction(
                topicQuery.trim(),
                profile.grade || "10",
                profile.stream
            );

            // Save to Supabase (with fallback)
            let payload: any = {
                user_id: user?.id,
                title: generated.title,
                subject: generated.subject,
                grade: profile.grade,
                content_type: "text",
                source_url: null,
                notes: generated.notes,
                flashcards: generated.flashcards.map(f => ({ ...f, id: generateId(), mastered: false })),
                quizzes: generated.quizzes.map(q => ({ ...q, id: generateId() })),
                is_offline: false,
                suggested_questions: generated.suggestedQuestions,
            };

            let { data, error } = await supabase.from("study_packs").insert(payload).select().single();

            if (error && error.message?.includes("suggested_questions")) {
                delete payload.suggested_questions;
                const retry = await supabase.from("study_packs").insert(payload).select().single();
                data = retry.data;
                error = retry.error;
            }

            if (error) throw error;

            setTopicQuery("");
            setCreateType(null);
            onClose();

            if (onSuccess) onSuccess();

            router.push(`/study/${data.id}`);

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
                setTimeout(() => setCreateType(null), 300);
            }}
            title={createType ? `Add ${createType === "youtube" ? "YouTube Video" : createType === "pdf" ? "PDF" : createType === "topic" ? "Search Topic" : "Text"}` : "Create Study Pack"}
        >
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
                            <p className="font-semibold">Upload PDF</p>
                            <p className="text-sm text-[var(--text-muted)]">
                                Use text from past papers or textbooks
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
                        placeholder="e.g., Photosynthesis, Quadratic Equations, French Revolution"
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
                    <Button
                        variant="ghost"
                        fullWidth
                        onClick={() => setCreateType(null)}
                    >
                        Back
                    </Button>
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
                    <Button
                        variant="ghost"
                        fullWidth
                        onClick={() => setCreateType(null)}
                    >
                        Back
                    </Button>
                </div>
            ) : createType === "pdf" ? (
                <div className="space-y-4">
                    <div className="p-4 border-2 border-dashed border-[var(--accent-cyan)]/20 rounded-xl bg-[var(--accent-cyan)]/5 flex flex-col items-center justify-center text-center">
                        <FileText className="text-[var(--accent-cyan)] mb-2" size={32} />
                        <p className="text-sm font-medium">Extracting text from PDFs...</p>
                        <p className="text-xs text-[var(--text-muted)] mt-1">Paste the key text from your PDF below for high-quality notes</p>
                    </div>
                    <textarea
                        className="w-full h-32 glass-card p-4 rounded-xl text-sm outline-none focus:border-[var(--accent-cyan)]/50 transition-colors bg-white/5"
                        placeholder="Paste PDF text content here..."
                        value={topicQuery}
                        onChange={(e) => setTopicQuery(e.target.value)}
                    />
                    <Button
                        variant="primary"
                        fullWidth
                        disabled={!topicQuery.trim() || isGenerating}
                        isLoading={isGenerating}
                        onClick={handleTopicGenerate}
                        rightIcon={<Sparkles size={18} />}
                    >
                        {isGenerating ? "Analyzing..." : "Generate from PDF"}
                    </Button>
                    <Button
                        variant="ghost"
                        fullWidth
                        onClick={() => setCreateType(null)}
                    >
                        Back
                    </Button>
                </div>
            ) : (
                <div className="space-y-4">
                    <textarea
                        className="input min-h-[150px]"
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
                    <Button
                        variant="ghost"
                        fullWidth
                        onClick={() => setCreateType(null)}
                    >
                        Back
                    </Button>
                </div>
            )}
        </BottomSheet>
    );
}
