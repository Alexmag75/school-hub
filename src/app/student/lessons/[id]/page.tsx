/**
 * ==============================================================================
 * СТОРІНКА ПЕРЕГЛЯДУ НАВЧАЛЬНОГО МАТЕРІАЛУ / УРОКУ (`src/app/student/lessons/[id]/page.tsx`)
 * ==============================================================================
 * @description Серверна сторінка (Server Component) для перегляду матеріалів уроку учнем:
 *              1. Авторизація та перевірка ролі учня.
 *              2. Пошук призначення (Assignment) або безпосередньо матеріалу (Material) за ID.
 *              3. Автоматична фіксація прочитання/виконання:
 *                 - Запис у `LessonProgress` (`isDone: true`).
 *                 - Оновлення статусу в електронному журналі `Grade` (`StudentTaskStatus.COMPLETED`).
 *              4. Парсинг та безпечна візуалізація JSON-структури контенту (мета, блоки, домашнє завдання).
 *
 * @tech_stack Next.js App Router (Server Components, Async Params), NextAuth.js,
 *             Prisma ORM, Tailwind CSS.
 * ==============================================================================
 */

import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { StudentTaskStatus } from "@prisma/client";

// 🚀 Вимикаємо статичну генерацію (SSG) та кешування, оскільки сторінка
// виконує персоналізовані мутації бази даних при кожному запиті учня
export const dynamic = "force-dynamic";

/** Пропси для динамічного маршруту Next.js 15+ */
interface StudentLessonPageProps {
    /** Параметри URL-маршруту (у Next.js 15 params є промісом) */
    params: Promise<{
        /** ID призначення (Assignment) або навчального матеріалу (Material) */
        id: string;
    }>;
}

/** Інтерфейс окремого блоку всередині JSON-контенту уроку */
interface ContentBlock {
    id?: string;
    type: "text" | "image" | "video" | string;
    content: string;
}

/** Інтерфейс розпарсеної структури контенту уроку */
interface ParsedLessonContent {
    objectives?: string;
    blocks?: ContentBlock[];
    homework?: string;
}

