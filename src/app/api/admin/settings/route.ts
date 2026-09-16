/**
 * ==============================================================================
 * API ЕНДПОІНТ НАЛАШТУВАНЬ СИСТЕМИ (`src/app/api/admin/settings/route.ts`)
 * ==============================================================================
 */

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "src", "data", "settings.json");

const defaultSettings = {
    schoolName: "ОЗО «Болградський ліцей»",
    academicYear: "2026-2027",
    address: "м. Болград, вул. Ізмаїльська, 1а",
    website: "https://myschool.best",
    email: "licey@myschool.best",
    phone: "+38 (04846) 4-00-00",
    allowRegistration: true,
    maxFileSizeMB: 15,
    allowedExtensions: ".pdf, .docx, .xlsx, .png, .jpg, .zip, .sb3",
    maintenanceMode: false,
    // Нові параметри оформлення
    primaryColor: "#2563eb", // Синій (Blue-600) за замовчуванням
    fontSize: "normal", // 'compact' | 'normal' | 'large'
};

// GET: Зчитування налаштувань
export async function GET() {
    try {
        if (!fs.existsSync(filePath)) {
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
            fs.writeFileSync(filePath, JSON.stringify(defaultSettings, null, 2), "utf-8");
            return NextResponse.json(defaultSettings);
        }

        const data = fs.readFileSync(filePath, "utf-8");
        const parsed = JSON.parse(data);

        return NextResponse.json({ ...defaultSettings, ...parsed });
    } catch (error) {
        return NextResponse.json(defaultSettings);
    }
}

// POST: Збереження оновлених налаштувань
export async function POST(req: Request) {
    try {
        const body = await req.json();

        let currentSettings = defaultSettings;
        if (fs.existsSync(filePath)) {
            try {
                currentSettings = JSON.parse(fs.readFileSync(filePath, "utf-8"));
            } catch (e) {}
        }

        const updatedSettings = {
            ...currentSettings,
            ...body,
        };

        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, JSON.stringify(updatedSettings, null, 2), "utf-8");

        return NextResponse.json({ success: true, settings: updatedSettings });
    } catch (error) {
        return NextResponse.json({ error: "Не вдалося зберегти налаштування" }, { status: 500 });
    }
}