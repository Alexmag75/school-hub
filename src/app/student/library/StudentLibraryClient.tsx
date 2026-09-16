/**
 * ==============================================================================
 * КЛІЄНТСЬКИЙ КОМПОНЕНТ БІБЛІОТЕКИ (`src/app/student/library/StudentLibraryClient.tsx`)
 * ==============================================================================
 * @description Клієнтський компонент (Client Component) для взаємодії учня з матеріалами:
 *              1. Динамічний пошук за назвою книги або автором.
 *              2. Фільтрація за навчальними предметами.
 *              3. Фільтрація за категоріями (підручники, збірники, довідники тощо).
 *              4. Оптимізований перерахунок фільтрованого списку через `useMemo`.
 *              5. Відображення карток матеріалів з можливістю відкриття/завантаження.
 *
 * @tech_stack React (useState, useMemo), Next.js (Link), Tailwind CSS.
 * ==============================================================================
 */

"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

/** Інтерфейс об'єкта книги/підручника */
interface BookItem {
    id: string;
    title: string;
    author: string | null;
    category: string;
    fileUrl: string;
    description: string | null;
    subjectId: string;
    subjectName: string;
}

/** Інтерфейс об'єкта предмета */
interface SubjectItem {
    id: string;
    title: string;
}

/** Вхідні пропси для клієнтського компонента */
interface Props {
    books: BookItem[];
    subjects: SubjectItem[];
}

/** Словник звідності категорій: людиночитана назва та іконка */
const CATEGORY_LABELS: Record<string, { label: string; icon: string }> = {
    TEXTBOOK: { label: "Офіційні підручники", icon: "📘" },
    PROBLEM_BOOK: { label: "Збірники задач / Вправи", icon: "📙" },
    DICTIONARY: { label: "Словники / Довідники", icon: "📕" },
    OLYMPIAD: { label: "Олімпіадні матеріали", icon: "🏆" },
    PUZZLE: { label: "Цікаві задачі", icon: "🧩" },
    OTHER: { label: "Допоміжні матеріали", icon: "📁" },
};

