"use client";

import { useState, useEffect } from "react";
import QuickLinksWidget from "@/components/home/QuickLinksWidget";
import SidebarQuickLinks from "@/components/home/QuickLinksWidget";
import Link from "next/link";

interface Comment {
    id: string;
    text: string;
    isWinner: boolean;
    createdAt: string;
    author: { id: string; fullName: string; role: string };
}

interface Task {
    id: string;
    title: string;
    description: string;
    imageUrl?: string | null;
    createdAt: string;
    subject: { id: string; title: string };
    author: { id: string; fullName: string };
    comments: Comment[];
    isSolvedByMe?: boolean;
}

interface Subject {
    id: string;
    title: string;
}

interface LeaderUser {
    id: string;
    fullName: string;
    count: number;
}

export default function DailyTasksWidget({
                                             subjects: initialSubjects = [],
                                         }: {
    subjects?: Subject[];
}) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [subjectsList, setSubjectsList] = useState<Subject[]>(initialSubjects);

    // Стейт лідерборду
    const [topWinners, setTopWinners] = useState<LeaderUser[]>([]);
    const [topActive, setTopActive] = useState<LeaderUser[]>([]);

    // Фільтри
    const [selectedSubject, setSelectedSubject] = useState<string>("all");
    const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
    const [statusFilter, setStatusFilter] = useState<"all" | "solved" | "unsolved">("all");

    // Пагінація
    const [page, setPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [loading, setLoading] = useState<boolean>(true);

    // Стейт відповідей
    const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>({});
    const [submittingId, setSubmittingId] = useState<string | null>(null);

    useEffect(() => {
        if (initialSubjects && initialSubjects.length > 0) {
            setSubjectsList(initialSubjects);
        } else {
            fetch("/api/subjects")
                .then((res) => res.json())
                .then((data) => {
                    if (Array.isArray(data)) setSubjectsList(data);
                    else if (data.subjects) setSubjectsList(data.subjects);
                })
                .catch((err) => console.error("Помилка завантаження предметів:", err));
        }

        // Завантаження лідерборду
        fetch("/api/daily-tasks/leaderboard")
            .then((res) => res.json())
            .then((data) => {
                if (data.winners) setTopWinners(data.winners);
                if (data.active) setTopActive(data.active);
            })
            .catch((err) => console.error("Помилка завантаження рейтингу:", err));
    }, []);

    useEffect(() => {
        fetchTasks();
    }, [selectedSubject, sortOrder, statusFilter, page]);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams({
                subjectId: selectedSubject,
                sort: sortOrder,
                status: statusFilter,
                page: page.toString(),
                limit: "3",
            });

            const res = await fetch(`/api/daily-tasks?${query.toString()}`);
            const data = await res.json();
            if (res.ok) {
                setTasks(data.tasks || []);
                setTotalPages(data.pagination?.totalPages || 1);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleAddComment = async (taskId: string) => {
        const text = commentInputs[taskId];
        if (!text || !text.trim()) return;

        setSubmittingId(taskId);
        try {
            const res = await fetch(`/api/daily-tasks/${taskId}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text }),
            });

            if (res.ok) {
                setCommentInputs((prev) => ({ ...prev, [taskId]: "" }));
                fetchTasks();
            } else {
                const err = await res.json();
                alert(err.error || "Не вдалося відправити відповідь");
            }
        } finally {
            setSubmittingId(null);
        }
    };

    return (
        <div className="w-full space-y-6 py-6 font-sans">
            {/* Шапка віджета та Фільтри на всю ширину */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">💡 Цікава задача</h2>
                        <p className="text-xs text-slate-500">
                            Розв'язуйте інтелектуальні завдання від учителів та здобувайте перемоги
                        </p>
                    </div>
                    {/* --- КНОПКА ПЕРЕХОДУ В АРХІВ (З ВРАХУВАННЯМ ПРАВИЛЬНОГО РОУТУ) --- */}
                    <Link
                        href="/archive"
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition shadow-sm whitespace-nowrap self-start sm:self-auto"
                    >
                        📦 Архів задач ➔
                    </Link>
                </div>

                {/* Панель фільтрів */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                    <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">Предмет</label>
                        <select
                            value={selectedSubject}
                            onChange={(e) => {
                                setSelectedSubject(e.target.value);
                                setPage(1);
                            }}
                            className="w-full border rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                        >
                            <option value="all">Усі предмети</option>
                            {subjectsList.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                            Сортування за датою
                        </label>
                        <select
                            value={sortOrder}
                            onChange={(e) => {
                                setSortOrder(e.target.value as "desc" | "asc");
                                setPage(1);
                            }}
                            className="w-full border rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                        >
                            <option value="desc">Спочатку нові</option>
                            <option value="asc">Спочатку старі</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                            Ваш статус
                        </label>
                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value as "all" | "solved" | "unsolved");
                                setPage(1);
                            }}
                            className="w-full border rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                        >
                            <option value="all">Усі задачі</option>
                            <option value="unsolved">Ще не розв'язані мною</option>
                            <option value="solved">Вже розв'язані мною</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Основна сітка: Ліворуч задачі (2/3), праворуч рейтинг та ресурси (1/3) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Колонки задач (2/3) */}
                <div className="lg:col-span-2 space-y-6">
                    {loading ? (
                        <div className="p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
                            Завантаження задач...
                        </div>
                    ) : tasks.length === 0 ? (
                        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm">
                            Наразі немає задач за обраними фільтрами.
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {tasks.map((task) => (
                                <div
                                    key={task.id}
                                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4"
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                        <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-100">
                                            {task.subject?.title}
                                        </span>
                                            <h3 className="text-lg font-bold text-slate-800 mt-2">{task.title}</h3>
                                        </div>
                                        {task.author && (
                                            <div className="text-right text-xs text-slate-400">
                                                Учитель:{" "}
                                                <span className="font-semibold text-slate-600">
                                                {task.author.fullName}
                                            </span>
                                            </div>
                                        )}
                                    </div>

                                    {task.imageUrl && (
                                        <div className="rounded-xl overflow-hidden border border-slate-100 bg-slate-100 h-64 flex items-center justify-center p-2">
                                            <img
                                                src={task.imageUrl}
                                                alt={task.title}
                                                className="max-h-full max-w-full object-contain rounded-lg shadow-sm"
                                            />
                                        </div>
                                    )}

                                    <p className="text-sm text-slate-700 whitespace-pre-line bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                                        {task.description}
                                    </p>

                                    <div className="border-t pt-4 space-y-3">
                                        <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                            💬 Відповіді учнів ({(task.comments || []).length})
                                        </h4>

                                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar border border-slate-50 p-1 rounded-lg">
                                            {(task.comments || []).length === 0 ? (
                                                <p className="text-xs text-slate-400 italic">
                                                    Будьте першим, хто розв'яже цю задачу!
                                                </p>
                                            ) : (
                                                (task.comments || []).map((c) => (
                                                    <div
                                                        key={c.id}
                                                        className={`p-3 rounded-xl text-xs space-y-1 ${
                                                            c.isWinner
                                                                ? "bg-amber-50 border border-amber-300 ring-1 ring-amber-300"
                                                                : "bg-slate-50 border border-slate-100"
                                                        }`}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                        <span className="font-bold text-slate-700 flex items-center gap-1">
                                                            {c.author?.fullName}
                                                            {c.isWinner && (
                                                                <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-md font-bold">
                                                                    🏆 Переможець
                                                                </span>
                                                            )}
                                                        </span>
                                                            <span className="text-[10px] text-slate-400">
                                                            {new Date(c.createdAt).toLocaleTimeString([], {
                                                                hour: "2-digit",
                                                                minute: "2-digit",
                                                            })}
                                                        </span>
                                                        </div>
                                                        <p className="text-slate-600">{c.text}</p>
                                                    </div>
                                                ))
                                            )}
                                        </div>

                                        <div className="flex gap-2 pt-2">
                                            <input
                                                type="text"
                                                placeholder="Напишіть ваш розв'язок або відповідь..."
                                                value={commentInputs[task.id] || ""}
                                                onChange={(e) =>
                                                    setCommentInputs({ ...commentInputs, [task.id]: e.target.value })
                                                }
                                                onKeyDown={(e) => e.key === "Enter" && handleAddComment(task.id)}
                                                className="flex-1 border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <button
                                                onClick={() => handleAddComment(task.id)}
                                                disabled={submittingId === task.id}
                                                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-xl text-xs transition disabled:opacity-50 whitespace-nowrap"
                                            >
                                                Надіслати
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Пагінація */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 pt-2">
                            <button
                                disabled={page === 1}
                                onClick={() => setPage((p) => p - 1)}
                                className="px-3 py-1.5 rounded-xl border text-xs font-semibold disabled:opacity-40 hover:bg-slate-50 transition"
                            >
                                ← Назад
                            </button>
                            <span className="text-xs font-medium text-slate-600">
                            Сторінка {page} з {totalPages}
                        </span>
                            <button
                                disabled={page === totalPages}
                                onClick={() => setPage((p) => p + 1)}
                                className="px-3 py-1.5 rounded-xl border text-xs font-semibold disabled:opacity-40 hover:bg-slate-50 transition"
                            >
                                Вперед →
                            </button>
                        </div>
                    )}
                </div>

                {/* Колонка Рейтингу учнів та Ресурсів (1/3) */}
                <div className="space-y-6 lg:sticky lg:top-24 self-start h-fit border-transparent">
                    {/* Блок 1: Топ переможців */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                            🏆 Топ переможців
                        </h3>
                        <p className="text-xs text-slate-500">Учні з найбільшою кількістю точних розв'язків</p>

                        <div className="space-y-2 pt-1">
                            {topWinners.length === 0 ? (
                                <p className="text-xs text-slate-400 italic">Переможців поки немає</p>
                            ) : (
                                topWinners.map((u, index) => (
                                    <div
                                        key={u.id}
                                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                                    >
                                        <div className="flex items-center gap-2.5">
                                        <span
                                            className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                                                index === 0
                                                    ? "bg-amber-400 text-white"
                                                    : index === 1
                                                        ? "bg-slate-300 text-slate-700"
                                                        : index === 2
                                                            ? "bg-amber-700 text-white"
                                                            : "bg-slate-200 text-slate-600"
                                            }`}
                                        >
                                            {index + 1}
                                        </span>
                                            <span className="font-semibold text-slate-700">{u.fullName}</span>
                                        </div>
                                        <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                        {u.count} 🏆
                                    </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Блок 2: Топ за активністю */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                            🔥 Найактивніші учні
                        </h3>
                        <p className="text-xs text-slate-500">За кількістю запропонованих розв'язків</p>

                        <div className="space-y-2 pt-1">
                            {topActive.length === 0 ? (
                                <p className="text-xs text-slate-400 italic">Активних учнів поки немає</p>
                            ) : (
                                topActive.map((u, index) => (
                                    <div
                                        key={u.id}
                                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                                    >
                                        <div className="flex items-center gap-2.5">
                                        <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">
                                            {index + 1}
                                        </span>
                                            <span className="font-semibold text-slate-700">{u.fullName}</span>
                                        </div>
                                        <span className="font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                        {u.count} відп.
                                    </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Блок 3: Швидкі посилання на корисні ресурси */}
                    <SidebarQuickLinks />
                </div>
            </div>
        </div>
    );
}