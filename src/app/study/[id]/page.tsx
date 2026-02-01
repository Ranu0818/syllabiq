"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    BookOpen,
    Layers,
    CheckSquare,
    ChevronLeft,
    ChevronRight,
    Star,
    RefreshCw,
    CheckCircle2,
    XCircle,
    MessageCircle,
    Send,
    Sparkles
} from "lucide-react";
import { AppShell } from "@/components/layout";
import { Card, Button, LoadingSpinner } from "@/components/ui";
import { supabase, StudyPack } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { askFollowUpAction } from "@/app/actions/ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Tab = "notes" | "flashcards" | "quiz";

export default function StudyPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { user, isAuthenticated } = useAuth();

    const [pack, setPack] = useState<StudyPack | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<Tab>("notes");

    // Flashcard State
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    // Quiz State
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [score, setScore] = useState(0);
    const [quizComplete, setQuizComplete] = useState(false);

    // Q&A Chat State
    const [chatMessages, setChatMessages] = useState<{ role: "user" | "ai"; content: string }[]>([]);
    const [chatInput, setChatInput] = useState("");
    const [isAskingAI, setIsAskingAI] = useState(false);

    const handleAskQuestion = async (question: string) => {
        if (!question.trim() || isAskingAI || !pack) return;
        setChatInput("");
        setChatMessages(prev => [...prev, { role: "user", content: question }]);
        setIsAskingAI(true);
        try {
            const answer = await askFollowUpAction(question, pack.title, pack.grade);
            setChatMessages(prev => [...prev, { role: "ai", content: answer }]);
        } catch (error) {
            setChatMessages(prev => [...prev, { role: "ai", content: "Sorry, I couldn't answer that. Please try again." }]);
        } finally {
            setIsAskingAI(false);
        }
    };

    useEffect(() => {
        const fetchPack = async () => {
            try {
                const { data, error } = await supabase
                    .from("study_packs")
                    .select("*")
                    .eq("id", id)
                    .single();

                if (error) throw error;
                setPack(data);
            } catch (err) {
                console.error("Error fetching pack:", err);
            } finally {
                setIsLoading(false);
            }
        };

        if (id) fetchPack();
    }, [id]);

    // Keyboard Navigation for Flashcards
    useEffect(() => {
        if (!pack || activeTab !== "flashcards") return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "ArrowRight") {
                if (currentCardIndex < pack.flashcards.length - 1) {
                    setIsFlipped(false);
                    setCurrentCardIndex(prev => prev + 1);
                }
            } else if (e.key === "ArrowLeft") {
                if (currentCardIndex > 0) {
                    setIsFlipped(false);
                    setCurrentCardIndex(prev => prev - 1);
                }
            } else if (e.key === " " || e.key === "Enter") {
                e.preventDefault(); // Prevent scrolling
                setIsFlipped(prev => !prev);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [pack, activeTab, currentCardIndex]);

    if (isLoading) {
        return (
            <AppShell>
                <div className="min-h-screen flex items-center justify-center">
                    <LoadingSpinner size="lg" />
                </div>
            </AppShell>
        );
    }

    if (!pack) {
        return (
            <AppShell>
                <div className="container py-12 text-center">
                    <h2 className="heading-2 mb-4">Study Pack Not Found</h2>
                    <Button onClick={() => router.push("/library")}>
                        Back to Library
                    </Button>
                </div>
            </AppShell>
        );
    }

    return (
        <AppShell showNav={false}>
            {/* Sticky Header */}
            <div className="sticky top-0 z-30 glass-card rounded-none border-x-0 border-t-0 p-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 -ml-2 rounded-full hover:bg-[var(--glass-bg)]"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div className="min-w-0">
                        <h1 className="font-semibold truncate">{pack.title}</h1>
                        <p className="text-xs text-[var(--text-muted)]">{pack.subject}</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mt-4 p-1 bg-[var(--glass-bg)] rounded-xl">
                    {(["notes", "flashcards", "quiz"] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${activeTab === tab
                                ? "bg-[var(--accent-cyan)] text-[var(--primary-bg)] shadow-lg"
                                : "text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.05)]"
                                }`}
                        >
                            {tab === "notes" && <BookOpen size={16} />}
                            {tab === "flashcards" && <Layers size={16} />}
                            {tab === "quiz" && <CheckSquare size={16} />}
                            <span className="capitalize">{tab}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="container py-6 pb-24">
                <AnimatePresence mode="wait">
                    {activeTab === "notes" && (
                        <motion.div
                            key="notes"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="prose prose-invert max-w-none"
                        >
                            <Card className="min-h-[60vh] p-6 leading-relaxed">
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        h1: ({ node, ...props }) => <h1 className="heading-2 mb-4 mt-6 text-[var(--accent-cyan)] uppercase tracking-tight" {...props} />,
                                        h2: ({ node, ...props }) => <h2 className="heading-3 mb-3 mt-8 border-b border-[var(--glass-border)] pb-2 text-white" {...props} />,
                                        h3: ({ node, ...props }) => <h3 className="heading-3 mb-2 mt-6 text-[var(--text-primary)]" {...props} />,
                                        p: ({ node, ...props }) => <p className="mb-4 text-[var(--text-secondary)] leading-7 text-justify" {...props} />,
                                        ul: ({ node, ...props }) => <ul className="mb-4 list-disc pl-6 space-y-2 text-[var(--text-secondary)]" {...props} />,
                                        ol: ({ node, ...props }) => <ol className="mb-4 list-decimal pl-6 space-y-2 text-[var(--text-secondary)]" {...props} />,
                                        li: ({ node, ...props }) => <li className="pl-1 marker:text-[var(--accent-cyan)]" {...props} />,
                                        blockquote: ({ node, ...props }) => (
                                            <blockquote className="border-l-4 border-[var(--accent-cyan)] pl-4 my-6 bg-[rgba(0,212,255,0.05)] py-3 rounded-r-lg italic text-[var(--text-secondary)] shadow-sm" {...props} />
                                        ),
                                        strong: ({ node, ...props }) => <strong className="font-bold text-[var(--text-primary)]" {...props} />,
                                        table: ({ node, ...props }) => <div className="overflow-x-auto my-6 rounded-lg border border-[var(--glass-border)]"><table className="w-full text-sm text-left" {...props} /></div>,
                                        thead: ({ node, ...props }) => <thead className="bg-[var(--glass-bg)] text-[var(--text-primary)] uppercase font-bold" {...props} />,
                                        th: ({ node, ...props }) => <th className="px-6 py-3 border-b border-[var(--glass-border)]" {...props} />,
                                        td: ({ node, ...props }) => <td className="px-6 py-4 border-b border-[var(--glass-border)] text-[var(--text-secondary)]" {...props} />,
                                        code: ({ node, ...props }) => <code className="bg-[rgba(255,255,255,0.1)] rounded px-1.5 py-0.5 font-mono text-sm text-[var(--accent-cyan)]" {...props} />,
                                    }}
                                >
                                    {pack.notes}
                                </ReactMarkdown>
                            </Card>

                            {/* Q&A Chat Section */}
                            <Card className="mt-6 p-4">
                                <div className="flex items-center gap-2 mb-4">
                                    <MessageCircle className="text-[var(--accent-cyan)]" size={20} />
                                    <h3 className="font-bold">Ask Follow-up Questions</h3>
                                </div>

                                {/* Suggested Questions */}
                                {(pack as any).suggestedQuestions && (pack as any).suggestedQuestions.length > 0 && (
                                    <div className="mb-4">
                                        <p className="text-xs text-[var(--text-muted)] mb-2 flex items-center gap-1">
                                            <Sparkles size={12} /> Suggested:
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {(pack as any).suggestedQuestions.slice(0, 3).map((q: string, i: number) => (
                                                <button
                                                    key={i}
                                                    onClick={() => handleAskQuestion(q)}
                                                    className="text-xs px-3 py-1.5 rounded-full bg-[var(--glass-bg)] border border-[var(--glass-border)] hover:border-[var(--accent-cyan)]/40 transition-all"
                                                >
                                                    {q}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Chat Messages */}
                                {chatMessages.length > 0 && (
                                    <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                                        {chatMessages.map((msg, i) => (
                                            <div
                                                key={i}
                                                className={`p-3 rounded-xl text-sm ${msg.role === "user"
                                                    ? "bg-[var(--accent-cyan)]/10 ml-8"
                                                    : "bg-[var(--glass-bg)] mr-8"
                                                    }`}
                                            >
                                                <p className="text-xs font-bold mb-1 text-[var(--text-muted)]">
                                                    {msg.role === "user" ? "You" : "AI Tutor"}
                                                </p>
                                                {msg.content}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Chat Input */}
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Ask anything about this topic..."
                                        className="flex-1 px-4 py-2 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl text-sm focus:outline-none focus:border-[var(--accent-cyan)]/50"
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleAskQuestion(chatInput)}
                                        disabled={isAskingAI}
                                    />
                                    <Button
                                        size="sm"
                                        onClick={() => handleAskQuestion(chatInput)}
                                        disabled={!chatInput.trim() || isAskingAI}
                                    >
                                        {isAskingAI ? <LoadingSpinner size="sm" /> : <Send size={16} />}
                                    </Button>
                                </div>
                            </Card>
                        </motion.div>
                    )}

                    {activeTab === "flashcards" && (
                        <motion.div
                            key="flashcards"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="space-y-6"
                        >
                            {/* Progress bar */}
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs text-[var(--text-muted)]">
                                    Card {currentCardIndex + 1} of {pack.flashcards.length}
                                </span>
                                <div className="w-2/3 h-1 bg-[var(--glass-bg)] rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-[var(--accent-cyan)] transition-all duration-300"
                                        style={{ width: `${((currentCardIndex + 1) / pack.flashcards.length) * 100}%` }}
                                    />
                                </div>
                            </div>

                            {/* Card Flip Container */}
                            <div className="relative w-full max-w-3xl mx-auto aspect-[4/5] md:aspect-[3/2] perspective-1000 cursor-pointer group">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={currentCardIndex}
                                        initial={{ opacity: 0, x: 50 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -50 }}
                                        transition={{ duration: 0.2, ease: "easeInOut" }}
                                        className="w-full h-full relative"
                                        onClick={() => setIsFlipped(!isFlipped)}
                                    >
                                        <motion.div
                                            className="w-full h-full preserve-3d transition-transform duration-500"
                                            animate={{ rotateY: isFlipped ? 180 : 0 }}
                                            transition={{ type: "spring", stiffness: 260, damping: 20 }}
                                        >
                                            {/* Front */}
                                            <Card className="absolute inset-0 backface-hidden flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-[var(--glass-bg)] to-[rgba(0,212,255,0.05)] border-[var(--accent-cyan)]/30">
                                                <div className="mb-4 p-3 rounded-full bg-[rgba(0,212,255,0.1)]">
                                                    <Star className="text-[var(--accent-cyan)]" size={24} />
                                                </div>
                                                <h3 className="heading-3 text-white">
                                                    {pack.flashcards[currentCardIndex].question}
                                                </h3>
                                                <p className="mt-8 text-xs text-[var(--accent-cyan)] animate-pulse uppercase tracking-widest font-bold">
                                                    Tap or Press Space to Reveal
                                                </p>
                                            </Card>

                                            {/* Back */}
                                            <Card className="absolute inset-0 backface-hidden rotate-y-180 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-[var(--glass-bg)] to-[rgba(255,215,0,0.05)] border-[var(--secondary-gold)]/30">
                                                <p className="text-sm text-[var(--secondary-gold)] uppercase tracking-widest font-bold mb-4">Answer</p>
                                                <h3 className="heading-3 text-white">
                                                    {pack.flashcards[currentCardIndex].answer}
                                                </h3>
                                                <p className="mt-8 text-xs text-[var(--text-muted)]">Tap to flip back</p>
                                            </Card>
                                        </motion.div>
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                            {/* Force Re-render */}

                            {/* Navigation */}
                            <div className="flex gap-4">
                                <Button
                                    variant="secondary"
                                    fullWidth
                                    disabled={currentCardIndex === 0}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsFlipped(false);
                                        setCurrentCardIndex(prev => prev - 1);
                                    }}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="primary"
                                    fullWidth
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (currentCardIndex < pack.flashcards.length - 1) {
                                            setIsFlipped(false);
                                            setCurrentCardIndex(prev => prev + 1);
                                        } else {
                                            setCurrentCardIndex(0);
                                            setIsFlipped(false);
                                        }
                                    }}
                                >
                                    {currentCardIndex < pack.flashcards.length - 1 ? "Next Card" : "Finish Set"}
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === "quiz" && (
                        <motion.div
                            key="quiz"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            {!quizComplete ? (
                                <Card className="p-6">
                                    <div className="flex justify-between items-center mb-6">
                                        <span className="text-xs font-bold text-[var(--accent-cyan)] uppercase tracking-wider">
                                            Question {currentQuestionIndex + 1} of {pack.quizzes.length}
                                        </span>
                                        <span className="text-xs text-[var(--text-muted)]">Score: {score}</span>
                                    </div>

                                    <h3 className="heading-3 mb-8">
                                        {pack.quizzes[currentQuestionIndex].question}
                                    </h3>

                                    <div className="space-y-3">
                                        {pack.quizzes[currentQuestionIndex].options.map((option, idx) => {
                                            const isCorrect = idx === pack.quizzes[currentQuestionIndex].correct_index;
                                            const isSelected = selectedOption === idx;

                                            let borderClass = "border-[var(--glass-border)]";
                                            let bgClass = "bg-[rgba(255,255,255,0.03)]";

                                            if (isAnswered) {
                                                if (isCorrect) {
                                                    borderClass = "border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]";
                                                    bgClass = "bg-emerald-500/10";
                                                } else if (isSelected) {
                                                    borderClass = "border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]";
                                                    bgClass = "bg-red-500/10";
                                                }
                                            } else if (isSelected) {
                                                borderClass = "border-[var(--accent-cyan)]";
                                                bgClass = "bg-[rgba(0,212,255,0.05)]";
                                            }

                                            return (
                                                <button
                                                    key={idx}
                                                    disabled={isAnswered}
                                                    onClick={() => setSelectedOption(idx)}
                                                    className={`w-full p-4 rounded-xl border text-left transition-all relative overflow-hidden ${borderClass} ${bgClass}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? "border-[var(--accent-cyan)] bg-[var(--accent-cyan)] text-[var(--primary-bg)]" : "border-[var(--glass-border)]"
                                                            }`}>
                                                            {String.fromCharCode(65 + idx)}
                                                        </div>
                                                        <span className="text-sm font-medium">{option}</span>
                                                    </div>

                                                    {isAnswered && isCorrect && (
                                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500">
                                                            <CheckCircle2 size={18} />
                                                        </div>
                                                    )}
                                                    {isAnswered && isSelected && !isCorrect && (
                                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500">
                                                            <XCircle size={18} />
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <div className="mt-8">
                                        {!isAnswered ? (
                                            <Button
                                                variant="primary"
                                                fullWidth
                                                disabled={selectedOption === null}
                                                onClick={() => {
                                                    setIsAnswered(true);
                                                    if (selectedOption === pack.quizzes[currentQuestionIndex].correct_index) {
                                                        setScore(prev => prev + 1);
                                                    }
                                                }}
                                            >
                                                Check Answer
                                            </Button>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="p-4 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[var(--glass-border)]">
                                                    <p className="text-xs font-bold text-[var(--accent-cyan)] uppercase mb-2">Explanation</p>
                                                    <p className="text-sm text-[var(--text-secondary)]">
                                                        {pack.quizzes[currentQuestionIndex].explanation}
                                                    </p>
                                                </div>
                                                <Button
                                                    variant="primary"
                                                    fullWidth
                                                    onClick={() => {
                                                        if (currentQuestionIndex < pack.quizzes.length - 1) {
                                                            setCurrentQuestionIndex(prev => prev + 1);
                                                            setSelectedOption(null);
                                                            setIsAnswered(false);
                                                        } else {
                                                            setQuizComplete(true);
                                                        }
                                                    }}
                                                >
                                                    {currentQuestionIndex < pack.quizzes.length - 1 ? "Next Question" : "See Results"}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            ) : (
                                <Card className="p-8 text-center">
                                    <div className="w-20 h-20 mx-auto rounded-full bg-[rgba(0,212,255,0.1)] flex items-center justify-center mb-6">
                                        <CheckSquare className="text-[var(--accent-cyan)]" size={40} />
                                    </div>
                                    <h2 className="heading-2 mb-2">Quiz Complete!</h2>
                                    <p className="text-[var(--text-muted)] mb-8">
                                        You scored {score} out of {pack.quizzes.length}
                                    </p>

                                    <div className="flex gap-4">
                                        <Button
                                            variant="secondary"
                                            fullWidth
                                            leftIcon={<RefreshCw size={18} />}
                                            onClick={() => {
                                                setCurrentQuestionIndex(0);
                                                setSelectedOption(null);
                                                setIsAnswered(false);
                                                setScore(0);
                                                setQuizComplete(false);
                                            }}
                                        >
                                            Retry
                                        </Button>
                                        <Button
                                            variant="primary"
                                            fullWidth
                                            onClick={() => setActiveTab("notes")}
                                        >
                                            Back to Notes
                                        </Button>
                                    </div>
                                </Card>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </AppShell>
    );
}
