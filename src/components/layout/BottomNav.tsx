"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Library, Plus, BarChart3, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
    href: string;
    icon: React.ElementType;
    label: string;
}

const navItems: NavItem[] = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/library", icon: Library, label: "Library" },
    { href: "/progress", icon: BarChart3, label: "Progress" },
    { href: "/profile", icon: User, label: "Profile" },
];

interface BottomNavProps {
    onCreateClick?: () => void;
}

export function BottomNav({ onCreateClick }: BottomNavProps) {
    const pathname = usePathname();

    return (
        <nav className="bottom-nav">
            {/* First two nav items */}
            {navItems.slice(0, 2).map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn("bottom-nav-item", isActive && "active")}
                    >
                        <Icon size={24} />
                        <span>{item.label}</span>
                    </Link>
                );
            })}

            {/* Center FAB */}
            <div className="bottom-nav-fab">
                <button
                    onClick={onCreateClick}
                    className="btn btn-primary btn-fab neon-glow"
                    aria-label="Create new study pack"
                >
                    <Plus size={28} />
                </button>
            </div>

            {/* Last two nav items */}
            {navItems.slice(2).map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                    <Link
                        key={item.href}
                        href={item.href}
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
