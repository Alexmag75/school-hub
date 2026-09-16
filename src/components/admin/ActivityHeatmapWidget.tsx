/**
 * ==============================================================================
 * ВІДЖЕТ ТЕПЛОВОЇ КАРТИ АКТИВНОСТІ (`src/components/admin/ActivityHeatmapWidget.tsx`)
 * ==============================================================================
 */

"use client";

import { Clock } from "lucide-react";

interface ActivityHeatmapProps {
    heatmap: number[][]; // Матрица 7 x 24
}

const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function ActivityHeatmapWidget({ heatmap }: ActivityHeatmapProps) {
    // Находим максимальное значение активности для градации цвета
    const maxVal = Math.max(1, ...heatmap.flatMap((row) => row));

    // Функция определения класса интенсивности цвета
    const getIntensityClass = (value: number) => {
        if (value === 0) return "bg-slate-100 hover:bg-slate-200";
        const ratio = value / maxVal;
        if (ratio < 0.25) return "bg-amber-200 hover:bg-amber-300";
        if (ratio < 0.5) return "bg-amber-400 hover:bg-amber-500";
        if (ratio < 0.75) return "bg-amber-500 hover:bg-amber-600";
        return "bg-amber-600 hover:bg-amber-700";
    };

    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600" />
                    Пікова активність учнів (Activity Heatmap)
                </h3>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                    <span>Мин</span>
                    <div className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded bg-slate-100 inline-block" />
                        <span className="w-2.5 h-2.5 rounded bg-amber-200 inline-block" />
                        <span className="w-2.5 h-2.5 rounded bg-amber-400 inline-block" />
                        <span className="w-2.5 h-2.5 rounded bg-amber-600 inline-block" />
                    </div>
                    <span>Макс</span>
                </div>
            </div>

            {/* Сетка Heatmap */}
            <div className="overflow-x-auto pb-2">
                <div className="min-w-[640px] space-y-1.5">
                    {/* Шапка часов (каждые 2-3 часа подпись) */}
                    <div className="flex items-center text-[10px] font-bold text-slate-400 pl-8">
                        {HOURS.map((hour) => (
                            <div key={hour} className="flex-1 text-center">
                                {hour % 3 === 0 ? `${hour}:00` : ""}
                            </div>
                        ))}
                    </div>

                    {/* Строки по дням недели */}
                    {DAYS.map((day, dayIdx) => (
                        <div key={day} className="flex items-center gap-1">
                            <span className="w-7 text-xs font-bold text-slate-500 shrink-0">{day}</span>
                            <div className="flex-1 grid grid-cols-24 gap-1">
                                {HOURS.map((hour) => {
                                    const val = heatmap[dayIdx]?.[hour] || 0;
                                    return (
                                        <div
                                            key={hour}
                                            title={`${day}, ${hour}:00 — ${val} дій`}
                                            className={`h-6 rounded-md transition cursor-pointer ${getIntensityClass(val)}`}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}