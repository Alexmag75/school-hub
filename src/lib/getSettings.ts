import fs from "fs";
import path from "path";

export function getSettings() {
    try {
        const filePath = path.join(process.cwd(), "src", "data", "settings.json");
        if (fs.existsSync(filePath)) {
            const data = fs.readFileSync(filePath, "utf-8");
            return JSON.parse(data);
        }
    } catch (e) {
        console.error("Помилка зчитування settings.json:", e);
    }
    // Розширені значення за замовчуванням
    return {
        schoolName: "ОЗО Болградський Ліцей",
        academicYear: "2026-2027",
        address: "м. Болград, вул. Ізмаїльська, 1а",
        website: "https://myschool.best",
        email: "licey@myschool.best",
        phone: "+38 (04846) 4-00-00",
    };
}