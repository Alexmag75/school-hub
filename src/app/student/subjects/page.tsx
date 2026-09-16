/**
 * ==============================================================================
 * СТОРІНКА НАВЧАЛЬНИХ ПРЕДМЕТІВ УЧНЯ (`src/app/student/subjects/page.tsx`)
 * ==============================================================================
 * @description Серверний компонент (React Server Component) для відображення
 *              переліку доступних предметів у кабінеті студента.
 *
 * Основні функції:
 *  1. Серверна перевірка автентифікації сесії (NextAuth).
 *  2. Прямий запит до бази даних Prisma для отримання списку предметів та
 *     агрегованого підрахунку матеріалів/підручників (`_count`).
 *  3. Рендеринг сітки предметів із підрахунком контенту та обробкою порожнього стану.
 *
 * @tech_stack Next.js App Router (RSC), Prisma ORM, NextAuth.js, Tailwind CSS.
 * ==============================================================================
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { BookOpen, Layers } from "lucide-react";

export default async function StudentSubjectsPage() {
    // --------------------------------------------------------------------------
    // 1. АВТЕНТИФІКАЦІЯ ТА ДОСТУП
    // --------------------------------------------------------------------------
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        redirect("/login");
    }

    // --------------------------------------------------------------------------
    // 2. ОТРИМАННЯ ДАНИХ З БАЗИ (PRISMA)
    // --------------------------------------------------------------------------
    /**
     * Отримуємо список усіх предметів, відсортованих за назвою (A-Z / А-Я).
     * `_count` повертає кількість пов'язаних підручників та навчальних матеріалів.
     */
    const subjects = await prisma.subject.findMany({
        select: {
            id: true,
            title: true,
            _count: {
                select: {
                    textbooks: true,
                    materials: true,
                },
            },
        },
        orderBy: { title: "asc" },
    });

    // --------------------------------------------------------------------------
    // 3. РЕНДЕРИНГ ІНТЕРФЕЙСУ
    // --------------------------------------------------------------------------
    return (
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
            {/* Заголовок сторінки */}
            <header className="space-y-1">
                <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                    <span>📚</span> Навчальні предмети
                </h1>
                <p className="text-sm text-slate-500">
                    Оберіть предмет для перегляду матеріалів, підручників та архіву оцінок
                </p>
            </header>

            {/* Обробка порожнього стану (якщо предмети відсутні) */}
            {subjects.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200/80 p-8 text-center space-y-3">
                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
                        <Layers className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-slate-800">Предмети поки не додані</h3>
                    <p className="text-sm text-slate-500 max-w-md mx-auto">
                        Наразі у вашому навчальному закладі немає активних предметів. Зверніться до адміністратора.
                    </p>
                </div>
            ) : (
                /* Сітка картка предметів */
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                    {subjects.map((subject) => {
                        /** Загальна кількість доступних матеріалів (підручники + матеріали) */
                        const totalMaterials = (subject._count.materials || 0) + (subject._count.textbooks || 0);

                        return (
                            <Link
                                key={subject.id}
                                href={`/student/subjects/${subject.id}`}
                                className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-blue-300 transition flex flex-col justify-between space-y-4 group"
                            >
                                <div className="space-y-3">
                                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center transition group-hover:bg-blue-600 group-hover:text-white">
                                        <BookOpen className="w-5 h-5" />
                                    </div>
                                    <h2 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition">
                                        {subject.title}
                                    </h2>
                                </div>

                                {/* Нижня панель з кількістю матеріалів та підказкою */}
                                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold">
                                    <span>{totalMaterials} матеріалів</span>
                                    <span className="text-blue-600 font-bold group-hover:translate-x-0.5 transition-transform">
                                        Переглянути →
                                    </span>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}