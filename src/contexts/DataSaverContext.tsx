"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

interface DataSaverContextType {
    isDataSaver: boolean;
    toggleDataSaver: () => void;
    setDataSaver: (value: boolean) => void;
}

const DataSaverContext = createContext<DataSaverContextType | undefined>(undefined);

const DATA_SAVER_KEY = "syllabiq-data-saver";

export function DataSaverProvider({ children }: { children: React.ReactNode }) {
    const [isDataSaver, setIsDataSaver] = useState(false);

    // Load saved preference on mount
    useEffect(() => {
        const saved = localStorage.getItem(DATA_SAVER_KEY);
        if (saved === "true") {
            setIsDataSaver(true);
            document.documentElement.setAttribute("data-saver", "true");
        }
    }, []);

    // Update document attribute when state changes
    useEffect(() => {
        if (isDataSaver) {
            document.documentElement.setAttribute("data-saver", "true");
            localStorage.setItem(DATA_SAVER_KEY, "true");
        } else {
            document.documentElement.removeAttribute("data-saver");
            localStorage.setItem(DATA_SAVER_KEY, "false");
        }
    }, [isDataSaver]);

    const toggleDataSaver = useCallback(() => {
        setIsDataSaver((prev) => !prev);
    }, []);

    const setDataSaver = useCallback((value: boolean) => {
        setIsDataSaver(value);
    }, []);

    return (
        <DataSaverContext.Provider value={{ isDataSaver, toggleDataSaver, setDataSaver }}>
            {children}
        </DataSaverContext.Provider>
    );
}

export function useDataSaver() {
    const context = useContext(DataSaverContext);
    if (context === undefined) {
        throw new Error("useDataSaver must be used within a DataSaverProvider");
    }
    return context;
}
