"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, Sparkles, Loader2 } from "lucide-react";
import { AppShell } from "@/components/layout";
import { Card } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, where, getDocs, orderBy } from "firebase/firestore";
import { askStudyMateAction } from "@/app/actions/ai";
import { cleanupOldMessages } from "@/lib/cleanup";

interface ChatMessage {
    id?: string;
    role: 'user' | 'assistant';
    content: string;
    created_at: string;
}

export default function StudyMatePage() {
    const { user, profile } = useAuth();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Load chat history on mount
    useEffect(() => {
        const loadChat = async () => {
            if (!user) return;

            try {
                // Clean up old messages first
                await cleanupOldMessages(user.uid);

                // Fetch remaining messages
                const q = query(
                    collection(db, "chat_messages"),
                    where("user_id", "==", user.uid)
                );
                const snapshot = await getDocs(q);
                const loadedMessages = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as ChatMessage));

                // Sort in memory by created_at
                loadedMessages.sort((a, b) =>
                    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                );

                setMessages(loadedMessages);
            } catch (error) {
                console.error("Error loading chat:", error);
            } finally {
                setInitialLoading(false);
            }
        };

        loadChat();
    }, [user]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || !user || !profile) return;

        const userMessage: ChatMessage = {
            role: 'user',
            content: input.trim(),
            created_at: new Date().toISOString()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            // Save user message to Firestore
            await addDoc(collection(db, "chat_messages"), {
                user_id: user.uid,
                role: 'user',
                content: userMessage.content,
                created_at: userMessage.created_at,
                grade: profile.grade || "Unknown",
                stream: profile.stream || null
            });

            // Get AI response
            const conversationHistory = messages.map(m => ({
                role: m.role,
                content: m.content
            }));

            const aiResponse = await askStudyMateAction(
                userMessage.content,
                profile.grade || "10",
                profile.stream,
                conversationHistory
            );

            const assistantMessage: ChatMessage = {
                role: 'assistant',
                content: aiResponse,
                created_at: new Date().toISOString()
            };

            setMessages(prev => [...prev, assistantMessage]);

            // Save AI message to Firestore
            await addDoc(collection(db, "chat_messages"), {
                user_id: user.uid,
                role: 'assistant',
                content: assistantMessage.content,
                created_at: assistantMessage.created_at,
                grade: profile.grade || "Unknown",
                stream: profile.stream || null
            });

        } catch (error) {
            console.error("Error sending message:", error);
            const errorMessage: ChatMessage = {
                role: 'assistant',
                content: "Sorry, I encountered an error. Please try again! 🔄",
                created_at: new Date().toISOString()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (initialLoading) {
        return (
            <AppShell>
                <div className="container h-[80vh] flex items-center justify-center">
                    <Loader2 className="animate-spin text-[var(--accent-cyan)]" size={40} />
                </div>
            </AppShell>
        );
    }

    return (
        <AppShell>
            <div className="container py-6 h-[calc(100vh-120px)] flex flex-col">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 mb-6"
                >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--accent-cyan)] to-purple-500 flex items-center justify-center">
                        <MessageCircle className="text-white" size={24} />
                    </div>
                    <div>
                        <h1 className="heading-2">AI Study Mate 🤖</h1>
                        <p className="text-xs text-[var(--text-muted)]">
                            Grade {profile?.grade || '?'}{profile?.stream ? ` • ${profile.stream}` : ''} • Sri Lankan Curriculum
                        </p>
                    </div>
                </motion.div>

                {/* Chat Messages */}
                <Card className="flex-1 overflow-hidden flex flex-col mb-4">
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center px-4">
                                <Sparkles className="text-[var(--accent-cyan)] mb-4" size={48} />
                                <h3 className="heading-3 mb-2">Start Learning!</h3>
                                <p className="text-sm text-[var(--text-muted)] max-w-md">
                                    Ask me anything about your studies. I'm here to help with explanations,
                                    study tips, and exam prep tailored for Sri Lankan students! 📚
                                </p>
                            </div>
                        ) : (
                            <AnimatePresence>
                                {messages.map((msg, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === 'user'
                                                    ? 'bg-gradient-to-r from-[var(--accent-cyan)] to-purple-500 text-white'
                                                    : 'glass-card border border-[var(--glass-border)]'
                                                }`}
                                        >
                                            <p className="text-sm whitespace-pre-wrap break-words">
                                                {msg.content}
                                            </p>
                                            <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-white/70' : 'text-[var(--text-muted)]'
                                                }`}>
                                                {new Date(msg.created_at).toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        )}

                        {isLoading && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex justify-start"
                            >
                                <div className="glass-card border border-[var(--glass-border)] rounded-2xl px-4 py-3">
                                    <div className="flex gap-2">
                                        <div className="w-2 h-2 rounded-full bg-[var(--accent-cyan)] animate-bounce" />
                                        <div className="w-2 h-2 rounded-full bg-[var(--accent-cyan)] animate-bounce delay-100" />
                                        <div className="w-2 h-2 rounded-full bg-[var(--accent-cyan)] animate-bounce delay-200" />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="border-t border-[var(--glass-border)] p-4">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Ask me anything..."
                                maxLength={500}
                                disabled={isLoading}
                                className="flex-1 bg-[rgba(255,255,255,0.05)] border border-[var(--glass-border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-cyan)] transition-colors"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || isLoading}
                                className="px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--accent-cyan)] to-purple-500 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(0,212,255,0.3)] transition-all"
                            >
                                <Send size={20} />
                            </button>
                        </div>
                        <p className="text-xs text-[var(--text-muted)] mt-2">
                            💡 Tip: Messages auto-delete after 2 days
                        </p>
                    </div>
                </Card>
            </div>
        </AppShell>
    );
}
