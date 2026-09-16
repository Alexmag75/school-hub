"use client";

import { useEffect, useState } from "react";
import { Newspaper, ChevronLeft, ChevronRight, Calendar, Search, Filter, RotateCcw } from "lucide-react";
import NewsModal, { NewsItem } from "@/components/news/NewsModal";

const ITEMS_PER_PAGE = 9;

interface SubjectOption {
    id: string;
    title: string;
}

interface TeacherOption {
    id: string;
    fullName: string;
}

export default function NewsPage() {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [page, setPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [loading, setLoading] = useState(true);
    const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

    // Стан для фільтрів
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [selectedSubject, setSelectedSubject] = useState("");
    const [selectedTeacher, setSelectedTeacher] = useState("");

    // Списки предметів та вчителів для фільтрів
    const [subjects, setSubjects] = useState<SubjectOption[]>([]);
    const [teachers, setTeachers] = useState<TeacherOption[]>([]);

    // 1. Debounce для рядка пошуку (затримка 400мс)
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPage(1); // Скидаємо на 1 сторінку при зміні пошуку
        }, 400);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    useEffect(() => {
        async function fetchFilterData() {
            try {
                const [resSub, resTeach] = await Promise.all([
                    fetch("/api/subjects?all=true"),
                    fetch("/api/teacher"), // Використовуємо новий роут
                ]);

                if (resSub.ok) {
                    const data = await resSub.json();
                    setSubjects(Array.isArray(data) ? data : data.subjects || []);
                }

                if (resTeach.ok) {
                    const data = await resTeach.json();
                    setTeachers(Array.isArray(data) ? data : []);
                }
            } catch (err) {
                console.error("Помилка завантаження фільтрів:", err);
            }
        }
        fetchFilterData();
    }, []);

    // 3. Завантаження новин з урахуванням пагінації, пошуку та фільтрів
    useEffect(() => {
        async function fetchNews() {
            setLoading(true);
            try {
                const params = new URLSearchParams({
                    page: page.toString(),
                    limit: ITEMS_PER_PAGE.toString(),
                });

                if (debouncedSearch) params.append("search", debouncedSearch);
                if (selectedSubject) params.append("subjectId", selectedSubject);
                if (selectedTeacher) params.append("teacherId", selectedTeacher);

                const res = await fetch(`/api/news?${params.toString()}`);
                if (res.ok) {
                    const data = await res.json();
                    setNews(data.news || []);
                    setTotalPages(data.pagination?.totalPages || 1);
                }
            } catch (err) {
                console.error("Помилка завантаження новин:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchNews();
    }, [page, debouncedSearch, selectedSubject, selectedTeacher]);

    // Скидання всіх фільтрів
    const handleResetFilters = () => {
        setSearchQuery("");
        setDebouncedSearch("");
        setSelectedSubject("");
        setSelectedTeacher("");
        setPage(1);
    };

    const hasActiveFilters = Boolean(searchQuery || selectedSubject || selectedTeacher);

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans">
            <main className="flex-grow max-w-6xl w-full mx-auto px-4 py-8 space-y-6">

                {/* Заголовок сторінки */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <Newspaper className="w-7 h-7 text-blue-600" />
                            Шкільні новини та події
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">
                            Будьте в курсі всіх актуальних новин та важливих оголошень
                        </p>
                    </div>
                </div>

                {/* БЛОК ПОШУКУ ТА ФІЛЬТРІВ */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">

                        {/* Пошуковий інпут */}
                        <div className="relative md:col-span-2">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Пошук новин за заголовком або текстом..."
                                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                            />
                        </div>

                        {/* Фільтр за предметом */}
                        <div className="relative">
                            <select
                                value={selectedSubject}
                                onChange={(e) => {
                                    setSelectedSubject(e.target.value);
                                    setPage(1);
                                }}
                                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-slate-700"
                            >
                                <option value="">Усі предмети</option>
                                {subjects.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.title}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Фільтр за вчителем */}
                        <div className="relative">
                            <select
                                value={selectedTeacher}
                                onChange={(e) => {
                                    setSelectedTeacher(e.target.value);
                                    setPage(1);
                                }}
                                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition text-slate-700"
                            >
                                <option value="">Усі вчителі</option>
                                {teachers.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.fullName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Кнопка скидання фільтрів */}
                    {hasActiveFilters && (
                        <div className="flex justify-end pt-1">
                            <button
                                type="button"
                                onClick={handleResetFilters}
                                className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition inline-flex items-center gap-1.5"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Скинути фільтри
                            </button>
                        </div>
                    )}
                </div>

                {/* СПИСОК НОВИН */}
                {loading ? (
                    <div className="p-8 text-center text-slate-400 font-medium bg-white rounded-2xl border">
                        Завантаження новин...
                    </div>
                ) : news.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 font-medium bg-white rounded-2xl border space-y-2">
                        <p>За вашим запитом новин не знайдено</p>
                        {hasActiveFilters && (
                            <button
                                onClick={handleResetFilters}
                                className="text-xs text-blue-600 hover:underline font-semibold"
                            >
                                Скинути фільтри пошуку
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {news.map((item) => {
                                const firstImageUrl = item.imageUrl
                                    ? item.imageUrl.split(",")[0]?.trim()
                                    : null;

                                const cleanContent = item.content
                                    ? item.content.replace(/!\[.*?\]\(.*?\)/g, "").trim()
                                    : "";

                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => setSelectedNews(item)}
                                        className="group bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-blue-300 transition cursor-pointer flex flex-col justify-between"
                                    >
                                        <div className="space-y-3">
                                            {firstImageUrl && (
                                                <div className="h-44 rounded-xl overflow-hidden bg-slate-50 border border-slate-100">
                                                    <img
                                                        src={firstImageUrl}
                                                        alt={item.title}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                                        onError={(e) => {
                                                            const container = (e.target as HTMLElement).parentElement;
                                                            if (container) container.style.display = "none";
                                                        }}
                                                    />
                                                </div>
                                            )}
                                            <span className="flex items-center gap-1.5 text-xs text-slate-400">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {new Date(item.createdAt).toLocaleDateString("uk-UA")}
                                            </span>
                                            <h2 className="font-bold text-slate-800 text-base line-clamp-2 group-hover:text-blue-600 transition">
                                                {item.title}
                                            </h2>
                                            <p className="text-xs text-slate-500 line-clamp-3">
                                                {cleanContent}
                                            </p>
                                        </div>

                                        <button className="mt-4 text-xs font-semibold text-blue-600 group-hover:underline text-left">
                                            Читати повністю ➔
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Пагінація */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-3 pt-4">
                                <button
                                    disabled={page === 1}
                                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                                    className="p-2 rounded-xl border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-100 transition"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="text-xs font-semibold text-slate-600">
                                    Сторінка {page} з {totalPages}
                                </span>
                                <button
                                    disabled={page === totalPages}
                                    onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                                    className="p-2 rounded-xl border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-100 transition"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </>
                )}

                <NewsModal news={selectedNews} onClose={() => setSelectedNews(null)} />
            </main>
        </div>
    );
}