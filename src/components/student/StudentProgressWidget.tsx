/**
 * ==============================================================================
 * ВІДЖЕТ УСПІХУ ТА СТАТИСТИКИ УЧНЯ (`src/components/student/StudentProgressWidget.tsx`)
 * ==============================================================================
 * @description Клієнтський інтерактивний віджет лівої бічної панелі кабінету учня.
 *              Забезпечує:
 *              1. Підтримку режиму згортання (трансформація у компактну вертикальну
 *                 панель з анімацією).
 *              2. Асинхронне завантаження статистики успішності з API (`cache: "no-store"`).
 *              3. Відображення серії навчання («стріку» 🔥), відсотка виконання вчасно,
 *                 загальної кількості виконаних та протермінованих робіт.
 *              4. Блок останніх отриманих оцінок із кольоровою шкалою відповідно до балів.
 * ==============================================================================
 */

"use client";

import { useEffect, useState } from "react";
import { Flame, CheckCircle2, Award, Clock, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";

interface GradeItem {
    id: string;
    title: string;
    subjectName: string;
    grade12: number;
    submittedAt: string;
}

interface StatsData {
    completionRate: number;
    totalSubmitted: number;
    totalAssignments?: number;
    onTimeCount: number;
    overdueCount?: number;
    recentGrades: GradeItem[];
    streak: number;
}

interface WidgetProps {
    isCollapsed: boolean;
    onToggle: () => void;
}

export default function StudentProgressWidget({ isCollapsed, onToggle }: WidgetProps) {
    const [stats, setStats] = useState<StatsData | null>(null);
    const [loading, setLoading] = useState(true);

    // Асинхронне завантаження статистики успішності учня при монтуванні
    useEffect(() => {
        async function fetchStats() {
            try {
                // cache: "no-store" гарантує свіжі дані щоразу при відкритті сторінки
                const res = await fetch("/api/student/dashboard-stats", { cache: "no-store" });
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (error) {
                console.error("Помилка завантаження статистики:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="w-full bg-slate-100 rounded-2xl animate-pulse p-5 space-y-4">
                <div className="h-5 w-1/3 bg-slate-200 rounded"></div>
                <div className="space-y-3">
                    <div className="h-16 bg-slate-200 rounded-xl"></div>
                    <div className="h-16 bg-slate-200 rounded-xl"></div>
                </div>
            </div>
        );
    }

    if (!stats) return null;

    const total = stats.totalAssignments && stats.totalAssignments > 0
        ? stats.totalAssignments
        : stats.totalSubmitted;

    // Визначення кольору бейджа оцінки за 12-бальною шкалою
    const getGradeBadgeColor = (grade: number) => {
        if (grade >= 10) return "bg-emerald-100 text-emerald-800 border-emerald-300";
        if (grade >= 7) return "bg-blue-100 text-blue-800 border-blue-300";
        if (grade >= 4) return "bg-amber-100 text-amber-800 border-amber-300";
        return "bg-rose-100 text-rose-800 border-rose-300";
    };

    // Рендеринг згорнутого стану віджета
    if (isCollapsed) {
        return (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-sm flex flex-col items-center justify-between min-h-[260px] w-full transition-all">
                <button
                    type="button"
                    onClick={onToggle}
                    className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                    title="Розгорнути «Мій успіх»"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>

                <div className="py-6 flex items-center justify-center">
                    <span
                        className="font-bold text-slate-700 text-sm whitespace-nowrap tracking-wide select-none"
                        style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
                    >
                        📊 Мій успіх
                    </span>
                </div>

                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
            </div>
        );
    }

    // Рендеринг розгорнутого стану віджета
    return (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-5 w-full transition-all">
            {/* Шапка віджета з кнопкою згортання */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                        📊 Мій успіх
                    </h2>
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                        LMS-Помічник
                    </span>
                </div>

                <button
                    type="button"
                    onClick={onToggle}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                    title="Згорнути"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
            </div>

            {/* Блоки метрик та статистики */}
            <div className="grid grid-cols-1 gap-3">
                {/* Серія навчання (стрік) */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-orange-50/70 border border-orange-200/60">
                    <div className="p-2.5 bg-orange-500 text-white rounded-xl shadow-sm shrink-0">
                        <Flame className="w-5 h-5 animate-bounce" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="text-lg font-black text-slate-800 leading-tight">
                            {stats.streak} {stats.streak === 1 ? "день" : "днів"}
                        </div>
                        <p className="text-[11px] font-medium text-orange-700 truncate">
                            Серія навчання поспіль 🔥
                        </p>
                    </div>
                </div>

                {/* Відсоток виконання вчасно */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-indigo-50/70 border border-indigo-200/60">
                    <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-sm shrink-0">
                        <Clock className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="text-lg font-black text-slate-800 leading-tight">
                            {stats.completionRate}%
                        </div>
                        <p className="text-[11px] font-medium text-indigo-700 truncate">
                            Складено вчасно ({stats.onTimeCount} з {total})
                        </p>
                    </div>
                </div>

                {/* Успішно виконані роботи */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/60">
                    <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-sm shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="text-lg font-black text-slate-800 leading-tight">
                            {stats.totalSubmitted} <span className="text-xs font-normal text-slate-500">з {total}</span>
                        </div>
                        <p className="text-[11px] font-medium text-emerald-700 truncate">
                            Успішно виконано робіт
                        </p>
                    </div>
                </div>

                {/* Протерміновані / не складені завдання */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-rose-50/70 border border-rose-200/60">
                    <div className="p-2.5 bg-rose-500 text-white rounded-xl shadow-sm shrink-0">
                        <AlertCircle className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="text-lg font-black text-slate-800 leading-tight">
                            {stats.overdueCount ?? 0} <span className="text-xs font-normal text-slate-500">з {total}</span>
                        </div>
                        <p className="text-[11px] font-medium text-rose-700 truncate">
                            Протерміновано / Не складено
                        </p>
                    </div>
                </div>
            </div>

            {/* Блок останніх отриманих оцінок */}
            {stats.recentGrades.length > 0 && (
                <div className="pt-2 border-t border-slate-100 space-y-2.5">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-slate-400" />
                        Останні отримані оцінки:
                    </h3>

                    <div className="grid grid-cols-1 gap-2">
                        {stats.recentGrades.map((grade) => (
                            <div
                                key={grade.id}
                                className="flex items-center justify-between gap-2 bg-slate-50 border border-slate-200/80 p-2.5 rounded-xl text-xs"
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="font-bold text-slate-800 truncate leading-snug">
                                        {grade.title}
                                    </p>
                                    <p className="text-[10px] text-slate-400 font-medium truncate">
                                        {grade.subjectName}
                                    </p>
                                </div>
                                <span
                                    className={`px-2.5 py-1 rounded-lg border font-black text-xs shrink-0 ${getGradeBadgeColor(
                                        grade.grade12
                                    )}`}
                                >
                                    {grade.grade12} б.
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}