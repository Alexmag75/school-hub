"use client";

/**
 * ==============================================================================
 * СТОРІНКА ПЕРЕГЛЯДУ УРОКУ ВЧИТЕЛЕМ (`src/app/teacher/lessons/[id]/page.tsx`)
 * ==============================================================================
 * @description Клієнтський компонент для перегляду матеріалів конкретного уроку:
 *              1. Отримує ID уроку з URL-параметрів (`useParams`).
 *              2. Завантажує детальні дані матеріалу з API (`/api/teacher/materials/[id]`).
 *              3. Безпечно парсить JSON-структуру контенту (цілі, блоки, домашнє завдання).
 *              4. Відображає мультимедійний контент (текст, зображення, YouTube, Google Presentations).
 *
 * @tech_stack Next.js App Router (Client Component), Tailwind CSS, Lucide Icons.
 * ==============================================================================
 */

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { LessonBlock } from "@/types/lesson";

/** Інтерфейс деталей матеріалу, отриманого з БД */
interface MaterialDetails {
    id: string;
    title: string;
    content: string;
    createdAt: string;
    topic?: { id: string; title: string };
    subject?: { id: string; title: string };
    assignments?: { class: { id: string; name: string }; deadline?: string }[];
}

/** Інтерфейс розпарсеного JSON-контенту уроку */
interface ParsedLessonData {
    objectives?: string;
    blocks?: LessonBlock[];
    homework?: string;
}

/**
 * Трансформує звичайні посилання Google Presentation / Drive у формат iframe-вбудовування.
 *
 * @param url - Сире посилання на Google Docs/Drive
 * @returns Посилання, адаптоване для використання у src для <iframe>
 */
const getEmbedPresentationUrl = (url: string): string | null => {
    if (!url) return null;
    const cleanUrl = url.trim();

    // Обробка Google Slides
    if (cleanUrl.includes("docs.google.com/presentation/d/")) {
        if (cleanUrl.includes("/embed")) return cleanUrl;
        return cleanUrl.replace(/\/edit.*$/, "/embed?start=false&loop=false&delayms=3000");
    }

    // Обробка файлів Google Drive
    if (cleanUrl.includes("drive.google.com/file/d/")) {
        return cleanUrl.replace("/view", "/preview");
    }

    return cleanUrl;
};

