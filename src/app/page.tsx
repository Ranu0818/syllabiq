"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Sparkles,
  WifiOff,
  ChevronRight,
  TrendingDown,
  Target,
  Flame,
  Zap,
  Brain,
  Trophy,
  History,
  FileText,
  Sun,
  Moon,
  CloudSun,
  Stars,
  Search,
} from "lucide-react";
import { AppShell } from "@/components/layout";
import { Card, Button, Input } from "@/components/ui";
import { useAuth } from "@/contexts/AuthContext";
import { useCreation } from "@/contexts/CreationContext";
import { supabase } from "@/lib/supabase";

export default function HomePage() {
  const { user, profile, isAuthenticated, isLoading } = useAuth();
  const { openCreator } = useCreation();
  const [recentPacks, setRecentPacks] = useState<any[]>([]);
  const [isLoadingPacks, setIsLoadingPacks] = useState(true);
  const [goalPercentage, setGoalPercentage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      openCreator(fetchRecentPacks, "topic", searchQuery.trim());
      setSearchQuery("");
    }
  };

  // Function to refresh packs when a new one is created
  const fetchRecentPacks = async () => {
    if (!user) {
      setIsLoadingPacks(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("study_packs")
        .select("id, title, subject, grade, flashcards, quizzes, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) {
        console.error("Supabase Error Details:", error.message, error.code, error.details);
        throw error;
      }
      setRecentPacks(data || []);
    } catch (err: any) {
      console.error("Error fetching recent packs:", err?.message || err);
    } finally {
      setIsLoadingPacks(false);
    }
  };

  const fetchGoalProgress = async () => {
    if (!user) return;
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { count, error } = await supabase
        .from("study_packs")
        .select("*", { count: 'exact', head: true })
        .eq("user_id", user.id)
        .gte("created_at", sevenDaysAgo.toISOString());

      if (!error && count !== null) {
        const weeklyGoal = 5; // Study 5 packs a week
        const percentage = Math.min(Math.round((count / weeklyGoal) * 100), 100);
        setGoalPercentage(percentage);
      }
    } catch (err) {
      console.error("Error fetching goal progress:", err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchRecentPacks();
      fetchGoalProgress();
    } else {
      setIsLoadingPacks(false);
    }
  }, [user, isAuthenticated]);

  const greeting = getGreeting();

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return { text: "Good Morning", icon: <Sun className="text-orange-400" size={24} />, color: "from-orange-500/20" };
    if (hour < 17) return { text: "Good Afternoon", icon: <CloudSun className="text-yellow-400" size={24} />, color: "from-yellow-500/20" };
    if (hour < 21) return { text: "Good Evening", icon: <Moon className="text-indigo-400" size={24} />, color: "from-indigo-600/20" };
    return { text: "Good Night", icon: <Stars className="text-purple-400" size={24} />, color: "from-purple-600/20" };
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[var(--accent-cyan)] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <AppShell onSuccess={fetchRecentPacks}>
      <div className="container py-6">
        {/* Premium Welcome Hero Card */}
        {isAuthenticated && profile ? (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className={`relative overflow-hidden p-6 rounded-[2rem] border border-[var(--glass-border)] bg-gradient-to-br ${greeting.color} to-transparent shadow-2xl`}>
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 p-4 opacity-20 transform scale-150 rotate-12">
                {greeting.icon}
              </div>
              <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-[var(--accent-cyan)]/10 blur-3xl rounded-full" />

              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="p-1.5 rounded-lg bg-white/5 backdrop-blur-md border border-white/10">
                      {greeting.icon}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                      {greeting.text}
                    </span>
                  </div>
                  <h1 className="text-3xl font-black tracking-tight mb-1">
                    Hi, <span className="neon-text">{profile.username || profile.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "Student"}!</span> 👋
                  </h1>
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded-md bg-[var(--accent-cyan)]/10 border border-[var(--accent-cyan)]/20 text-[10px] font-bold text-[var(--accent-cyan)] uppercase">
                      {profile.grade || "No Grade"}
                    </span>
                    {profile.stream && (
                      <span className="px-2 py-0.5 rounded-md bg-[var(--secondary-gold)]/10 border border-[var(--secondary-gold)]/20 text-[10px] font-bold text-[var(--secondary-gold)] uppercase">
                        {profile.stream}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-black/20 backdrop-blur-xl p-3 rounded-2xl border border-white/5 self-start md:self-center">
                  <div className="text-center px-2">
                    <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-tighter mb-0.5">Rank</p>
                    <p className="text-sm font-black text-[var(--secondary-gold)]">
                      {profile.xp && profile.xp >= 100 ? "PRO" : "ROOKIE"}
                    </p>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                  <div className="text-center px-2">
                    <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-tighter mb-0.5">Goal</p>
                    <p className="text-sm font-black text-[var(--accent-cyan)]">{goalPercentage}%</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <div className="relative inline-block">
              <motion.div
                className="w-20 h-20 rounded-2xl glass-card-accent mb-6 flex items-center justify-center mx-auto relative z-10"
                animate={{ y: [0, -8, 0], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <Sparkles size={40} className="text-[var(--accent-cyan)]" />
              </motion.div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-[var(--accent-cyan)]/20 blur-[40px] rounded-full" />
            </div>
            <h1 className="heading-1 mb-3">
              <span className="neon-text">SyllabiQ</span>
            </h1>
            <p className="text-[var(--text-secondary)] text-lg max-w-xs mx-auto">
              Smart Study Companion for Sri Lankan Students
            </p>
          </motion.div>
        )}

        {/* Quick Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <form onSubmit={handleSearchSubmit} className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[var(--accent-cyan)] group-focus-within:scale-110 transition-transform">
              <Search size={20} />
            </div>
            <input
              type="text"
              placeholder="What do you want to learn today?"
              className="w-full pl-12 pr-28 py-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl focus:outline-none focus:border-[var(--accent-cyan)]/50 focus:ring-1 focus:ring-[var(--accent-cyan)]/20 transition-all text-sm font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute right-2 top-2">
              <Button
                type="submit"
                size="sm"
                variant="primary"
                disabled={!searchQuery.trim()}
                className="rounded-xl px-4"
              >
                AI Create
              </Button>
            </div>
          </form>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-1.5 ml-1">
              <Sparkles size={10} className="text-[var(--accent-cyan)]" /> Trending:
            </span>
            {["Cell Cycle", "Newton's Laws", "Civil War", "Python Basics"].map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  openCreator(fetchRecentPacks, "topic", tag);
                }}
                className="text-[10px] px-2.5 py-1 rounded-full bg-white/5 border border-white/5 hover:border-[var(--accent-cyan)]/30 hover:bg-[var(--accent-cyan)]/5 transition-all text-[var(--text-muted)] hover:text-[var(--accent-cyan)]"
              >
                {tag}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Bento Stats Grid (Only for Auth Users) */}
        {isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 gap-3 mb-8"
          >
            {/* Cell 1: Total Packs */}
            <Card className="p-4 bg-gradient-to-br from-[rgba(0,212,255,0.05)] to-transparent border-[var(--accent-cyan)]/20">
              <div className="flex flex-col h-full justify-between">
                <div className="p-2 rounded-lg bg-[rgba(0,212,255,0.1)] w-fit mb-3">
                  <Brain className="text-[var(--accent-cyan)]" size={18} />
                </div>
                <div>
                  <p className="text-[28px] font-bold leading-none mb-1">
                    {recentPacks.length}+
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold">
                    AI Study Packs
                  </p>
                </div>
              </div>
            </Card>

            {/* Cell 2: Streak */}
            <Card className="p-4 bg-gradient-to-br from-[rgba(255,215,0,0.05)] to-transparent border-[var(--secondary-gold)]/20">
              <div className="flex flex-col h-full justify-between">
                <div className="p-2 rounded-lg bg-[rgba(255,215,0,0.1)] w-fit mb-3">
                  <Flame className="text-[var(--secondary-gold)] animate-glow-gold" size={18} />
                </div>
                <div>
                  <p className="text-[28px] font-bold leading-none mb-1 neon-text-gold">
                    {profile?.streak?.toString().padStart(2, '0') || '00'}
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-bold">
                    Day Streak
                  </p>
                </div>
              </div>
            </Card>

            {/* Cell 3: Data Saved (Wide) */}
            <Card className="col-span-2 p-4 flex items-center justify-between bg-[rgba(255,255,255,0.02)]">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-emerald-500/10">
                  <Zap className="text-emerald-400" size={24} />
                </div>
                <div>
                  <p className="text-lg font-bold">{profile?.data_saved_mb || 0} MB</p>
                  <p className="text-xs text-[var(--text-muted)]">Data Saved This Week</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">
                  +12% EFFICIENCY
                </p>
              </div>
            </Card>

            {/* Cell 4: Rank (Small) */}
            <Card className="col-span-2 p-4 flex items-center gap-4 border-dashed">
              <div className="w-10 h-10 rounded-full bg-[var(--glass-bg)] flex items-center justify-center border border-[var(--glass-border)]">
                <Trophy className="text-[var(--secondary-gold)]" size={20} />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-end mb-1">
                  <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">
                    {profile?.xp && profile.xp >= 100 ? "Advanced Learner" : "Novice Learner"}
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)]">{(profile?.xp || 0) % 100}/100 XP</p>
                </div>
                <div className="h-1.5 w-full bg-[var(--glass-bg)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--secondary-gold)] rounded-full shadow-[0_0_8px_rgba(255,215,0,0.4)] transition-all duration-1000"
                    style={{ width: `${(profile?.xp || 0) % 100}%` }}
                  />
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Quick Actions Bento */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <button
            onClick={() => openCreator(fetchRecentPacks)}
            className="glass-card-accent p-6 text-left relative overflow-hidden group col-span-2"
          >
            <div className="relative z-10">
              <Sparkles className="text-[var(--accent-cyan)] mb-3" size={32} />
              <h3 className="heading-3 mb-1">Magic Create</h3>
              <p className="text-xs text-[var(--text-secondary)]">AI-powered study packs from Any URL</p>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
              <Brain size={120} />
            </div>
          </button>

          <Link href="/library" className="glass-card p-4 text-left flex flex-col justify-between hover:border-[var(--secondary-gold)] transition-colors">
            <History className="text-[var(--secondary-gold)] mb-6" size={24} />
            <p className="text-sm font-bold">Past Activity</p>
          </Link>

          <Link href="/progress" className="glass-card p-4 text-left flex flex-col justify-between hover:border-emerald-400 transition-colors">
            <Target className="text-emerald-400 mb-6" size={24} />
            <p className="text-sm font-bold">Goal Pursuit</p>
          </Link>
        </div>

        {/* Feature Cards (shown for non-authenticated users) */}
        {!isAuthenticated && (
          <div className="space-y-4 mb-10">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[rgba(0,212,255,0.1)] flex items-center justify-center flex-shrink-0">
                  <TrendingDown className="text-[var(--accent-cyan)]" size={24} />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">Save Data</h3>
                  <p className="text-sm text-[var(--text-muted)]">
                    Convert YouTube videos to text notes
                  </p>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[rgba(255,215,0,0.1)] flex items-center justify-center flex-shrink-0">
                  <WifiOff className="text-[var(--secondary-gold)]" size={24} />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">Study Offline</h3>
                  <p className="text-sm text-[var(--text-muted)]">
                    Download packs, study without WiFi
                  </p>
                </div>
              </Card>
            </motion.div>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Link href="/auth/login" className="block w-full">
                <Button
                  variant="primary"
                  fullWidth
                  rightIcon={<ChevronRight size={20} />}
                >
                  Sign In to Get Started
                </Button>
              </Link>
            </motion.div>
          </div>
        )}

        {/* Recent Study Packs */}
        {isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="heading-3">Recent Study Packs</h2>
              <Link href="/library" className="text-xs text-[var(--accent-cyan)] font-medium">
                View All
              </Link>
            </div>

            {isLoadingPacks ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin w-6 h-6 border-2 border-[var(--accent-cyan)] border-t-transparent rounded-full" />
              </div>
            ) : recentPacks.length > 0 ? (
              <div className="space-y-3">
                {recentPacks.map((pack) => (
                  <Link key={pack.id} href={`/study/${pack.id}`}>
                    <Card className="flex items-center gap-3 hover:border-[var(--accent-cyan)] transition-colors mb-2">
                      <div className="w-10 h-10 rounded-lg bg-[rgba(0,212,255,0.1)] flex items-center justify-center flex-shrink-0">
                        <FileText className="text-[var(--accent-cyan)]" size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{pack.title}</h4>
                        <p className="text-xs text-[var(--text-muted)]">
                          {pack.subject} • {pack.flashcards?.length || 0} cards
                        </p>
                      </div>
                      <ChevronRight size={16} className="text-[var(--text-muted)]" />
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <Card className="py-8 text-center bg-transparent border-dashed">
                <p className="text-sm text-[var(--text-muted)] mb-3">No study packs yet</p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => openCreator(fetchRecentPacks)}
                >
                  Create your first one
                </Button>
              </Card>
            )}
          </motion.div>
        )}
      </div>
    </AppShell >
  );
}
