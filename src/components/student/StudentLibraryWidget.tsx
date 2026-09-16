/**
 * ==============================================================================
 * ВІДЖЕТ ЕЛЕКТРОННОЇ БІБЛІОТЕКИ (`src/components/student/StudentLibraryWidget.tsx`)
 * ==============================================================================
 * @description Клієнтський компонент вітрини підручників та навчальних матеріалів
 *              для кабінету учня. Забезпечує:
 *              1. Відображення списку перших трьох доступних книг із фільтрацією.
 *              2. Швидкий перехід до перегляду або завантаження файлу підручника в
 *                 нову вкладку (`target="_blank"`).
 *              3. Кнопку для переходу до повної бібліотеки навчальних матеріалів.
 * ==============================================================================
 */

"use client";

import React from "react";

export interface Book {
    id: string;
    title: string;
    subject: string;
    category?: string;
    fileUrl: string;
}

interface StudentLibraryWidgetProps {
    books?: Book[];
    onViewAll?: () => void;
}

export default function StudentLibraryWidget({
                                                 books = [],
                                                 onViewAll,
                                             }: StudentLibraryWidgetProps) {
    // Відображаємо лише перші 3 книги у віджеті бічної панелі
    const visibleBooks = books.slice(0, 3);

    return (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            {/* Шапка віджета бібліотеки */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-lg">📚</span>
                    <h3 className="font-bold text-sm text-slate-800">Бібліотека</h3>
                </div>
                <button
                    type="button"
                    onClick={onViewAll}
                    className="text-[11px] font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded-full transition"
                >
                    Усі підручники
                </button>
            </div>

            {/* Вміст списку книг або повідомлення про відсутність матеріалів */}
            {visibleBooks.length === 0 ? (
                <div className="py-6 text-center space-y-2">
                    <div className="text-2xl">📚</div>
                    <p className="text-xs font-semibold text-slate-400">
                        Матеріали відсутні
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {visibleBooks.map((book) => (
                        <a
                            key={book.id}
                            href={book.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50/60 border border-slate-100 transition group"
                        >
                            <div className="flex items-center gap-2.5 min-w-0">
                                <span className="text-base shrink-0">📖</span>
                                <div className="min-w-0">
                                    <p className="text-xs font-bold text-slate-800 truncate group-hover:text-blue-600 transition">
                                        {book.title}
                                    </p>
                                    <p className="text-[10px] text-slate-400 font-medium truncate">
                                        {book.subject}
                                    </p>
                                </div>
                            </div>
                            <span className="text-xs text-slate-400 group-hover:text-blue-600 transition shrink-0 ml-2">
                                ↗
                            </span>
                        </a>
                    ))}

                    {books.length > 3 && (
                        <button
                            type="button"
                            onClick={onViewAll}
                            className="w-full py-2 text-center text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100/70 rounded-xl transition mt-1"
                        >
                            Показати ще ({books.length - 3})
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}