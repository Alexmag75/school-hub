/**
 * ==============================================================================
 * ВІДЖЕТ НАВЧАЛЬНОЇ АНАЛІТИКИ (`src/components/admin/AcademicAnalyticsTab.tsx`)
 * ==============================================================================
 */

"use client";

import { useEffect, useState } from "react";
import { PieChart, BarChart3, Clock, CheckCircle2, Hourglass } from "lucide-react";
import ActivityHeatmapWidget from "@/components/admin/ActivityHeatmapWidget";

interface AcademicData {
    completionRate: {
        onTime: number;
        late: number;
        pending: number;
        counts: { onTime: number; late: number; pending: number; total: number };
    };
    classPerformance: Array<{
        id: string;
        className: string;
        avgScore: number;
        totalGraded: number;
    }>;
    heatmap?: number[][];
}

export default function AcademicAnalyticsTab() {
    const [data, setData] = useState<AcademicData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchAcademicData() {
            try {
                const res = await fetch("/api/admin/analytics/academic");
                if (res.ok) {
                    const result = await res.json();
                    setData(result);
                }
            } catch (err) {
                console.error("Помилка завантаження навчальної аналітики:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchAcademicData();
    }, []);

    if (loading) {
        return (
            <div className="py-12 text-center space-y-2">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-xs text-slate-400 font-medium">Завантаження навчальних метрик...</p>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 1. ДИСЦИПЛІНА ЗДАЧІ РОБІТ */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <PieChart className="w-4 h-4 text-blue-600" />
                            Динаміка здачі робіт
                        </h3>
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                            Всього: {data.completionRate.counts.total}
                        </span>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-xs font-bold">
                                <span className="flex items-center gap-1.5 text-emerald-700">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Вчасно
                                </span>
                                <span className="text-slate-700">{data.completionRate.onTime}% ({data.completionRate.counts.onTime})</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${data.completionRate.onTime}%` }} />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex justify-between text-xs font-bold">
                                <span className="flex items-center gap-1.5 text-amber-700">
                                    <Clock className="w-3.5 h-3.5" /> З запізненням
                                </span>
                                <span className="text-slate-700">{data.completionRate.late}% ({data.completionRate.counts.late})</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${data.completionRate.late}%` }} />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex justify-between text-xs font-bold">
                                <span className="flex items-center gap-1.5 text-rose-700">
                                    <Hourglass className="w-3.5 h-3.5" /> В процесі / Не здано
                                </span>
                                <span className="text-slate-700">{data.completionRate.pending}% ({data.completionRate.counts.pending})</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                <div className="bg-rose-500 h-full rounded-full transition-all duration-500" style={{ width: `${data.completionRate.pending}%` }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. СРЕДНИЙ БАЛЛ ПО КЛАССАМ */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4 lg:col-span-2">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-indigo-600" />
                            Успішність за класами (Середній бал)
                        </h3>
                        <span className="text-xs text-slate-400">12-бальна система</span>
                    </div>

                    <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                        {data.classPerformance.length === 0 ? (
                            <p className="text-xs text-slate-400 text-center py-8">Немає оцінених робіт для розрахунку</p>
                        ) : (
                            data.classPerformance.map((cls) => (
                                <div key={cls.id} className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-slate-700 w-16 shrink-0">{cls.className}</span>
                                    <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${
                                                cls.avgScore >= 9
                                                    ? "bg-emerald-500"
                                                    : cls.avgScore >= 6
                                                        ? "bg-blue-500"
                                                        : "bg-amber-500"
                                            }`}
                                            style={{ width: `${(cls.avgScore / 12) * 100}%` }}
                                        />
                                    </div>
                                    <span className="text-xs font-black text-slate-800 w-10 text-right">{cls.avgScore}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* 3. ТЕПЛОВА КАРТА АКТИВНОСТІ */}
            {data.heatmap && <ActivityHeatmapWidget heatmap={data.heatmap} />}
        </div>
    );
}