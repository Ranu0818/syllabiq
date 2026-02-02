"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import {
    User,
    LogOut,
    ChevronRight,
    GraduationCap,
    Moon,
    Bell,
    HelpCircle,
    Edit2,
    Languages,
} from "lucide-react";
import { AppShell } from "@/components/layout";
import { Card, Button } from "@/components/ui";
import { Modal } from "@/components/ui/Modal";
import { useDataSaver } from "@/contexts/DataSaverContext";
import { useAuth } from "@/contexts/AuthContext";
import { GRADE_LEVELS, STUDY_STREAMS } from "@/lib/utils";
import { collection, query, where, deleteDoc, getDocs, getCountFromServer } from "firebase/firestore";
import { db } from "@/lib/firebase";

const menuItems = [
    { icon: Bell, label: "Notifications", value: "" },
    { icon: HelpCircle, label: "Help & Support", value: "" },
];

export default function ProfilePage() {
    const router = useRouter();
    const { isDataSaver, toggleDataSaver } = useDataSaver();
    const { user, profile, isAuthenticated, isLoading, signOut, updateProfile } = useAuth();
    const [showEditModal, setShowEditModal] = useState(false);
    const [editGrade, setEditGrade] = useState(profile?.grade || "");
    const [editStream, setEditStream] = useState(profile?.stream || "");
    const [editUsername, setEditUsername] = useState(profile?.username || "");
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [confirmDeleteText, setConfirmDeleteText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isSigningOut, setIsSigningOut] = useState(false);
    const [packCount, setPackCount] = useState<number | null>(null);
    const [showComingSoon, setShowComingSoon] = useState<{ open: boolean, title: string, message: string }>({
        open: false,
        title: "",
        message: ""
    });

    const handleDeleteAllData = async () => {
        if (confirmDeleteText.toUpperCase() !== "DELETE") return;

        setIsDeleting(true);
        try {
            if (!user) throw new Error("No user logged in");

            // Delete study packs from Firebase
            const q = query(collection(db, "study_packs"), where("user_id", "==", user.uid));
            const querySnapshot = await getDocs(q);
            const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
            await Promise.all(deletePromises);

            // Reset profile stats and settings
            const { error: updateError } = await updateProfile({
                streak: 0,
                xp: 0,
                data_saved_mb: 0,
                grade: null,
                stream: null,
                username: null,
                onboarding_complete: false
            });

            if (updateError) throw updateError;

            setPackCount(0);
            setShowDeleteModal(false);
            setConfirmDeleteText("");
            alert("Success: All study data and stats have been cleared.");
        } catch (err) {
            console.error("Critical error clearing data:", err);
            alert("Failed to clear data completely. Some data may still remain. Please check your connection.");
        } finally {
            setIsDeleting(false);
        }
    };

    useEffect(() => {
        const fetchStats = async () => {
            if (!user) return;
            try {
                const q = query(collection(db, "study_packs"), where("user_id", "==", user.uid));
                const snapshot = await getCountFromServer(q);
                setPackCount(snapshot.data().count);
            } catch (err) {
                console.error("Error fetching pack count:", err);
            }
        };

        if (isAuthenticated) {
            fetchStats();
        }
    }, [user, isAuthenticated]);

    const handleSignOut = async () => {
        setIsSigningOut(true);
        try {
            await signOut();
            router.replace("/auth/login");
        } catch (err) {
            console.error("Sign out error:", err);
            // Force redirect even if signOut hits an error
            window.location.href = "/auth/login";
        } finally {
            setIsSigningOut(false);
        }
    };

    const handleSaveProfile = async () => {
        setIsSaving(true);
        const { error } = await updateProfile({
            grade: editGrade,
            stream: editStream,
            username: editUsername,
        });

        setIsSaving(false);

        if (error) {
            console.error("Error saving profile:", error);
            alert(`Failed to save profile: ${error.message}`);
        } else {
            setShowEditModal(false);
        }
    };

    const isALGrade = editGrade === "12" || editGrade === "13";

    if (isLoading) {
        return (
            <AppShell>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin w-8 h-8 border-2 border-[var(--accent-cyan)] border-t-transparent rounded-full" />
                </div>
            </AppShell>
        );
    }

    return (
        <AppShell>
            <div className="container py-6">
                {/* Profile Header */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <div className="w-24 h-24 mx-auto rounded-full bg-[var(--glass-bg)] border-2 border-[var(--accent-cyan)] flex items-center justify-center mb-4 overflow-hidden">
                        {profile?.avatar_url ? (
                            <Image
                                src={profile.avatar_url}
                                alt={profile.full_name || "User"}
                                width={96}
                                height={96}
                                className="w-full h-full object-cover"
                                unoptimized
                            />
                        ) : (
                            <User size={40} className="text-[var(--accent-cyan)]" />
                        )}
                    </div>
                    <h1 className="heading-2 mb-1">
                        {profile?.full_name || user?.email?.split("@")[0] || "Guest User"}
                    </h1>
                    <p className="text-sm text-[var(--text-muted)]">
                        {user?.email || "Not signed in"}
                    </p>

                    {/* Grade & Stream Badges */}
                    {profile && (
                        <div className="flex items-center justify-center gap-2 mt-3">
                            {profile.grade && (
                                <span className="px-3 py-1 rounded-full bg-[rgba(0,212,255,0.1)] text-[var(--accent-cyan)] text-xs font-medium">
                                    Grade {profile.grade}
                                </span>
                            )}
                            {profile.stream && (
                                <span className="px-3 py-1 rounded-full bg-[rgba(255,215,0,0.1)] text-[var(--secondary-gold)] text-xs font-medium">
                                    {STUDY_STREAMS.find((s) => s.value === profile.stream)?.label || profile.stream}
                                </span>
                            )}
                            <button
                                onClick={() => {
                                    setEditGrade(profile.grade || "");
                                    setEditStream(profile.stream || "");
                                    setShowEditModal(true);
                                }}
                                className="p-1 rounded-lg hover:bg-[var(--glass-bg)] transition-colors"
                            >
                                <Edit2 size={14} className="text-[var(--text-muted)]" />
                            </button>
                        </div>
                    )}
                </motion.div>

                {/* Quick Stats */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-2 gap-3 mb-6"
                >
                    <Card className="text-center" padding="sm">
                        <p className="heading-3 neon-text">{packCount ?? 0}</p>
                        <p className="text-xs text-[var(--text-muted)]">Study Packs</p>
                    </Card>
                    <Card className="text-center" padding="sm">
                        <p className="heading-3 text-[var(--secondary-gold)]">0</p>
                        <p className="text-xs text-[var(--text-muted)]">Quiz Streak</p>
                    </Card>
                </motion.div>

                {/* Grade & Stream Setting */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="mb-4"
                >
                    <Card
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => {
                            setEditGrade(profile?.grade || "");
                            setEditStream(profile?.stream || "");
                            setEditUsername(profile?.username || "");
                            setShowEditModal(true);
                        }}
                    >
                        <div className="flex items-center gap-3">
                            <GraduationCap size={20} className="text-[var(--accent-cyan)]" />
                            <div>
                                <p className="font-medium">Grade & Stream</p>
                                <p className="text-xs text-[var(--text-muted)]">
                                    {profile?.grade
                                        ? `Grade ${profile.grade}${profile.stream ? " • " + profile.stream : ""}`
                                        : "Not set"}
                                </p>
                            </div>
                        </div>
                        <ChevronRight size={18} className="text-[var(--text-muted)]" />
                    </Card>
                </motion.div>

                {/* Data Saver Toggle */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mb-4"
                >
                    <Card className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Moon size={20} className="text-[var(--accent-cyan)]" />
                            <div>
                                <p className="font-medium">Data Saver Mode</p>
                                <p className="text-xs text-[var(--text-muted)]">
                                    Reduce animations & effects
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={toggleDataSaver}
                            className={`w-11 h-6 rounded-full transition-all duration-300 flex items-center px-1 ${isDataSaver
                                ? "bg-[var(--accent-cyan)] justify-end shadow-[0_0_10px_rgba(0,212,255,0.3)]"
                                : "bg-[var(--glass-bg)] justify-start border border-[var(--glass-border)]"
                                }`}
                        >
                            <motion.span
                                layout
                                className="w-4 h-4 rounded-full bg-white shadow-sm"
                            />
                        </button>
                    </Card>
                </motion.div>

                {/* Menu Items */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-3 mb-6"
                >
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1 px-1">Engagement</h3>
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Card
                                key={item.label}
                                className="flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                                onClick={() => setShowComingSoon({
                                    open: true,
                                    title: item.label,
                                    message: item.label === "Notifications"
                                        ? "We'll notify you when your AI study packs are ready or when you hit your daily goals! This feature is coming in the next update."
                                        : "Need help? Reach out to us at support@syllabiq.lk or check our documentation. Support center integration is coming soon!"
                                })}
                            >
                                <div className="flex items-center gap-3">
                                    <Icon size={20} className="text-[var(--text-muted)]" />
                                    <span className="font-medium">{item.label}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <ChevronRight size={18} className="text-[var(--text-muted)]" />
                                </div>
                            </Card>
                        );
                    })}
                </motion.div>

                {/* Preferred Language */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="mb-8"
                >
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3 px-1">Preferences</h3>
                    <Card className="p-4">
                        <div className="flex items-center gap-3 mb-4">
                            <Languages size={20} className="text-[var(--accent-cyan)]" />
                            <p className="font-medium">Preferred Language</p>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                            <button className="flex items-center justify-between p-3 rounded-xl bg-[var(--accent-cyan)]/10 border border-[var(--accent-cyan)]/20 text-sm font-semibold text-[var(--accent-cyan)]">
                                <span>English (Default)</span>
                                <div className="w-2 h-2 rounded-full bg-[var(--accent-cyan)] shadow-[0_0_8px_rgba(0,212,255,0.6)]" />
                            </button>
                            <button disabled className="flex items-center justify-between p-3 rounded-xl glass-card opacity-40 cursor-not-allowed text-sm">
                                <span>Sinhala <span className="text-[10px] font-normal opacity-70">(In Development)</span></span>
                            </button>
                            <button disabled className="flex items-center justify-between p-3 rounded-xl glass-card opacity-40 cursor-not-allowed text-sm">
                                <span>Tamil <span className="text-[10px] font-normal opacity-70">(Yet Not Available)</span></span>
                            </button>
                        </div>
                    </Card>
                </motion.div>

                {/* Sign In / Sign Out */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    {isAuthenticated ? (
                        <Button
                            variant="ghost"
                            fullWidth
                            leftIcon={<LogOut size={18} />}
                            className="text-red-500 hover:bg-red-500/10"
                            onClick={handleSignOut}
                            isLoading={isSigningOut}
                        >
                            Sign Out
                        </Button>
                    ) : (
                        <Button
                            variant="primary"
                            fullWidth
                            onClick={() => window.location.href = "/auth/login"}
                        >
                            Sign In
                        </Button>
                    )}
                </motion.div>

                {/* Danger Zone */}
                {isAuthenticated && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.45 }}
                        className="mt-8 pt-8 border-t border-[rgba(255,0,0,0.1)]"
                    >
                        <h3 className="text-xs font-bold uppercase tracking-widest text-red-500/60 mb-3 px-1">Danger Zone</h3>
                        <Card className="border-red-500/20 bg-red-500/5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-sm">Clear All Data</p>
                                    <p className="text-[10px] text-[var(--text-muted)]">This will permanently delete all your study packs.</p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-500 hover:bg-red-500/10 h-8 px-3"
                                    onClick={() => setShowDeleteModal(true)}
                                >
                                    Clear Now
                                </Button>
                            </div>
                        </Card>
                    </motion.div>
                )}

                {/* Footer */}
                <p className="text-center text-xs text-[var(--text-muted)] mt-8">
                    SyllabiQ v1.0.0 • Team Lucid Edge
                </p>
            </div>

            {/* Edit Grade/Stream Modal */}
            <Modal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                title="Edit Profile"
            >
                <div className="space-y-4">
                    {/* Username Field */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1">
                            Username
                        </label>
                        <input
                            type="text"
                            value={editUsername}
                            onChange={(e) => setEditUsername(e.target.value)}
                            className="input w-full"
                            placeholder="Enter your unique username"
                        />
                        <p className="text-[10px] text-[var(--text-muted)] italic">
                            This name will be displayed on your dashboard.
                        </p>
                    </div>

                    <div className="h-px bg-white/5" />
                    {/* Grade Selection */}
                    <div>
                        <label className="text-sm font-medium text-[var(--text-secondary)] block mb-2">
                            Grade Level
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                            {GRADE_LEVELS.map((grade) => (
                                <button
                                    key={grade.value}
                                    onClick={() => setEditGrade(grade.value)}
                                    className={`p-2 rounded-lg text-sm transition-all ${editGrade === grade.value
                                        ? "bg-[var(--accent-cyan)] text-[var(--primary-bg)] font-semibold"
                                        : "glass-card hover:border-[var(--accent-cyan)]"
                                        }`}
                                >
                                    {grade.value}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Stream Selection (A/L only) */}
                    {isALGrade && (
                        <div>
                            <label className="text-sm font-medium text-[var(--text-secondary)] block mb-2">
                                Study Stream
                            </label>
                            <div className="space-y-2">
                                {STUDY_STREAMS.map((stream) => (
                                    <button
                                        key={stream.value}
                                        onClick={() => setEditStream(stream.value)}
                                        className={`w-full p-3 rounded-lg text-left text-sm transition-all ${editStream === stream.value
                                            ? "bg-[var(--secondary-gold)] text-[var(--primary-bg)] font-semibold"
                                            : "glass-card hover:border-[var(--secondary-gold)]"
                                            }`}
                                    >
                                        {stream.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <Button variant="ghost" onClick={() => setShowEditModal(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            fullWidth
                            onClick={handleSaveProfile}
                            isLoading={isSaving}
                        >
                            Save Changes
                        </Button>
                    </div>
                </div>
            </Modal>
            {/* Data Deletion Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setConfirmDeleteText("");
                }}
                title="Are you absolutely sure?"
            >
                <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                        <p className="text-sm text-red-500 leading-relaxed font-medium">
                            This action cannot be undone. This will permanently delete all your
                            <span className="font-bold underline mx-1">Study Packs, Notes, and Flashcards</span>
                            associated with your account.
                        </p>
                    </div>

                    <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-2">
                            Type <span className="text-[var(--text-primary)]">DELETE</span> to confirm
                        </label>
                        <input
                            type="text"
                            value={confirmDeleteText}
                            onChange={(e) => setConfirmDeleteText(e.target.value)}
                            className="w-full bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-xl px-4 py-3 focus:border-red-500 outline-none transition-all text-center font-bold tracking-widest uppercase"
                            placeholder="Type here..."
                            autoFocus
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button
                            variant="ghost"
                            fullWidth
                            onClick={() => {
                                setShowDeleteModal(false);
                                setConfirmDeleteText("");
                            }}
                        >
                            Nevermind
                        </Button>
                        <Button
                            variant="primary"
                            fullWidth
                            className="bg-red-600 hover:bg-red-700 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all border-none"
                            onClick={handleDeleteAllData}
                            isLoading={isDeleting}
                            disabled={confirmDeleteText.toUpperCase() !== "DELETE"}
                        >
                            Delete Everything
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Info Modal for Coming Soon features */}
            <Modal
                isOpen={showComingSoon.open}
                onClose={() => setShowComingSoon({ ...showComingSoon, open: false })}
                title={showComingSoon.title}
            >
                <div className="space-y-4">
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                        {showComingSoon.message}
                    </p>
                    <Button
                        variant="primary"
                        fullWidth
                        onClick={() => setShowComingSoon({ ...showComingSoon, open: false })}
                    >
                        Got it!
                    </Button>
                </div>
            </Modal>
        </AppShell>
    );
}
