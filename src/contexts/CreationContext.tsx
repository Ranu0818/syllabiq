"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface CreationContextType {
    openCreator: (onSuccess?: () => void, initialType?: "youtube" | "pdf" | "text" | "topic", initialTopic?: string) => void;
    closeCreator: () => void;
    isCreatorOpen: boolean;
    onSuccessCallback?: () => void;
    initialType?: "youtube" | "pdf" | "text" | "topic";
    initialTopic?: string;
}

const CreationContext = createContext<CreationContextType | undefined>(undefined);

export function CreationProvider({ children }: { children: ReactNode }) {
    const [isCreatorOpen, setIsCreatorOpen] = useState(false);
    const [onSuccessCallback, setOnSuccessCallback] = useState<(() => void) | undefined>();
    const [initialType, setInitialType] = useState<"youtube" | "pdf" | "text" | "topic" | undefined>();
    const [initialTopic, setInitialTopic] = useState<string | undefined>();

    const openCreator = (callback?: () => void, type?: "youtube" | "pdf" | "text" | "topic", topic?: string) => {
        setOnSuccessCallback(() => callback);
        setInitialType(type);
        setInitialTopic(topic);
        setIsCreatorOpen(true);
    };

    const closeCreator = () => {
        setIsCreatorOpen(false);
        setInitialType(undefined);
        setInitialTopic(undefined);
    };

    return (
        <CreationContext.Provider value={{
            openCreator,
            closeCreator,
            isCreatorOpen,
            onSuccessCallback,
            initialType,
            initialTopic
        }}>
            {children}
        </CreationContext.Provider>
    );
}

export function useCreation() {
    const context = useContext(CreationContext);
    if (context === undefined) {
        throw new Error("useCreation must be used within a CreationProvider");
    }
    return context;
}