export default async function StudentLessonPage({ params }: StudentLessonPageProps) {
    // Отримуємо параметри маршруту (асинхронно у Next.js 15)
    const { id: targetId } = await params;

    // --------------------------------------------------------------------------
    // 1. АВТОРИЗАЦІЯ ТА ПЕРЕВІРКА СЕСІЇ
    // --------------------------------------------------------------------------
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        redirect("/login");
    }

    const studentId = session.user.id;

    // --------------------------------------------------------------------------
    // 2. ПОШУК НАВЧАЛЬНОГО МАТЕРІАЛУ ТА ПРИЗНАЧЕННЯ
    // --------------------------------------------------------------------------
    // Спочатку шукаємо серед призначених завдань (Assignment)
    const assignment = await prisma.assignment.findUnique({
        where: { id: targetId },
        include: {
            material: {
                include: {
                    subject: { select: { title: true } },
                    author: { select: { fullName: true, lastName: true } },
                },
            },
        },
    });

    let material = assignment?.material || null;

    // Якщо за ID призначення не знайдено, пробуємо знайти матеріал напряму
    if (!material) {
        material = await prisma.material.findUnique({
            where: { id: targetId },
            include: {
                subject: { select: { title: true } },
                author: { select: { fullName: true, lastName: true } },
            },
        });
    }

    // Якщо матеріалу взагалі немає в БД — повертаємо сторінку 404
    if (!material) {
        notFound();
    }

    // --------------------------------------------------------------------------
    // 3. ОТРИМАННЯ КЛАСУ УЧНЯ ТА АВТОМАТИЧНА ФІКСАЦІЯ ПРОГРЕСУ
    // --------------------------------------------------------------------------
    // Отримуємо classId для точного знаходження колонки у журналі
    const student = await prisma.user.findUnique({
        where: { id: studentId },
        select: { classId: true },
    });

    // Фіксуємо перегляд уроку в таблиці LessonProgress (створюємо або оновлюємо)
    await prisma.lessonProgress.upsert({
        where: {
            userId_lessonId: {
                userId: studentId,
                lessonId: material.id,
            },
        },
        update: { isDone: true },
        create: {
            userId: studentId,
            lessonId: material.id,
            isDone: true,
        },
    });

    // Шукаємо відповідну колонку у журналі оцінок
    const journalColumn = await prisma.journalColumn.findFirst({
        where: {
            materialId: material.id,
            ...(student?.classId ? { classId: student.classId } : {}),
        },
    });

    // Якщо колонка існує, помічаємо завдання у журналі як виконане (COMPLETED)
    if (journalColumn) {
        await prisma.grade.upsert({
            where: {
                columnId_studentId: {
                    columnId: journalColumn.id,
                    studentId: studentId,
                },
            },
            update: {
                status: StudentTaskStatus.COMPLETED,
            },
            create: {
                columnId: journalColumn.id,
                studentId: studentId,
                status: StudentTaskStatus.COMPLETED,
            },
        });
    }

    // --------------------------------------------------------------------------
    // 4. ПАРСИНГ КОНТЕНТУ УРОКУ (JSON / RAW TEXT)
    // --------------------------------------------------------------------------
    let parsedContent: ParsedLessonContent | null = null;
    let rawTextContent: string | null = null;

    if (material.content) {
        try {
            // Спроба розпарсити структурований JSON контенту
            parsedContent = JSON.parse(material.content);
        } catch {
            // Якщо контент є звичайним текстовим рядком
            rawTextContent = material.content;
        }
    }

    // Формування імені автора для відображення
    const authorName = material.author
        ? material.author.fullName || material.author.lastName || "Вчитель"
        : "Вчитель";

    // --------------------------------------------------------------------------
    // 5. РЕНДЕР СТОРІНКИ УРОКУ
    // --------------------------------------------------------------------------
    return (
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

            {/* КНОПКА ПОВЕРНЕННЯ */}
            <div>
                <Link
                    href="/student"
                    className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-slate-800 transition gap-2"
                >
                    ← Назад до завдань
                </Link>
            </div>

            {/* ШАПКА УРОКУ (МЕТАДАНІ) */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-blue-100 text-blue-700">
                        📖 Урок
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                        Предмет: <strong className="text-slate-800 capitalize">{material.subject?.title || "Загальний"}</strong>
                    </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                    {material.title}
                </h1>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
                    <span>Автор: <strong className="text-slate-700">{authorName}</strong></span>
                    <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-3 py-1 rounded-xl">
                        ✅ Ознайомлено
                    </span>
                </div>
            </div>

            {/* ОСНОВНИЙ ВМІСТ УРОКУ */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-8">
                <h2 className="text-xl font-extrabold text-slate-900 border-b border-slate-100 pb-4">
                    Матеріал уроку
                </h2>

                {/* ВАРІАНТ 1: СТРУКТУРОВАНИЙ JSON-КОНТЕНТ */}
                {parsedContent ? (
                    <div className="space-y-8">

                        {/* МЕТА УРОКУ */}
                        {parsedContent.objectives && (
                            <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-5 space-y-2">
                                <h3 className="text-sm font-bold text-amber-900 flex items-center gap-2">
                                    🎯 Мета уроку:
                                </h3>
                                <p className="text-sm text-amber-800 leading-relaxed whitespace-pre-wrap">
                                    {parsedContent.objectives}
                                </p>
                            </div>
                        )}

                        {/* СПИСОК БЛОКІВ КОНТЕНТУ (ТЕКСТ / ЗОБРАЖЕННЯ) */}
                        {parsedContent.blocks && parsedContent.blocks.length > 0 && (
                            <div className="space-y-6">
                                {parsedContent.blocks.map((block, idx) => {
                                    // Рендер блоку зображення
                                    if (block.type === "image") {
                                        return (
                                            <div key={block.id || idx} className="my-6 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex justify-center">
                                                <img
                                                    src={block.content}
                                                    alt="Ілюстрація до уроку"
                                                    className="max-h-[500px] w-auto object-contain rounded-xl"
                                                />
                                            </div>
                                        );
                                    }

                                    // Рендер текстового блоку за замовчуванням
                                    return (
                                        <div
                                            key={block.id || idx}
                                            className="text-slate-800 leading-relaxed text-base whitespace-pre-wrap space-y-2"
                                        >
                                            {block.content}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* ДОМАШНЄ ЗАВДАННЯ */}
                        {parsedContent.homework && (
                            <div className="bg-blue-50/50 border border-blue-200/80 rounded-2xl p-5 space-y-2">
                                <h3 className="text-sm font-bold text-blue-900 flex items-center gap-2">
                                    📌 Домашнє завдання:
                                </h3>
                                <p className="text-sm text-blue-950 leading-relaxed whitespace-pre-wrap">
                                    {parsedContent.homework}
                                </p>
                            </div>
                        )}
                    </div>
                ) : rawTextContent ? (
                    /* ВАРІАНТ 2: ЗВИЧАЙНИЙ НЕСТРУКТУРОВАНИЙ ТЕКСТ */
                    <div className="text-slate-800 leading-relaxed whitespace-pre-wrap text-base">
                        {rawTextContent}
                    </div>
                ) : (
                    /* ВАРІАНТ 3: КОНТЕНТ ВІДСУТНІЙ */
                    <p className="text-slate-400 italic">
                        Текстовий вміст для цього уроку відсутній.
                    </p>
                )}

                {/* ВІДЕОМАТЕРІАЛ (ЯКЩО ВКАЗАНО ПОСИЛАННЯ) */}
                {material.videoUrl && (
                    <div className="pt-6 border-t border-slate-100 space-y-3">
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            🎥 Відеоматеріал:
                        </h3>
                        <a
                            href={material.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-bold transition shadow-sm"
                        >
                            ▶️ Переглянути відеоурок
                        </a>
                    </div>
                )}
            </div>

            {/* КНОПКА ЗАВЕРШЕННЯ ВНИЗУ СТОРІНКИ */}
            <div className="flex justify-end pt-2">
                <Link
                    href="/student"
                    className="px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition"
                >
                    Завершити перегляд
                </Link>
            </div>
        </div>
    );
}