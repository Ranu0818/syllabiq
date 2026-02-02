"use client";

import { motion } from "framer-motion";
import {
    BarChart3,
} from "lucide-react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    ResponsiveContainer,
    Tooltip,
} from "recharts";
import { AppShell } from "@/components/layout";
import { Card, CardTitle } from "@/components/ui";

// No demo progress data; real data will be shown when available
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { useState, useEffect } from "react";
import {
    Trophy,
    Flame,
    Zap,
    Target,
    BookOpen
} from "lucide-react";

export default function ProgressPage() {
    const { user, profile } = useAuth();
    const [stats, setStats] = useState<any[]>([]);
    const [weeklyData, setWeeklyData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!user || !profile) return;

            try {
                // 1. Fetch all packs for calculation
                const q = query(
                    collection(db, "study_packs"),
                    where("user_id", "==", user.uid)
                );
                const snapshot = await getDocs(q);
                const packs = snapshot.docs.map(d => ({ ...d.data(), created_at: d.data().created_at }));

                // 2. Calculate Weekly Activity
                const last7Days = [...Array(7)].map((_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    return d.toISOString().split('T')[0];
                }).reverse();

                const activityMap = packs.reduce((acc: any, pack: any) => {
                    const date = pack.created_at?.split('T')[0];
                    if (date) {
                        acc[date] = (acc[date] || 0) + 1;
                    }
                    return acc;
                }, {});

                const chartData = last7Days.map(date => ({
                    day: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
                    study: (activityMap[date] || 0) * 15, // Mock 15 mins per pack
                    quiz: 0 // Placeholder
                }));

                setWeeklyData(chartData);

                // 3. Set Stats
                setStats([
                    {
                        label: "Total XP",
                        value: profile.xp || 0,
                        unit: "XP",
                        icon: Trophy,
                        color: "var(--secondary-gold)"
                    },
                    {
                        label: "Day Streak",
                        value: profile.streak || 0,
                        unit: "Days",
                        icon: Flame,
                        color: "#FF5722"
                    },
                    {
                        label: "Data Saved",
                        value: profile.data_saved_mb || 0,
                        unit: "MB",
                        icon: Zap,
                        color: "#10B981"
                    },
                    {
                        label: "Study Packs",
                        value: packs.length,
                        unit: "Packs",
                        icon: BookOpen,
                        color: "var(--accent-cyan)"
                    }
                ]);

            } catch (err) {
                console.error("Error fetching progress:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user, profile]);
    return (
        <AppShell>
            <div className="container py-6">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 mb-6"
                >
                    <div className="w-10 h-10 rounded-xl bg-[rgba(0,212,255,0.1)] flex items-center justify-center">
                        <BarChart3 className="text-[var(--accent-cyan)]" size={20} />
                    </div>
                    <div>
                        <h1 className="heading-2">Your Progress</h1>
                        <p className="text-sm text-[var(--text-muted)]">
                            Keep up the great work!
                        </p>
                    </div>
                </motion.div>

                {/* Stats Grid (empty until real data loads) */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    {stats.length > 0 ? (
                        stats.map((stat, index) => {
                            const Icon = stat.icon;
                            return (
                                <motion.div
                                    key={stat.label}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <Card className="text-center">
                                        <Icon
                                            size={24}
                                            className="mx-auto mb-2"
                                            style={{ color: stat.color }}
                                        />
                                        <p className="heading-2" style={{ color: stat.color }}>
                                            {stat.value}
                                            <span className="text-sm ml-0.5">{stat.unit}</span>
                                        </p>
                                        <p className="text-xs text-[var(--text-muted)]">{stat.label}</p>
                                    </Card>
                                </motion.div>
                            );
                        })
                    ) : (
                        <>
                            <Card className="text-center">No progress data available yet</Card>
                            <Card className="text-center">No progress data available yet</Card>
                        </>
                    )}
                </div>

                {/* Weekly Activity Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <Card variant="static" className="mb-6">
                        <CardTitle className="mb-4">Weekly Activity</CardTitle>
                        {weeklyData.length > 0 ? (
                            <div className="h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={weeklyData}>
                                        <defs>
                                            <linearGradient id="colorStudy" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#00D4FF" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorQuiz" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#FFD700" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#FFD700" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis
                                            dataKey="day"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                                        />
                                        <YAxis hide />
                                        <Tooltip
                                            contentStyle={{
                                                background: "var(--primary-bg-light)",
                                                border: "1px solid var(--glass-border)",
                                                borderRadius: "8px",
                                                color: "var(--text-primary)",
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="study"
                                            stroke="#00D4FF"
                                            strokeWidth={2}
                                            fill="url(#colorStudy)"
                                            name="Study Time (min)"
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="quiz"
                                            stroke="#FFD700"
                                            strokeWidth={2}
                                            fill="url(#colorQuiz)"
                                            name="Quiz Score (%)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-48 flex items-center justify-center">
                                <p className="text-[var(--text-muted)]">No activity data yet</p>
                            </div>
                        )}
                        <div className="flex justify-center gap-6 mt-2">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-[var(--accent-cyan)]" />
                                <span className="text-xs text-[var(--text-muted)]">Study Time</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-[var(--secondary-gold)]" />
                                <span className="text-xs text-[var(--text-muted)]">Quiz Score</span>
                            </div>
                        </div>
                    </Card>
                </motion.div>


            </div>
        </AppShell>
    );
}