export default function StudentLibraryClient({ books, subjects }: Props) {
    // --------------------------------------------------------------------------
    // СТАН ФІЛЬТРІВ ТА ПОШУКУ
    // --------------------------------------------------------------------------
    /** Текст пошукового запиту */
    const [searchQuery, setSearchQuery] = useState("");
    /** Обраний ID предмета ("ALL" - усі предмети) */
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>("ALL");
    /** Обрана категорія матеріалу ("ALL" - усі категорії) */
    const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

    // --------------------------------------------------------------------------
    // МЕМОЇЗОВАНА ФІЛЬТРАЦІЯ СПИСКУ КНИГ
    // --------------------------------------------------------------------------
    // Перераховується тільки при зміні вхідного списку книг або параметрів фільтрації
    const filteredBooks = useMemo(() => {
        return books.filter((book) => {
            // 1. Фільтрація за пошуковим рядком (пошук у назві або імені автора)
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                const matchTitle = book.title.toLowerCase().includes(query);
                const matchAuthor = book.author?.toLowerCase().includes(query) || false;
                if (!matchTitle && !matchAuthor) return false;
            }

            // 2. Фільтрація за обраним навчальним предметом
            if (selectedSubjectId !== "ALL" && book.subjectId !== selectedSubjectId) {
                return false;
            }

            // 3. Фільтрація за обраною категорією матеріалу
            if (selectedCategory !== "ALL" && book.category !== selectedCategory) {
                return false;
            }

            return true;
        });
    }, [books, searchQuery, selectedSubjectId, selectedCategory]);

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
            {/* ШАПКА САЙТУ */}
            <Header />

            <main className="flex-grow max-w-[1400px] w-full mx-auto px-4 py-8 space-y-6">

                {/* ---------------------------------------------------------------------- */}
                {/* ЗАГОЛОВОК СТОРІНКИ ТА КУНТЕР ЗНАЙДЕНИХ МАТЕРІАЛІВ */}
                {/* ---------------------------------------------------------------------- */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <Link
                            href="/student"
                            className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-slate-800 transition gap-1 mb-1"
                        >
                            ← Назад до кабінету
                        </Link>
                        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                            <span>📚</span> Шкільна Бібліотека
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">
                            Підручники, збірники задач, довідники та додаткові матеріали для вашого навчання
                        </p>
                    </div>

                    <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-2xl text-xs font-bold border border-blue-100 shrink-0">
                        Знайдено матеріалів: {filteredBooks.length}
                    </div>
                </div>

                {/* ---------------------------------------------------------------------- */}
                {/* БЛОК ІНТЕРАКТИВНОЇ ФІЛЬТРАЦІЇ ТА ПОШУКУ */}
                {/* ---------------------------------------------------------------------- */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

                        {/* ПОЛЕ ПОШУКУ */}
                        <div className="relative md:col-span-1">
                            <span className="absolute left-3.5 top-2.5 text-slate-400">🔍</span>
                            <input
                                type="text"
                                placeholder="Пошук за назвою або автором..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                            />
                        </div>

                        {/* ВИНАДНЕ МЕНЮ: ПРЕДМЕТИ */}
                        <div>
                            <select
                                value={selectedSubjectId}
                                onChange={(e) => setSelectedSubjectId(e.target.value)}
                                className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-800 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="ALL">🌐 Усі предмети</option>
                                {subjects.map((sub) => (
                                    <option key={sub.id} value={sub.id}>
                                        {sub.title}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* ВИПАДНЕ МЕНЮ: КАТЕГОРІЇ */}
                        <div>
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-800 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="ALL">📁 Усі категорії</option>
                                {Object.entries(CATEGORY_LABELS).map(([key, item]) => (
                                    <option key={key} value={key}>
                                        {item.icon} {item.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* КНОПКА СКИДАННЯ АКТИВНИХ ФІЛЬТРІВ */}
                    {(searchQuery || selectedSubjectId !== "ALL" || selectedCategory !== "ALL") && (
                        <div className="flex justify-end pt-1">
                            <button
                                onClick={() => {
                                    setSearchQuery("");
                                    setSelectedSubjectId("ALL");
                                    setSelectedCategory("ALL");
                                }}
                                className="text-xs font-bold text-rose-600 hover:text-rose-800 bg-rose-50 px-3 py-1.5 rounded-xl transition"
                            >
                                ✕ Скинути фільтри
                            </button>
                        </div>
                    )}
                </div>

                {/* ---------------------------------------------------------------------- */}
                {/* СІТКА КАРТОК ПІДРУЧНИКІВ / ПОРОЖНІЙ СТАН */}
                {/* ---------------------------------------------------------------------- */}
                {filteredBooks.length === 0 ? (
                    <div className="bg-white p-12 rounded-3xl border border-slate-200/80 text-center space-y-3 shadow-inner">
                        <div className="text-3xl">🔎</div>
                        <p className="text-slate-500 font-medium text-sm">
                            Матеріалів за вашим запитом не знайдено
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredBooks.map((book) => {
                            // Визначення назви та іконки категорії
                            const catInfo = CATEGORY_LABELS[book.category] || { label: book.category, icon: "📄" };

                            return (
                                <div
                                    key={book.id}
                                    className="bg-white p-5 rounded-3xl border border-slate-200/80 hover:border-blue-300 transition-all shadow-sm hover:shadow flex flex-col justify-between space-y-4"
                                >
                                    <div className="space-y-2">
                                        {/* БЕДЖІ ПРЕДМЕТА ТА КАТЕГОРІЇ */}
                                        <div className="flex items-center justify-between gap-2 flex-wrap">
                                            <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 uppercase tracking-wide">
                                                {book.subjectName}
                                            </span>
                                            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                                                <span>{catInfo.icon}</span>
                                                <span>{catInfo.label}</span>
                                            </span>
                                        </div>

                                        {/* НАЗВА КНИГИ */}
                                        <h3 className="font-extrabold text-slate-900 text-base leading-snug">
                                            {book.title}
                                        </h3>

                                        {/* АВТОР */}
                                        {book.author && (
                                            <p className="text-xs text-slate-500 font-medium">
                                                Автор: <span className="text-slate-700">{book.author}</span>
                                            </p>
                                        )}

                                        {/* ОПИС КНИГИ */}
                                        {book.description && (
                                            <p className="text-xs text-slate-600 line-clamp-3 bg-slate-50 p-3 rounded-xl border border-slate-100 mt-2">
                                                {book.description}
                                            </p>
                                        )}
                                    </div>

                                    {/* ПОСИЛАННЯ НА ВІДКРИТТЯ / ЗАВАНТАЖЕННЯ МАТЕРІАЛУ */}
                                    <div className="pt-3 border-t border-slate-100">
                                        <a
                                            href={book.fileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-1.5"
                                        >
                                            <span>🔗</span> Відкрити матеріал
                                        </a>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* ПІДВАЛ САЙТУ */}
            <Footer />
        </div>
    );
}