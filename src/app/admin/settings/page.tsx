/**
 * ==============================================================================
 * СТОРІНКА НАЛАШТУВАНЬ СИСТЕМИ (`src/app/admin/settings/page.tsx`)
 * ==============================================================================
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    Building,
    HardDrive,
    ShieldAlert,
    Save,
    CheckCircle2,
    Sliders,
    Loader2,
    MapPin,
    Globe,
    Mail,
    Phone,
    Palette,
    Type,
    FileCheck
} from "lucide-react";

// Список популярних розширень для швидкого вибору
const AVAILABLE_EXTENSIONS = [
    { label: "PDF Документи", ext: ".pdf", category: "Документи" },
    { label: "Word (.docx)", ext: ".docx", category: "Документи" },
    { label: "Excel (.xlsx)", ext: ".xlsx", category: "Документи" },
    { label: "Презентації (.pptx)", ext: ".pptx", category: "Документи" },
    { label: "Зображення PNG", ext: ".png", category: "Медіа" },
    { label: "Зображення JPG/JPEG", ext: ".jpg", category: "Медіа" },
    { label: "SVG Графіка", ext: ".svg", category: "Медіа" },
    { label: "Архіви ZIP", ext: ".zip", category: "Файли" },
    { label: "Архіви RAR", ext: ".rar", category: "Файли" },
    { label: " Scratch 3 (.sb3)", ext: ".sb3", category: "Освіта" },
    { label: "Python (.py)", ext: ".py", category: "Освіта" },
];

// Пресети основних кольорів
const COLOR_PRESETS = [
    { name: "Класичний синій", value: "#2563eb" },
    { name: "Смарагдовий", value: "#059669" },
    { name: "Фіолетовий", value: "#7c3aed" },
    { name: "Індиго", value: "#4f46e5" },
    { name: "Темно-бордовий", value: "#991b1b" },
    { name: "Теплий бурштиновий", value: "#d97706" },
];

export default function AdminSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const [settings, setSettings] = useState({
        schoolName: "",
        academicYear: "",
        address: "",
        website: "",
        email: "",
        phone: "",
        allowRegistration: true,
        maxFileSizeMB: 15,
        allowedExtensions: ".pdf, .docx, .png, .jpg, .zip, .sb3",
        maintenanceMode: false,
        primaryColor: "#2563eb",
        fontSize: "normal",
    });

    const [customExt, setCustomExt] = useState("");

    useEffect(() => {
        fetch("/api/admin/settings")
            .then((res) => res.json())
            .then((data) => {
                setSettings((prev) => ({ ...prev, ...data }));
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    // Отримання списку обраних розширень у вигляді масиву
    const selectedExtensionsList = settings.allowedExtensions
        ? settings.allowedExtensions.split(",").map((s) => s.trim().toLowerCase())
        : [];

    // Перемикач розширення при кліку на чекбокс
    const toggleExtension = (ext: string) => {
        const lowerExt = ext.toLowerCase();
        let updated: string[];

        if (selectedExtensionsList.includes(lowerExt)) {
            updated = selectedExtensionsList.filter((e) => e !== lowerExt);
        } else {
            updated = [...selectedExtensionsList, lowerExt];
        }

        setSettings({ ...settings, allowedExtensions: updated.join(", ") });
    };

    // Додавання власного розширення вручну
    const handleAddCustomExt = () => {
        if (!customExt) return;
        let formatted = customExt.trim().toLowerCase();
        if (!formatted.startsWith(".")) formatted = "." + formatted;

        if (!selectedExtensionsList.includes(formatted)) {
            const updated = [...selectedExtensionsList, formatted];
            setSettings({ ...settings, allowedExtensions: updated.join(", ") });
        }
        setCustomExt("");
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch("/api/admin/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings),
            });
            if (res.ok) {
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Завантаження налаштувань...
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
                <div className="space-y-1">
                    <Link
                        href="/admin"
                        className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition font-medium mb-1"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Повернутися в панель
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
                        <Sliders className="w-6 h-6 text-blue-600" />
                        Налаштування системи
                    </h1>
                    <p className="text-xs text-slate-500">
                        Глобальні параметри платформи, зовнішній вигляд, ліміти завантажень та контакти
                    </p>
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition shadow-sm active:scale-95 disabled:opacity-50"
                >
                    {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : saved ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    {saved ? "Збережено!" : saving ? "Збереження..." : "Зберегти зміни"}
                </button>
            </div>

            <form onSubmit={handleSave} className="space-y-6">

                {/* 1. Налаштування теми та вигляду (Колір і Шрифти) */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
                    <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                        <Palette className="w-4 h-4 text-purple-500" />
                        Зовнішній вигляд та теми сайту
                    </h2>

                    {/* Вибір кольору */}
                    <div className="space-y-3">
                        <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                            <span>Основний акцентний колір системи</span>
                            <span className="text-[11px] font-mono text-slate-400">{settings.primaryColor}</span>
                        </label>

                        <div className="flex flex-wrap items-center gap-3">
                            {COLOR_PRESETS.map((preset) => (
                                <button
                                    key={preset.value}
                                    type="button"
                                    onClick={() => setSettings({ ...settings, primaryColor: preset.value })}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition ${
                                        settings.primaryColor === preset.value
                                            ? "border-slate-800 ring-2 ring-slate-400/30 bg-slate-50 font-bold"
                                            : "border-slate-200 hover:border-slate-300"
                                    }`}
                                >
                                    <span
                                        className="w-3.5 h-3.5 rounded-full shadow-sm"
                                        style={{ backgroundColor: preset.value }}
                                    />
                                    <span>{preset.name}</span>
                                </button>
                            ))}

                            {/* Довільний колір (Color Picker) */}
                            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                                <input
                                    type="color"
                                    value={settings.primaryColor}
                                    onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                                    className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 p-0.5 bg-white"
                                    title="Вибрати власний колір"
                                />
                                <span className="text-xs text-slate-500 font-medium">Свій колір</span>
                            </div>
                        </div>
                    </div>

                    {/* Розмір шрифту */}
                    <div className="pt-3 border-t border-slate-100 space-y-2">
                        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                            <Type className="w-3.5 h-3.5 text-slate-400" />
                            Базовий розмір шрифту платформи
                        </label>
                        <div className="grid grid-cols-3 gap-3 max-w-md">
                            {[
                                { id: "compact", title: "Компактний", desc: "Дрібний текст (14px)" },
                                { id: "normal", title: "Стандартний", desc: "Оптимальний (16px)" },
                                { id: "large", title: "Крупний", desc: "Збільшений (18px)" },
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => setSettings({ ...settings, fontSize: item.id })}
                                    className={`p-3 text-left rounded-xl border transition ${
                                        settings.fontSize === item.id
                                            ? "border-blue-600 bg-blue-50/50 text-blue-900 font-semibold"
                                            : "border-slate-200 hover:bg-slate-50 text-slate-700"
                                    }`}
                                >
                                    <p className="text-xs font-bold">{item.title}</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">{item.desc}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 2. Інформація про заклад */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                    <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                        <Building className="w-4 h-4 text-blue-500" />
                        Інформація про заклад та навчальний процес
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700">Назва навчального закладу</label>
                            <input
                                type="text"
                                value={settings.schoolName}
                                onChange={(e) => setSettings({ ...settings, schoolName: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700">Навчальний рік</label>
                            <input
                                type="text"
                                value={settings.academicYear}
                                onChange={(e) => setSettings({ ...settings, academicYear: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                            />
                        </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-slate-50">
                        <div>
                            <p className="text-xs font-semibold text-slate-800">Реєстрація нових користувачів</p>
                            <p className="text-[11px] text-slate-500">Дозволити учням самостійно реєструватися в системі</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={settings.allowRegistration}
                            onChange={(e) => setSettings({ ...settings, allowRegistration: e.target.checked })}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-slate-300 cursor-pointer"
                        />
                    </div>
                </div>

                {/* 3. Параметри завантаження файлів (ЧЕКБОКСИ РАЗОМ З ЛІМІТАМИ) */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
                    <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                        <HardDrive className="w-4 h-4 text-emerald-500" />
                        Параметри завантаження файлів
                    </h2>

                    <div className="space-y-1.5 max-w-xs">
                        <label className="text-xs font-semibold text-slate-700">Макс. розмір одного файлу (МБ)</label>
                        <input
                            type="number"
                            value={settings.maxFileSizeMB}
                            onChange={(e) => setSettings({ ...settings, maxFileSizeMB: Number(e.target.value) })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                        />
                    </div>

                    {/* Чекбокси вибору розширень */}
                    <div className="space-y-3 pt-2">
                        <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                                <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                                Дозволені розширення файлів
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                                {selectedExtensionsList.length} обрано
                            </span>
                        </label>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 bg-slate-50 p-4 rounded-xl border border-slate-200/70">
                            {AVAILABLE_EXTENSIONS.map((item) => {
                                const isChecked = selectedExtensionsList.includes(item.ext.toLowerCase());
                                return (
                                    <label
                                        key={item.ext}
                                        className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs cursor-pointer select-none transition ${
                                            isChecked
                                                ? "bg-white border-emerald-500 text-emerald-950 font-semibold shadow-sm"
                                                : "bg-white/50 border-slate-200 text-slate-600 hover:bg-white"
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => toggleExtension(item.ext)}
                                            className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                                        />
                                        <div className="flex flex-col">
                                            <span>{item.label}</span>
                                            <span className="text-[9px] text-slate-400 font-mono">{item.ext}</span>
                                        </div>
                                    </label>
                                );
                            })}
                        </div>

                        {/* Додавання свого розширення */}
                        <div className="flex items-center gap-2 pt-1">
                            <input
                                type="text"
                                value={customExt}
                                onChange={(e) => setCustomExt(e.target.value)}
                                placeholder="Додати інше (наприклад: .mp4)"
                                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                            <button
                                type="button"
                                onClick={handleAddCustomExt}
                                className="px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-bold transition"
                            >
                                Додати
                            </button>
                        </div>
                    </div>
                </div>

                {/* 4. Контактні дані */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                    <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                        <MapPin className="w-4 h-4 text-rose-500" />
                        Контактні дані (відображаються у підвалі)
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                Адреса закладу
                            </label>
                            <input
                                type="text"
                                value={settings.address}
                                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                                <Globe className="w-3.5 h-3.5 text-slate-400" />
                                Офіційний сайт
                            </label>
                            <input
                                type="text"
                                value={settings.website}
                                onChange={(e) => setSettings({ ...settings, website: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                                <Mail className="w-3.5 h-3.5 text-slate-400" />
                                Електронна пошта
                            </label>
                            <input
                                type="email"
                                value={settings.email}
                                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                                Контактний телефон
                            </label>
                            <input
                                type="text"
                                value={settings.phone}
                                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>
                    </div>
                </div>

                {/* 5. Логи */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                    <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                        <ShieldAlert className="w-4 h-4 text-rose-500" />
                        Технічне обслуговування та моніторинг
                    </h2>

                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="space-y-0.5">
                            <p className="text-xs font-bold text-slate-800">Системний журнал помилок (Logs)</p>
                            <p className="text-[11px] text-slate-500">Переглянути зареєстровані збої та стектрейси</p>
                        </div>
                        <Link
                            href="/admin/logs"
                            className="px-3 py-1.5 bg-white border border-slate-200 text-xs font-bold text-slate-700 rounded-lg hover:bg-slate-100 transition"
                        >
                            Перейти до логів
                        </Link>
                    </div>
                </div>
            </form>
        </div>
    );
}