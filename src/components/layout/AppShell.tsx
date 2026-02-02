import { ReactNode, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { BottomNav } from "./BottomNav";
import { DataSaverToggle } from "./DataSaverToggle";
import { StudyPackCreator } from "../features/StudyPackCreator";
import { useCreation } from "@/contexts/CreationContext";

interface AppShellProps {
    children: ReactNode;
    showNav?: boolean;
    showDataSaver?: boolean;
    onCreateClick?: () => void;
    onSuccess?: () => void;
}

export function AppShell({
    children,
    showNav = true,
    showDataSaver = true,
    onCreateClick,
    onSuccess,
}: AppShellProps) {
    const pathname = usePathname();
    const { isCreatorOpen, openCreator, closeCreator } = useCreation();

    // Hide nav on auth pages
    const isAuthPage = pathname?.startsWith("/auth");
    const shouldShowNav = showNav && !isAuthPage;

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

    const handleCreateClick = () => {
        if (onCreateClick) {
            onCreateClick();
        } else {
            openCreator(onSuccess);
        }
    };

    const handleRepair = () => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(registrations => {
                for (let registration of registrations) registration.unregister();
                window.location.reload();
            });
        } else {
            window.location.reload();
        }
    };

    return (
        <div className="min-h-screen flex flex-col">
            {/* Offline Banner */}
            {isOffline && (
                <div className="bg-yellow-500/90 text-black text-[10px] md:text-xs font-bold text-center py-1 px-4 fixed top-0 w-full z-[100] backdrop-blur-md flex items-center justify-center gap-2">
                    <span>You are currently offline. Some features may be limited. 📡</span>
                    <button
                        onClick={handleRepair}
                        className="bg-black/20 hover:bg-black/40 px-2 py-0.5 rounded-md border border-black/10 transition-colors uppercase tracking-wider"
                    >
                        Repair Sync
                    </button>
                </div>
            )}

            {/* Data Saver Toggle - Fixed top right */}
            {showDataSaver && (
                <div className="fixed top-4 right-4 z-50">
                    <DataSaverToggle />
                </div>
            )}

            {/* Main Content Area */}
            <main className={shouldShowNav ? "page-content" : "flex-1"}>
                {children}
            </main>

            {/* Bottom Navigation */}
            {shouldShowNav && <BottomNav onCreateClick={handleCreateClick} />}

            {/* Global Study Pack Creator Modal */}
            <StudyPackCreator
                isOpen={isCreatorOpen}
                onClose={closeCreator}
                onSuccess={onSuccess}
            />
        </div>
    );
}