export default function LessonViewPage() {
    // --------------------------------------------------------------------------
    // 1. СТАН ТА НАВІГАЦІЯ
    // --------------------------------------------------------------------------
    const params = useParams();
    const router = useRouter();
    const lessonId = params.id as string;

    const [material, setMaterial] = useState<MaterialDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [parsedData, setParsedData] = useState<ParsedLessonData>({});

    // --------------------------------------------------------------------------
    // 2. ЗАВАНТАЖЕННЯ ТА БЕЗПЕЧНИЙ ПАРСИНГ ДАНИХ УРОКУ
    // --------------------------------------------------------------------------
    useEffect(() => {
        if (!lessonId) return;

        async function fetchLesson() {
            try {
                const res = await fetch(`/api/teacher/materials/${lessonId}`);
                if (res.ok) {
                    const data: MaterialDetails = await res.json();
                    setMaterial(data);

                    // Безпечна спроба розпарсити JSON-контент уроку
                    try {
                        const parsed = JSON.parse(data.content);
                        // Перевіряємо, що результатом парсингу є саме об'єкт, а не число чи стрічка
                        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
                            setParsedData(parsed);
                        } else {
                            // Фолбек, якщо розпарсився не об'єкт
                            setParsedData({ blocks: [{ id: "1", type: "text", content: String(data.content) }] });
                        }
                    } catch (e) {
                        // Фолбек: якщо контент збережено як простий текст (legacy)
                        setParsedData({ blocks: [{ id: "1", type: "text", content: data.content }] });
                    }
                }
            } catch (err) {
                console.error("Помилка завантаження уроку:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchLesson();
    }, [lessonId]);

    // --------------------------------------------------------------------------
    // 3. ВСПОМОМІЖНІ ФУНКЦІЇ РЕНДЕРИНГУ ВІДЕО/ІНТЕРАКТИВУ
    // --------------------------------------------------------------------------
    /**
     * Рендерить YouTube-плеєр або інтерактивне посилання залежно від домену URL.
     */
    const renderVideoEmbed = (url: string) => {
        if (url.includes("youtube.com") || url.includes("youtu.be")) {
            const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
            const match = url.match(regExp);
            const videoId = match && match[2].length === 11 ? match[2] : null;

            if (videoId) {
                return (
                    <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-md border border-slate-200 my-4">
                        <iframe
                            className="w-full h-full"
                            src={`https://www.youtube.com/embed/${videoId}`}
                            title="YouTube video player"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    </div>
                );
            }
        }

        // Блок для інших типів посилань (Google Drive / Vascak / Симуляції)
        return (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl my-4 text-sm font-semibold flex items-center justify-between">
                <span>🔗 Інтерактивний вміст / Відео посилання:</span>
                <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline bg-white px-3 py-1.5 rounded-lg border border-blue-200"
                >
                    Відкрити матеріали ↗
                </a>
            </div>
        );
    };

    // --------------------------------------------------------------------------
    // 4. ОБРОБКА СТАНІВ ЗАВАНТАЖЕННЯ ТА ПОМИЛОК
    // --------------------------------------------------------------------------
    if (loading) {
        return (
            <div className="min-h-screen flex flex-col bg-slate-50">
                <div className="flex-grow flex items-center justify-center text-slate-500 font-medium">
                    Завантаження вмісту уроку...
                </div>
            </div>
        );
    }

    if (!material) {
        return (
            <div className="min-h-screen flex flex-col bg-slate-50">
                <div className="flex-grow flex flex-col items-center justify-center text-slate-500 gap-4">
                    <p className="text-lg font-bold">Урок не знайдено</p>
                    <Link href="/teacher" className="text-blue-600 font-semibold hover:underline">
                        ← Повернутися у кабінет
                    </Link>
                </div>
            </div>
        );
    }

    // --------------------------------------------------------------------------
    // 5. ГОЛОВНИЙ РЕНДЕР СТОРІНКИ
    // --------------------------------------------------------------------------
    return (
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">

            <main className="flex-grow max-w-4xl w-full mx-auto px-4 py-8 space-y-6">
                {/* Верхня панель управління */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <Link
                        href="/teacher"
                        className="text-slate-600 hover:text-slate-900 text-sm font-semibold flex items-center gap-1.5"
                    >
                        <span>←</span> До списку уроків
                    </Link>

                    {/* Кнопка переходу в режим редагування */}
                    <div className="flex items-center gap-2">
                        <Link
                            href={`/teacher/lessons/${material.id}/edit`}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition flex items-center gap-1.5"
                        >
                            <span>✏️</span>
                            <span>Редагувати урок</span>
                        </Link>
                    </div>
                </div>

                {/* Основна картка матеріалу */}
                <article className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">

                    {/* Метадані матеріалу (Предмет, Клас, Розділ) */}
                    <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="font-bold px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-800">
                                📖 Урок
                            </span>
                            {material.subject && (
                                <span className="bg-slate-100 font-semibold text-slate-700 px-2.5 py-0.5 rounded-md">
                                    {material.subject.title}
                                </span>
                            )}
                            {material.assignments?.[0]?.class && (
                                <span className="bg-indigo-50 font-semibold text-indigo-700 px-2.5 py-0.5 rounded-md">
                                    Клас: {material.assignments[0].class.name}
                                </span>
                            )}
                            <span className="bg-amber-50 font-semibold text-amber-800 px-2.5 py-0.5 rounded-md">
                                Розділ: {material.topic ? material.topic.title : "Без розділу"}
                            </span>
                        </div>

                        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight">
                            {material.title}
                        </h1>
                    </div>

                    {/* Блок цілей та завдань уроку */}
                    {parsedData.objectives && (
                        <div className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-2xl text-amber-900 text-sm space-y-1">
                            <span className="font-bold text-xs uppercase tracking-wider text-amber-800 block">
                                🎯 Цілі та задачі уроку:
                            </span>
                            <p className="whitespace-pre-line leading-relaxed">
                                {parsedData.objectives}
                            </p>
                        </div>
                    )}

                    <hr className="border-slate-100" />

                    {/* Блоки контенту (Динамічний відображач матеріалу) */}
                    <div className="space-y-6">
                        {parsedData.blocks?.map((block) => (
                            <div key={block.id} className="space-y-2">

                                {/* 1. Текстовий блок */}
                                {block.type === "text" && block.content && (
                                    <div className="prose prose-slate max-w-none text-slate-700 whitespace-pre-line leading-relaxed text-base">
                                        {block.content}
                                    </div>
                                )}

                                {/* 2. Зображення */}
                                {block.type === "image" && block.content && (
                                    <div className="my-4">
                                        <img
                                            src={block.content}
                                            alt="Ілюстрація до уроку"
                                            className="w-full max-h-[500px] object-contain rounded-2xl border border-slate-200 shadow-sm"
                                        />
                                    </div>
                                )}

                                {/* 3. Відеоконтент */}
                                {(block.type === "video" || block.type === "embed") && block.content && (
                                    renderVideoEmbed(block.content)
                                )}

                                {/* 4. Презентація Google Slides */}
                                {block.type === "presentation" && block.content && (
                                    <div className="my-4 relative aspect-[16/9] w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 shadow-md">
                                        <iframe
                                            src={getEmbedPresentationUrl(block.content) || block.content}
                                            className="w-full h-full border-0"
                                            allowFullScreen
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Блок домашнього завдання */}
                    {parsedData.homework && (
                        <div className="mt-8 pt-6 border-t border-slate-200">
                            <div className="p-5 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-sm text-indigo-950 flex items-center gap-1.5">
                                        <span>📝</span> Домашнє завдання
                                    </span>
                                    {material.assignments?.[0]?.deadline && (
                                        <span className="text-xs font-semibold bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-lg">
                                            Дедлайн: {new Date(material.assignments[0].deadline).toLocaleDateString("uk-UA")}
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-indigo-900 whitespace-pre-line leading-relaxed">
                                    {parsedData.homework}
                                </p>
                            </div>
                        </div>
                    )}
                </article>
            </main>
        </div>
    );
}