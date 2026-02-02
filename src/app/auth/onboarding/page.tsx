"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, BookOpen, ChevronRight, ChevronLeft, Check } from "lucide-react";
import { Button } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { GRADE_LEVELS, STUDY_STREAMS } from "@/lib/utils";
import { DataSaverToggle } from "@/components/layout/DataSaverToggle";


type OnboardingStep = "grade" | "stream" | "complete";

export default function OnboardingPage() {
    const router = useRouter();
    const { updateProfile, refreshProfile } = useAuth();
    const [step, setStep] = useState<OnboardingStep>("grade");
    const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
    const [selectedStream, setSelectedStream] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Check if A/L grade (needs stream selection)
    const isALGrade = selectedGrade === "12" || selectedGrade === "13";

    const handleNext = () => {
        if (step === "grade") {
            if (isALGrade) {
                setStep("stream");
            } else {
                handleComplete();
            }
        } else if (step === "stream") {
            handleComplete();
        }
    };

    const handleBack = () => {
        if (step === "stream") {
            setStep("grade");
        }
    };

    const handleComplete = async () => {
        setIsLoading(true);

        const { error } = await updateProfile({
            grade: selectedGrade,
            stream: isALGrade ? selectedStream : null,
            onboarding_complete: true,
        });

        if (error) {
            console.error("Error saving profile:", error);
            setIsLoading(false);
            return;
        }

        await refreshProfile();
        setStep("complete");

        // Redirect after showing success
        setTimeout(() => {
            router.push("/");
        }, 2000);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 relative">
            <div className="absolute top-6 right-6">
                <DataSaverToggle />
            </div>

            <div className="w-full max-w-md">
                {/* Progress Indicator */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    {["grade", "stream", "complete"].map((s) => {
                        const isActive = step === s;
                        const isPast =
                            (s === "grade" && (step === "stream" || step === "complete")) ||
                            (s === "stream" && step === "complete");

                        // Hide stream step indicator if not A/L grade
                        if (s === "stream" && !isALGrade && step !== "stream") {
                            return null;
                        }

                        return (
                            <div
                                key={s}
                                className={`w-3 h-3 rounded-full transition-colors ${isActive
                                    ? "bg-[var(--accent-cyan)]"
                                    : isPast
                                        ? "bg-[var(--accent-cyan)]/50"
                                        : "bg-[var(--glass-border)]"
                                    }`}
                            />
                        );
                    })}
                </div>

                <AnimatePresence mode="wait">
                    {/* Grade Selection */}
                    {step === "grade" && (
                        <motion.div
                            key="grade"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 mx-auto rounded-2xl bg-[rgba(0,212,255,0.1)] flex items-center justify-center mb-4">
                                    <GraduationCap className="text-[var(--accent-cyan)]" size={32} />
                                </div>
                                <h1 className="heading-2 mb-2">What grade are you in?</h1>
                                <p className="text-[var(--text-muted)] text-sm">
                                    We&apos;ll personalize content for your level
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-6">
                                {GRADE_LEVELS.map((grade) => (
                                    <button
                                        key={grade.value}
                                        onClick={() => setSelectedGrade(grade.value)}
                                        className={`p-4 rounded-xl text-center transition-all ${selectedGrade === grade.value
                                            ? "bg-[var(--accent-cyan)] text-[var(--primary-bg)] font-semibold"
                                            : "glass-card hover:border-[var(--accent-cyan)]"
                                            }`}
                                    >
                                        {grade.label}
                                    </button>
                                ))}
                            </div>

                            <Button
                                variant="primary"
                                fullWidth
                                disabled={!selectedGrade}
                                onClick={handleNext}
                                rightIcon={<ChevronRight size={20} />}
                            >
                                Continue
                            </Button>
                        </motion.div>
                    )}

                    {/* Stream Selection (A/L only) */}
                    {step === "stream" && (
                        <motion.div
                            key="stream"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 mx-auto rounded-2xl bg-[rgba(255,215,0,0.1)] flex items-center justify-center mb-4">
                                    <BookOpen className="text-[var(--secondary-gold)]" size={32} />
                                </div>
                                <h1 className="heading-2 mb-2">What&apos;s your stream?</h1>
                                <p className="text-[var(--text-muted)] text-sm">
                                    Select your A/L subject stream
                                </p>
                            </div>

                            <div className="space-y-3 mb-6">
                                {STUDY_STREAMS.map((stream) => (
                                    <button
                                        key={stream.value}
                                        onClick={() => setSelectedStream(stream.value)}
                                        className={`w-full p-4 rounded-xl text-left transition-all flex items-center justify-between ${selectedStream === stream.value
                                            ? "bg-[var(--secondary-gold)] text-[var(--primary-bg)] font-semibold"
                                            : "glass-card hover:border-[var(--secondary-gold)]"
                                            }`}
                                    >
                                        {stream.label}
                                        {selectedStream === stream.value && <Check size={20} />}
                                    </button>
                                ))}
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    variant="ghost"
                                    onClick={handleBack}
                                    leftIcon={<ChevronLeft size={20} />}
                                >
                                    Back
                                </Button>
                                <Button
                                    variant="primary"
                                    fullWidth
                                    disabled={!selectedStream}
                                    isLoading={isLoading}
                                    onClick={handleNext}
                                    rightIcon={<ChevronRight size={20} />}
                                >
                                    Complete
                                </Button>
                            </div>
                        </motion.div>
                    )}

                    {/* Complete */}
                    {step === "complete" && (
                        <motion.div
                            key="complete"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: "spring" }}
                                className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center mb-6"
                            >
                                <Check className="text-emerald-500" size={40} />
                            </motion.div>
                            <h1 className="heading-2 mb-2">You&apos;re all set!</h1>
                            <p className="text-[var(--text-muted)]">
                                Redirecting to your dashboard...
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
