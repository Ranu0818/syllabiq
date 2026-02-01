"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ChevronRight, Mail, Lock, User, ArrowLeft, LogIn } from "lucide-react";
import { Button, Card, Input } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { DataSaverToggle } from "@/components/layout/DataSaverToggle";

export default function LoginPage() {
    const router = useRouter();
    const { signInWithGoogle, signInEmail, signUpEmail, isAuthenticated, isLoading } = useAuth();

    const [mode, setMode] = useState<"login" | "signup">("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");

    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Redirect if already authenticated
    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            router.push("/");
        }
    }, [isAuthenticated, isLoading, router]);

    const handleGoogleSignIn = async () => {
        setIsProcessing(true);
        setError(null);
        const { error } = await signInWithGoogle();
        if (error) {
            setError(error.message);
            setIsProcessing(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);
        setError(null);

        try {
            let result;
            if (mode === "login") {
                result = await signInEmail(email, password);
            } else {
                if (!fullName) throw new Error("Please enter your full name.");
                result = await signUpEmail(email, password, fullName);
                if (!result.error) {
                    alert("Account created! Please check your email for verification if required, or sign in now.");
                    setMode("login");
                    setIsProcessing(false);
                    return;
                }
            }

            if (result.error) {
                setError(result.error.message);
            } else {
                router.push("/");
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-[var(--accent-cyan)] border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 relative bg-[var(--primary-bg)] overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--accent-cyan)] opacity-5 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[var(--secondary-gold)] opacity-5 blur-[120px] rounded-full" />

            <div className="absolute top-6 right-6">
                <DataSaverToggle />
            </div>

            {/* Logo & Branding */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-8 relative z-10"
            >
                <div className="relative inline-block mb-4">
                    <motion.div
                        className="w-16 h-16 rounded-2xl glass-card-accent flex items-center justify-center mx-auto"
                        animate={{ y: [0, -5, 0], rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <Sparkles size={32} className="text-[var(--accent-cyan)]" />
                    </motion.div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-[var(--accent-cyan)]/20 blur-2xl rounded-full -z-10" />
                </div>
                <h1 className="heading-1 neon-text mb-1 tracking-tight">SyllabiQ</h1>
                <p className="text-[var(--text-secondary)] text-sm font-medium">
                    Smart Study Companion for Sri Lanka
                </p>
            </motion.div>

            {/* Main Auth Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="w-full max-w-sm relative z-10"
            >
                <Card variant="static" padding="lg" className="border-[var(--glass-border)] shadow-2xl">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="heading-3">
                            {mode === "login" ? "Welcome Back" : "Create Account"}
                        </h2>
                        <button
                            onClick={() => setMode(mode === "login" ? "signup" : "login")}
                            className="text-xs font-bold text-[var(--accent-cyan)] hover:underline uppercase tracking-wider"
                        >
                            {mode === "login" ? "Sign Up" : "Log In"}
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <AnimatePresence mode="wait">
                            {mode === "signup" && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <Input
                                        label="Full Name"
                                        placeholder="Enter your name"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        leftIcon={<User size={18} />}
                                        required={mode === "signup"}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <Input
                            label="Email Address"
                            type="email"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            leftIcon={<Mail size={18} />}
                            required
                        />

                        <Input
                            label="Password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            leftIcon={<Lock size={18} />}
                            required
                        />

                        {error && (
                            <motion.p
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-red-500 text-[10px] font-bold uppercase tracking-wider bg-red-500/5 p-2 rounded-lg border border-red-500/10"
                            >
                                {error}
                            </motion.p>
                        )}

                        <Button
                            type="submit"
                            variant="primary"
                            fullWidth
                            isLoading={isProcessing}
                            rightIcon={mode === "login" ? <LogIn size={18} /> : <Sparkles size={18} />}
                        >
                            {mode === "login" ? "Sign In" : "Create Account"}
                        </Button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-4 my-6">
                        <div className="flex-1 h-px bg-[var(--glass-border)] opacity-30" />
                        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">or</span>
                        <div className="flex-1 h-px bg-[var(--glass-border)] opacity-30" />
                    </div>

                    {/* Google Sign In Button */}
                    <Button
                        variant="secondary"
                        fullWidth
                        onClick={handleGoogleSignIn}
                        disabled={isProcessing}
                        leftIcon={
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path
                                    fill="currentColor"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                            </svg>
                        }
                    >
                        Continue with Google
                    </Button>

                    <button
                        onClick={() => router.push("/")}
                        className="w-full text-center mt-4 text-[10px] font-bold text-[var(--text-secondary)] hover:text-[var(--accent-cyan)] transition-colors uppercase tracking-widest flex items-center justify-center gap-1"
                    >
                        <ArrowLeft size={10} />
                        Back to Guest Mode
                    </button>
                </Card>

                {/* Footer Links */}
                <div className="flex justify-center gap-4 mt-8 opacity-50">
                    <p className="text-[10px] font-bold uppercase tracking-widest">v1.0.0</p>
                    <div className="w-1 h-1 rounded-full bg-[var(--text-muted)] my-auto" />
                    <p className="text-[10px] font-bold uppercase tracking-widest">Lucid Edge</p>
                </div>
            </motion.div>
        </div>
    );
}
