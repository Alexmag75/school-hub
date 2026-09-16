/**
 * ==============================================================================
 * КАЛЕНДАР-ВІДЖЕТ УЧНЯ (`src/components/student/StudentCalendarWidget.tsx`)
 * ==============================================================================
 * @description Клієнтський інтерактивний віджет календаря для кабінету учня.
 *              Забезпечує:
 *              1. Інтерактивну сітку місяця з навігацією між місяцями.
 *              2. Фільтрацію завдань за обраною датою та бейджі активного фільтра.
 *              3. Візуальну індикацію днів із невиконаними дедлайнами (з акцентом
 *                 на термінові завдання менш ніж за 24 години).
 *              4. Блок найближчих невичерпаних дедлайнів для швидкого доступу.
 * ==============================================================================
 */

"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, AlertCircle, Clock, X } from "lucide-react";
import {StudentTask} from "@/types/student-task";


const DAYS_OF_WEEK = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];

interface CalendarProps {
    tasks: StudentTask[];
    selectedDate: Date | null;
    onSelectDate: (date: Date | null) => void;
}

export default function StudentCalendarWidget({ tasks, selectedDate, onSelectDate }: CalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date());

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Назва місяця українською мовою
    const monthName = currentDate.toLocaleString("uk-UA", { month: "long" });

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // Коригування індексу тижня (понеділок — перший день)
    const startingDayIndex = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    const today = new Date();

    // 1. Фільтруємо ТІЛЬКИ НЕВИКОНАНІ завдання з дедлайнами
    const pendingTasksWithDeadlines = tasks.filter((task) => {
        const isCompleted =
            (task.grade12 !== null && task.grade12 !== undefined) ||
            (task.score !== null && task.score !== undefined);
        return !isCompleted && Boolean(task.deadline);
    });

    // Безпечне порівняння дат без урахування часу та часового поясу
    const isSameDay = (date1: Date, targetYear: number, targetMonth: number, targetDay: number) => {
        return (
            date1.getFullYear() === targetYear &&
            date1.getMonth() === targetMonth &&
            date1.getDate() === targetDay
        );
    };

    // Функція перевірки наявності дедлайна на конкретний день місяця
    const getDeadlineForDay = (dayNum: number) => {
        return pendingTasksWithDeadlines.find((t) => {
            if (!t.deadline) return false;
            const taskDeadline = new Date(t.deadline);
            return isSameDay(taskDeadline, year, month, dayNum);
        });
    };

    // 2. Добірка найближчих 3 не виконаних завдань для списку внизу
    const upcomingDeadlines = [...pendingTasksWithDeadlines]
        .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
        .slice(0, 3);

    // Обробник кліку по конкретному дню календаря
    const handleDayClick = (dayNum: number) => {
        const clickedDate = new Date(year, month, dayNum);

        if (
            selectedDate &&
            isSameDay(selectedDate, year, month, dayNum)
        ) {
            onSelectDate(null);
        } else {
            onSelectDate(clickedDate);
        }
    };

    return (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-5 w-full">
            {/* Шапка календаря з навігацією місяцями */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 capitalize">
                    <CalendarIcon className="w-4 h-4 text-blue-600" />
                    {monthName} {year}
                </h2>
                <div className="flex items-center gap-1">
                    <button
                        onClick={prevMonth}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                        title="Попередній місяць"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                        onClick={nextMonth}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                        title="Наступний місяць"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Активний фільтр за датою */}
            {selectedDate && (
                <div className="flex items-center justify-between bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl text-xs text-blue-800">
                    <span className="font-semibold">
                        📅 Фільтр: {selectedDate.toLocaleDateString("uk-UA")}
                    </span>
                    <button
                        onClick={() => onSelectDate(null)}
                        className="p-0.5 hover:bg-blue-100 rounded-md text-blue-600 transition"
                        title="Скинути фільтр"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}

            {/* Дні тижня */}
            <div className="grid grid-cols-7 gap-1 text-center">
                {DAYS_OF_WEEK.map((day) => (
                    <span key={day} className="text-[11px] font-bold text-slate-400 uppercase">
                        {day}
                    </span>
                ))}
            </div>

            {/* Сітка днів місяця */}
            <div className="grid grid-cols-7 gap-1 text-center">
                {Array.from({ length: startingDayIndex }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-8" />
                ))}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const dayNum = i + 1;
                    const isToday = isSameDay(today, year, month, dayNum);
                    const isSelected = selectedDate ? isSameDay(selectedDate, year, month, dayNum) : false;

                    const taskDeadline = getDeadlineForDay(dayNum);

                    // Перевірка терміновості (дедлайн менш ніж за 24 години / 86400000 мс)
                    const isUrgent = taskDeadline?.deadline
                        ? new Date(taskDeadline.deadline).getTime() - today.getTime() < 86400000
                        : false;

                    return (
                        <button
                            key={dayNum}
                            type="button"
                            onClick={() => handleDayClick(dayNum)}
                            className={`h-8 flex flex-col items-center justify-center rounded-xl text-xs font-semibold relative transition ${
                                isSelected
                                    ? "bg-blue-600 text-white shadow-md font-black ring-2 ring-blue-300"
                                    : isToday
                                        ? "bg-blue-50 text-blue-700 font-bold border border-blue-200"
                                        : "text-slate-700 hover:bg-slate-100"
                            }`}
                        >
                            <span>{dayNum}</span>

                            {/* Індикатор наявності дедлайна (червоний пульсуючий для термінових, жовтий для звичайних) */}
                            {taskDeadline && !isSelected && (
                                <span
                                    className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${
                                        isUrgent ? "bg-red-500 animate-pulse" : "bg-amber-400"
                                    }`}
                                />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Блок найближчих не виконаних завдань (дедлайнів) */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                        Найближчі дедлайни:
                    </span>
                    <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded-md">
                        {pendingTasksWithDeadlines.length}
                    </span>
                </h3>

                {upcomingDeadlines.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-2">
                        Немає термінових завдань 🎉
                    </p>
                ) : (
                    <div className="space-y-2">
                        {upcomingDeadlines.map((item) => {
                            const deadlineDate = new Date(item.deadline!);
                            return (
                                <div
                                    key={item.id}
                                    onClick={() => onSelectDate(deadlineDate)}
                                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 hover:border-blue-300 hover:bg-blue-50/30 transition space-y-1 cursor-pointer"
                                >
                                    <div className="flex items-center justify-between gap-1">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase truncate">
                                            {item.subjectName}
                                        </span>
                                        <span className="text-[10px] font-extrabold text-red-600 flex items-center gap-1 shrink-0">
                                            <Clock className="w-3 h-3" />
                                            {deadlineDate.toLocaleDateString("uk-UA", {
                                                day: "numeric",
                                                month: "short",
                                            })}
                                        </span>
                                    </div>
                                    <p className="text-xs font-bold text-slate-800 line-clamp-1 leading-snug">
                                        {item.title}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}