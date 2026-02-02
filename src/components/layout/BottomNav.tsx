"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Library, Plus, User, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
    href?: string; // Make href optional
    icon: React.ElementType;
    label: string;
    onClick?: () => void; // Add onClick for the FAB
    color?: string; // Add color property
}

interface BottomNavProps {
    onCreateClick?: () => void;
}

export function BottomNav({ onCreateClick }: BottomNavProps) {
    const pathname = usePathname();

    const navItems: NavItem[] = [
        { icon: Home, label: "Home", href: "/", color: "text-[var(--accent-cyan)]" },
        { icon: Library, label: "Library", href: "/library", color: "text-[var(--secondary-gold)]" },
        { icon: Plus, label: "Create", onClick: onCreateClick, color: "text-emerald-400" },
        { icon: MessageCircle, label: "Study Mate", href: "/studymate", color: "text-purple-400" },
        { icon: User, label: "Profile", href: "/profile", color: "text-rose-400" }
    ];

    return (
        <nav className="bottom-nav">
            {navItems.map((item, idx) => {
                const Icon = item.icon;
                const isActive = item.href && pathname === item.href;

                if (item.onClick) {
                    return (
                        <div key={item.label} className="bottom-nav-fab">
                            <button
                                onClick={item.onClick}
                                className="btn btn-primary btn-fab neon-glow"
                                aria-label={item.label}
                            >
                                <Icon size={28} />
                            </button>
                        </div>
                    );
                }

                return (
                    <Link
                        key={item.href}
                        href={item.href!}
                        className={cn("bottom-nav-item", isActive && "active")}
                    >
                        <Icon size={24} />
                        <span>{item.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
