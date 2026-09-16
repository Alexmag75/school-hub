import path from "path";

export interface SchoolSettings {
    schoolName: string;
    academicYear: string;
    address: string;
    website: string;
    email: string;
    phone: string;
    fontSize?: "compact" | "normal" | "large" | string;
    primaryColor?: string; // 👈 Додано поле primaryColor
    theme?: string;
}

export const DEFAULT_SETTINGS: SchoolSettings = {
    schoolName: "ОЗО Болградський Ліцей",
    academicYear: "2026-2027",
    address: "м. Болград, вул. Ізмаїльська, 1а",
    website: "https://myschool.best",
    email: "licey@myschool.best",
    phone: "+38 (04846) 4-00-00",
    fontSize: "normal",
    primaryColor: "#2563eb", // 👈 Значення за замовчуванням
};

export function getSettings(): SchoolSettings {
    if (typeof window !== "undefined") {
        return DEFAULT_SETTINGS;
    }

    try {
        const fs = require("fs");
        const filePath = path.join(process.cwd(), "src", "data", "settings.json");

        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, "utf-8");
            return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
        }
    } catch (e) {
        console.error("Помилка зчитування settings.json:", e);
    }

    return DEFAULT_SETTINGS;
}