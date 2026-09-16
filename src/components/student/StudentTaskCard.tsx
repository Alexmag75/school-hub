/**
 * ==============================================================================
 * КАРТКА НАВЧАЛЬНОГО ЗАВДАННЯ УЧНЯ (`src/components/student/StudentTaskCard.tsx`)
 * ==============================================================================
 * @description Клієнтський компонент окремої картки завдання в кабінеті учня.
 *              Забезпечує:
 *              1. Динамічне форматування дедлайнів із розрахунком часу (хвилини,
 *                 години, дати) та виділенням термінових завдань.
 *              2. Розрізнення типів завдань (уроки, тести, контрольні роботи).
 *              3. Відображення статусів виконання, оцінок за 12-бальною шкалою
 *                 або кольоровою індикацією нульових результатів.
 *              4. Генерацію посилань на сторінки проходження уроків чи тестів.
 * ==============================================================================
 */

"use client";

import Link from "next/link";
import { TaskTab, StudentTask } from "@/types/student-task";

interface StudentTaskCardProps {
    task: StudentTask;
    activeTab: TaskTab;
}

export default function StudentTaskCard({ task, activeTab }: StudentTaskCardProps) {
    // Функція форматування дедлайну та розрахунку залишку часу
    const formatDeadline = (deadlineStr: string | null) => {
        if (!deadlineStr) return null;
        const deadline = new Date(deadlineStr);
        const now = new Date();
        const diffMs = deadline.getTime() - now.getTime();

        if (diffMs <= 0) return { text: "Термін минув", isUrgent: true };

        const totalMinutes = Math.floor(diffMs / (1000 * 60));
        const hoursLeft = Math.floor(totalMinutes / 60);
        const minutesLeft = totalMinutes % 60;

        if (hoursLeft < 24) {
            if (hoursLeft === 0) {
                const minsText = minutesLeft > 0 ? minutesLeft : 1;
                return { text: `Залишилось ${minsText} хв`, isUrgent: true };
            }

            return {
                text: minutesLeft > 0
                    ? `Залишилось ${hoursLeft} год ${minutesLeft} хв`
                    : `Залишилось ${hoursLeft} год`,
                isUrgent: true,
            };
        }

        return { text: `До ${deadline.toLocaleDateString("uk-UA")}`, isUrgent: false };
    };

    const deadlineInfo = formatDeadline(task.deadline);
    const targetId = task.materialId || task.id;

    // Перевіряємо, чи є завдання звичайним уроком
    const isLesson = task.type === "LESSON";

    // Витягуємо чистий бал (тільки для тестів та контрольних)
    const numericGrade = task.grade12 ?? task.score ?? 0;

    // Червона підсвітка картки при 0 балів ТІЛЬКИ для тестів/контрольних
    const isFailedOrZero = activeTab === "completed" && !isLesson && numericGrade === 0;

    // Функція підбору стилів для блоку оцінки (для тестів/контрольних)
    const getGradeBadgeStyles = (grade: number) => {
        if (grade === 0) {
            return {
                bg: "bg-rose-50 border-rose-200",
                label: "text-rose-800",
                value: "text-rose-600",
                badgeText: "0 б. (Не складено)",
            };
        }
        if (grade <= 6) {
            return {
                bg: "bg-amber-50 border-amber-200",
                label: "text-amber-800",
                value: "text-amber-600",
                badgeText: task.grade12 ? `${task.grade12} / 12` : `${task.score} б.`,
            };
        }
        return {
            bg: "bg-emerald-50 border-emerald-200",
            label: "text-emerald-800",
            value: "text-emerald-600",
            badgeText: task.grade12 ? `${task.grade12} / 12` : `${task.score} б.`,
        };
    };

    const gradeStyles = getGradeBadgeStyles(numericGrade);

    return (
        <div
            className={`bg-white p-5 rounded-2xl border shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4 ${
                isFailedOrZero ? "border-rose-200 bg-rose-50/20" : "border-slate-200"
            }`}
        >
            <div className="space-y-3">
                {/* Шапка картки: Тип роботи та статус дедлайну */}
                <div className="flex items-center justify-between gap-2">
                    <span
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wide ${
                            isLesson
                                ? "bg-blue-100 text-blue-700"
                                : task.type === "CONTROL_WORK"
                                    ? "bg-purple-100 text-purple-700"
                                    : "bg-emerald-100 text-emerald-700"
                        }`}
                    >
                        {isLesson
                            ? "📖 Урок"
                            : task.type === "CONTROL_WORK"
                                ? "🏆 Контрольна"
                                : "📝 Тест"}
                    </span>

                    {/* Якщо робота в розділі «Завершені» */}
                    {activeTab === "completed" ? (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">
                            ✅ Завершено
                        </span>
                    ) : (
                        deadlineInfo && (
                            <span
                                className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                                    deadlineInfo.isUrgent
                                        ? "bg-red-50 text-red-600 border border-red-200"
                                        : "bg-slate-100 text-slate-600"
                                }`}
                            >
                                ⏰ {deadlineInfo.text}
                            </span>
                        )
                    )}
                </div>

                {/* Назва предмета та теми завдання */}
                <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        {task.subjectName}
                    </span>
                    <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2 mt-0.5">
                        {task.title}
                    </h3>
                </div>
            </div>

            {/* Підвал картки з інформацією про оцінку/ліміт часу та кнопкою дії */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                {activeTab === "completed" ? (
                    <div className="flex items-center gap-2">
                        {/* Показуємо оцінку для тестів/контрольних та "Ознайомлено" для уроків */}
                        {!isLesson ? (
                            <div className={`border px-3 py-1 rounded-xl ${gradeStyles.bg}`}>
                                <span className={`text-[10px] uppercase font-bold block ${gradeStyles.label}`}>
                                    Оцінка:
                                </span>
                                <span className={`text-sm font-black ${gradeStyles.value}`}>
                                    {gradeStyles.badgeText}
                                </span>
                            </div>
                        ) : (
                            <div className="border border-slate-200/80 bg-slate-50 px-3 py-1.5 rounded-xl text-[11px] font-bold text-slate-600 flex items-center gap-1">
                                👀 Ознайомлено
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-xs text-slate-500 font-medium">
                        {task.timeLimitMinutes ? `⏱️ ${task.timeLimitMinutes} хв.` : "♾️ Без обмежень"}
                    </div>
                )}

                {/* Кнопка переходу або індикатор протермінування */}
                {activeTab === "expired" || task.status === "EXPIRED" ? (
                    <button
                        type="button"
                        disabled
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 flex items-center gap-1"
                    >
                        🔒 Протерміновано
                    </button>
                ) : (
                    <Link
                        href={
                            isLesson
                                ? `/student/lessons/${targetId}`
                                : `/student/quiz/${targetId}`
                        }
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                            activeTab === "completed"
                                ? isFailedOrZero
                                    ? "bg-rose-100 hover:bg-rose-200 text-rose-700"
                                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                                : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                        }`}
                    >
                        {activeTab === "completed" ? "Переглянути" : "Розпочати ➔"}
                    </Link>
                )}
            </div>
        </div>
    );
}