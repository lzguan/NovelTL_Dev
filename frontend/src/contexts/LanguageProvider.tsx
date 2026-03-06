import { useEffect, useState } from "react";
import type { Language } from "../types/language";
import { getLanguages } from "../api/languages";
import { LanguageContext } from "./LanguageContext";

interface LanguageProviderProps {
    children: React.ReactNode;
}

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
    const [languages, setLanguages] = useState<Language[]>([]);
    useEffect(() => {
        getLanguages().then(setLanguages).catch(err => {
            console.error("Failed to fetch languages:", err);
        });
    }, []);
    return (
        <LanguageContext.Provider value={languages}>
            {children}
        </LanguageContext.Provider>
    );
}

