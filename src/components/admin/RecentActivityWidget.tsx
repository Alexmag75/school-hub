/**
 * ==============================================================================
 * КОМПОНЕНТ ОСТАННІХ ПОДІЙ ТА АКТИВНОСТІ С ЗВІТОМ (`src/components/admin/RecentActivityWidget.tsx`)
 * ==============================================================================
 */

"use client";

import { useState, useEffect } from "react";
import {
    Activity,
    UserPlus,
    BookOpen,
    FileCheck,
    Clock,
    RefreshCw,
    Inbox,
    Bell,
    Search,
    Download
} from "lucide-react";

interface SystemEvent {
    id: string;
    type: "USER_REGISTERED" | "MATERIAL_CREATED" | "WORK_SUBMITTED" | string;
    title: string;
    description: string;
    timestamp: string;
}

type FilterType = "ALL" | "USER" | "MATERIAL" | "SUBMISSION";

export default function RecentActivityWidget() {
    const [events, setEvents] = useState<SystemEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState<FilterType>("ALL");

    const fetchActivity = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/activity");
            if (res.ok) {
                const data = await res.json();
                const eventArray = Array.isArray(data) ? data : data.data || [];
                setEvents(eventArray);
            } else {
                setEvents([]);
            }
        } catch (error) {
            console.error("Помилка завантаження активності:", error);
            setEvents([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActivity();
    }, []);

    // Функція завантаження CSV звітів
    const handleExportCSV = async () => {
        try {
            setExporting(true);
            const response = await fetch("/api/admin/activity?export=csv");
            if (!response.ok) throw new Error("Помилка завантаження файлу");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `activity_report_${new Date().toISOString().split("T")[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Помилка експорту CSV:", error);
            alert("Не вдалося завантажити CSV-звіт");
        } finally {
            setExporting(false);
        }
    };

    const formatTimeAgo = (dateString: string) => {
        if (!dateString) return "Нещодавно";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "Нещодавно";

        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return "Щойно";
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} хв тому`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} год тому`;
        return date.toLocaleDateString("uk-UA", { day: "numeric", month: "short" });
    };

    const getEventBadge = (type: string) => {
        switch (type) {
            case "USER_REGISTERED":
                return {
                    icon: <UserPlus className="w-4 h-4 text-blue-600" />,
                    bg: "bg-blue-50 border-blue-200",
                };
            case "MATERIAL_CREATED":
                return {
                    icon: <BookOpen className="w-4 h-4 text-emerald-600" />,
                    bg: "bg-emerald-50 border-emerald-200",
                };
            case "WORK_SUBMITTED":
                return {
                    icon: <FileCheck className="w-4 h-4 text-purple-600" />,
                    bg: "bg-purple-50 border-purple-200",
                };
            default:
                return {
                    icon: <Bell className="w-4 h-4 text-slate-600" />,
                    bg: "bg-slate-50 border-slate-200",
                };
        }
    };

    const filteredEvents = events.filter((event) => {
        const matchesFilter =
            activeFilter === "ALL" ||
            (activeFilter === "USER" && event.type === "USER_REGISTERED") ||
            (activeFilter === "MATERIAL" && event.type === "MATERIAL_CREATED") ||
            (activeFilter === "SUBMISSION" && event.type === "WORK_SUBMITTED");

        const matchesSearch =
            searchQuery === "" ||
            event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            event.description.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesFilter && matchesSearch;
    });

    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            {/* Шапка віджета */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-slate-100 rounded-xl">
                        <Activity className="w-5 h-5 text-slate-700" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                            Останні події (24 години)
                            <span className="text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">
                                {filteredEvents.length}
                            </span>
                        </h2>
                        <p className="text-xs text-slate-500">
                            Моніторинг дій користувачів за останню добу
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {/* Пошук у логах */}
                    <div className="relative min-w-[180px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Пошук дій..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 bg-slate-50/50"
                        />
                    </div>

                    {/* Кнопка експорту CSV */}
                    <button
                        onClick={handleExportCSV}
                        disabled={exporting || events.length === 0}
                        title="Завантажити звіт у CSV"
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-xl transition disabled:opacity-50 shrink-0"
                    >
                        <Download className={`w-3.5 h-3.5 ${exporting ? "animate-bounce" : ""}`} />
                        <span>CSV</span>
                    </button>

                    {/* Кнопка оновлення */}
                    <button
                        onClick={fetchActivity}
                        disabled={loading}
                        title="Оновити дані"
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition disabled:opacity-50 shrink-0"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-600" : ""}`} />
                    </button>
                </div>
            </div>

            {/* Панель фільтрів */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <button
                    onClick={() => setActiveFilter("ALL")}
                    className={`px-3 py-1 rounded-lg font-medium transition ${
                        activeFilter === "ALL"
                            ? "bg-slate-800 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                >
                    Усі
                </button>
                <button
                    onClick={() => setActiveFilter("USER")}
                    className={`px-3 py-1 rounded-lg font-medium transition ${
                        activeFilter === "USER"
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                >
                    Реєстрації
                </button>
                <button
                    onClick={() => setActiveFilter("MATERIAL")}
                    className={`px-3 py-1 rounded-lg font-medium transition ${
                        activeFilter === "MATERIAL"
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                >
                    Матеріали
                </button>
                <button
                    onClick={() => setActiveFilter("SUBMISSION")}
                    className={`px-3 py-1 rounded-lg font-medium transition ${
                        activeFilter === "SUBMISSION"
                            ? "bg-purple-600 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                >
                    Завдання
                </button>
            </div>

            {/* Вміст віджета (Висота розрахована рівно на 3 записи) */}
            <div className="h-[210px] overflow-y-auto pr-1">
                {loading ? (
                    <div className="h-full flex flex-col items-center justify-center space-y-2">
                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-xs text-slate-400 font-medium">Завантаження системних логів...</p>
                    </div>
                ) : filteredEvents.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-2xl text-center p-4">
                        <Inbox className="w-8 h-8 text-slate-300 mb-1" />
                        <p className="text-xs font-semibold text-slate-500">За останні 24 години подій не знайдено</p>
                        <p className="text-[11px] text-slate-400 max-w-xs mt-0.5">
                            {searchQuery ? `За запитом "${searchQuery}" нічого не знайдено` : "Нові реєстрації та активності з'являтимуться тут."}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {filteredEvents.map((event) => {
                            const badge = getEventBadge(event.type);
                            return (
                                <div
                                    key={event.id}
                                    className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3 hover:bg-slate-50/60 p-2 rounded-xl transition"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`p-2 rounded-xl border shrink-0 ${badge.bg}`}>
                                            {badge.icon}
                                        </div>
                                        <div className="min-w-0 space-y-0.5">
                                            <p className="text-xs font-bold text-slate-800 leading-tight">
                                                {event.title}
                                            </p>
                                            <p className="text-xs text-slate-500 truncate">
                                                {event.description}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400 shrink-0">
                                        <Clock className="w-3 h-3 text-slate-300" />
                                        <span>{formatTimeAgo(event.timestamp)}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}