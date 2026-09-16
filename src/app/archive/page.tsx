"use client";

import { useEffect, useState, useCallback } from "react";
import { Trophy, Archive, Calendar, Search, Filter, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";

interface WinnerComment {
    id: string;
    text: string;
    author: { fullName: string };
}

interface ArchivedTask {
    id: string;
    title: string;
    description: string;
    imageUrl?: string | null;
    createdAt: string;
    subject: { title: string };
    author: { fullName: string };
    comments: WinnerComment[];
}

interface FilterOption {
    id: string;
    title?: string;
    name?: string;
    fullName?: string;
}

export default function DailyTasksArchivePage() {
    const [tasks, setTasks] = useState<ArchivedTask[]>([]);
    const [loading, setLoading] = useState(true);

    // Стан фільтрів та пагінації
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalTasks, setTotalTasks] = useState(0);

    const [search, setSearch] = useState("");
    const [subjectId, setSubjectId] = useState("");
    const [classId, setClassId] = useState("");
    const [authorId, setAuthorId] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    // Опції для select-елементів
    const [subjects, setSubjects] = useState<FilterOption[]>([]);
    const [authors, setAuthors] = useState<FilterOption[]>([]);
    const [classes, setClasses] = useState<FilterOption[]>([]);

    const fetchArchive = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: "15",
                ...(search && { search }),
                ...(subjectId && { subjectId }),
                ...(classId && { classId }),
                ...(authorId && { authorId }),
                ...(startDate && { startDate }),
                ...(endDate && { endDate }),
            });

            const res = await fetch(`/api/daily-tasks/archive?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setTasks(data.tasks);
                setTotalPages(data.pagination.totalPages);
                setTotalTasks(data.pagination.total);

                if (data.filtersData) {
                    setSubjects(data.filtersData.subjects || []);
                    setAuthors(data.filtersData.authors || []);
                    setClasses(data.filtersData.classes || []);
                }
            }
        } catch (err) {
            console.error("Помилка завантаження архіву:", err);
        } finally {
            setLoading(false);
        }
    }, [page, search, subjectId, classId, authorId, startDate, endDate]);

    useEffect(() => {
        fetchArchive();
    }, [fetchArchive]);

    const handleResetFilters = () => {
        setSearch("");
        setSubjectId("");
        setClassId("");
        setAuthorId("");
        setStartDate("");
        setEndDate("");
        setPage(1);
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
            <main className="flex-grow max-w-5xl w-full mx-auto px-4 py-8 space-y-6">
                {/* Заголовок */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <Archive className="w-7 h-7 text-amber-500" />
                            Архів «Цікавих задач»
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">
                            Завершені задачі, їх рішення та оголошені переможці ({totalTasks})
                        </p>
                    </div>
                </div>

                {/* Панель фільтрів та пошуку */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 font-semibold text-slate-700 text-sm border-b pb-3 border-slate-100">
                        <Filter className="w-4 h-4 text-slate-500" />
                        Пошук та фільтрація
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {/* Текстовий пошук */}
                        <div className="relative col-span-1 sm:col-span-2 lg:col-span-3">
                            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Пошук за назвою або описом..."
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPage(1);
                                }}
                                className="w-full pl-9 pr-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 border-slate-200"
                            />
                        </div>

                        {/* Предмет */}
                        <select
                            value={subjectId}
                            onChange={(e) => {
                                setSubjectId(e.target.value);
                                setPage(1);
                            }}
                            className="w-full p-2 border rounded-xl text-sm bg-white border-slate-200 focus:outline-none"
                        >
                            <option value="">Усі предмети</option>
                            {subjects.map((s) => (
                                <option key={s.id} value={s.id}>{s.title}</option>
                            ))}
                        </select>

                        {/* Клас */}
                        <select
                            value={classId}
                            onChange={(e) => {
                                setClassId(e.target.value);
                                setPage(1);
                            }}
                            className="w-full p-2 border rounded-xl text-sm bg-white border-slate-200 focus:outline-none"
                        >
                            <option value="">Усі класи</option>
                            {classes.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>

                        {/* Вчитель / Автор */}
                        <select
                            value={authorId}
                            onChange={(e) => {
                                setAuthorId(e.target.value);
                                setPage(1);
                            }}
                            className="w-full p-2 border rounded-xl text-sm bg-white border-slate-200 focus:outline-none"
                        >
                            <option value="">Усі вчителі</option>
                            {authors.map((a) => (
                                <option key={a.id} value={a.id}>{a.fullName}</option>
                            ))}
                        </select>

                        {/* Дата від */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400 whitespace-nowrap">Від:</span>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => {
                                    setStartDate(e.target.value);
                                    setPage(1);
                                }}
                                className="w-full p-2 border rounded-xl text-sm border-slate-200"
                            />
                        </div>

                        {/* Дата до */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400 whitespace-nowrap">До:</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => {
                                    setEndDate(e.target.value);
                                    setPage(1);
                                }}
                                className="w-full p-2 border rounded-xl text-sm border-slate-200"
                            />
                        </div>

                        {/* Скинути фільтри */}
                        <button
                            onClick={handleResetFilters}
                            className="flex items-center justify-center gap-1.5 px-4 py-2 border rounded-xl text-sm text-slate-600 hover:bg-slate-100 transition border-slate-200"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Скинути
                        </button>
                    </div>
                </div>

                {/* Список задач */}
                {loading ? (
                    <div className="p-8 text-center text-slate-400 font-medium bg-white rounded-2xl border border-slate-200">
                        Завантаження архіву...
                    </div>
                ) : tasks.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 font-medium bg-white rounded-2xl border border-slate-200">
                        За заданими критеріями задач не знайдено
                    </div>
                ) : (
                    <div className="space-y-4">
                        {tasks.map((task) => (
                            <div key={task.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 rounded-full">
                                            {task.subject.title}
                                        </span>
                                        {task.author?.fullName && (
                                            <span className="text-xs text-slate-500">
                                                Автор: {task.author.fullName}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {new Date(task.createdAt).toLocaleDateString("uk-UA")}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-lg font-bold text-slate-800">{task.title}</h3>
                                    <p className="text-sm text-slate-600 whitespace-pre-line">{task.description}</p>
                                </div>

                                {task.imageUrl && (
                                    <div className="max-w-md rounded-xl overflow-hidden border border-slate-200">
                                        <img src={task.imageUrl} alt={task.title} className="w-full object-cover" />
                                    </div>
                                )}

                                {/* Блок переможця */}
                                {task.comments && task.comments.length > 0 ? (
                                    <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-xl space-y-1.5">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                                            <Trophy className="w-4 h-4 text-amber-600" />
                                            Переможець: {task.comments[0].author.fullName}
                                        </div>
                                        <p className="text-xs text-amber-950 italic">«{task.comments[0].text}»</p>
                                    </div>
                                ) : (
                                    <div className="text-xs text-slate-400 italic">Переможця в цій задачі не було визначено.</div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Елемент пагінації */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-sm">
                        <span className="text-xs text-slate-500">
                            Сторінка {page} з {totalPages}
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                disabled={page === 1}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                className="p-2 border rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-slate-600 border-slate-200"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-xs font-semibold px-3 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg">
                                {page}
                            </span>
                            <button
                                disabled={page === totalPages}
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                className="p-2 border rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-slate-600 border-slate-200"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}