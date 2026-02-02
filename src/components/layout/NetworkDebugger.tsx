"use client";

import { useEffect, useState } from "react";
import { WifiOff, RefreshCw } from "lucide-react";

export function NetworkDebugger() {
    const [isOffline, setIsOffline] = useState(false);

    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Initial check
        setIsOffline(!navigator.onLine);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (!isOffline) return null; // Hide if online

    return (
        <div className="fixed bottom-4 right-4 z-[9999] max-w-sm">
            <div className="p-4 rounded-xl border shadow-2xl backdrop-blur-md flex items-start gap-3 bg-yellow-500/10 border-yellow-500/20 text-yellow-200">
                <div className="mt-1">
                    <WifiOff size={20} />
                </div>
                <div className="flex-1">
                    <h3 className="font-bold text-sm mb-1">
                        You are Offline
                    </h3>
                    <p className="text-xs opacity-80 leading-relaxed mb-2">
                        Check your internet connection. Some features may be limited.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="text-xs font-bold uppercase tracking-wider bg-white/10 px-2 py-1 rounded hover:bg-white/20 transition-colors flex items-center gap-1"
                    >
                        <RefreshCw size={12} /> Reload
                    </button>
                </div>
            </div>
        </div>
    );
}
