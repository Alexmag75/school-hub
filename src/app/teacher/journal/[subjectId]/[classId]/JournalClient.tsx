"use client";

/**
 * ==============================================================================
 * ІНТЕРАКТИВНИЙ КЛІЄНТСЬКИЙ ЖУРНАЛ ВЧИТЕЛЯ (`JournalClient.tsx`)
 * ==============================================================================
 * @description Клієнтський компонент таблиці журналу з функціоналом:
 *              - Відображення списку учнів та колонок (Урок, Тест, Завдання).
 *              - Швидке редагування оцінок (1–12 балів) з миттєвим оновленням UI.
 *              - Автоматичне відправлення оцінки на бекенд через API.
 *              - Відображення статусу виконання (Завершено, Прострочено, Очікується).
 *
 * @tech_stack React (useState), Next.js Link, Tailwind CSS.
 * ==============================================================================
 */

import { useState } from "react";
import Link from "next/link";

export interface Student {
    id: string;
    fullName: string;
}

export interface Grade {
    id: string;
    value: number | null;
    studentId: string;
    columnId: string;
    status: "PENDING" | "COMPLETED" | "OVERDUE";
}

export interface Column {
    id: string;
    title: string;
    createdAt: Date | string;
    deadline?: Date | string | null;
    materialId?: string | null;
    type: "LESSON" | "TEST" | "ASSIGNMENT";
}

interface Props {
    subject: { id: string; title: string };
    classItem: { id: string; name: string };
    students: Student[];
    initialColumns: Column[];
    initialGrades: Grade[];
    teacherId: string;
}

/** Конфігурація відображення типів колонок */
const TYPE_CONFIG = {
    LESSON: { label: "Урок", badge: "bg-blue-50 text-blue-700 border-blue-200" },
    TEST: { label: "Тест", badge: "bg-purple-50 text-purple-700 border-purple-200" },
    ASSIGNMENT: { label: "Завдання", badge: "bg-amber-50 text-amber-700 border-amber-200" },
};

export default function JournalClient({
                                          subject,
                                          classItem,
                                          students = [],
                                          initialColumns = [],
                                          initialGrades = [],
                                          teacherId,
                                      }: Props) {
    const [columns] = useState<Column[]>(initialColumns);
    const [grades, setGrades] = useState<Grade[]>(initialGrades);

    /**
     * Обробка зміни значення оцінки
     */
    const handleGradeChange = async (studentId: string, columnId: string, val: string) => {
        let numericVal: number | null = val === "" ? null : Number(val);

        // Обмеження значення за 12-бальною системою оцінювання
        if (numericVal !== null) {
            if (isNaN(numericVal)) return;
            if (numericVal > 12) numericVal = 12;
            if (numericVal < 1) numericVal = 1;
        }

        // Зберігаємо попередній стан для можливості скасування змін (Rollback)
        let previousGrades = [...grades];

        // Оптимістичне оновлення стану в UI
        setGrades((prev) => {
            const existingIndex = prev.findIndex(
                (g) => g.studentId === studentId && g.columnId === columnId
            );

            if (existingIndex === -1) {
                return [
                    ...prev,
                    {
                        id: `temp-${studentId}-${columnId}`,
                        value: numericVal,
                        studentId,
                        columnId,
                        status: numericVal !== null ? "COMPLETED" : "PENDING",
                    },
                ];
            }

            return prev.map((g, idx) =>
                idx === existingIndex
                    ? {
                        ...g,
                        value: numericVal,
                        status: numericVal !== null ? "COMPLETED" : "PENDING",
                    }
                    : g
            );
        });

        // Відправка оновлення на сервер
        try {
            const res = await fetch("/api/teacher/journal/grade", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    studentId,
                    columnId,
                    teacherId,
                    value: numericVal,
                }),
            });

            if (!res.ok) {
                throw new Error("Не вдалося зберегти оцінку");
            }
        } catch (err) {
            console.error("Помилка збереження оцінки:", err);
            // У разі помилки повертаємо попередній стан
            setGrades(previousGrades);
            alert("Помилка під час збереження оцінки. Спробуйте ще раз.");
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">
            {/* ШАПКА ЖУРНАЛУ */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <Link
                        href="/teacher"
                        className="text-xs font-bold text-slate-500 hover:text-slate-800 transition"
                    >
                        ← Назад до кабінету
                    </Link>
                    <h1 className="text-2xl font-black text-slate-900 mt-1">
                        📖 Авто-моніторинг: {subject.title} ({classItem.name})
                    </h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Результати виконання завдань та ознайомлення з матеріалами на платформі
                    </p>
                </div>

                {/* ЛЕГЕНДА СТАТУСІВ */}
                <div className="flex items-center gap-3 text-xs bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 shrink-0">
                    <span className="flex items-center gap-1.5 font-medium text-slate-600">
                        <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span> Ознайомлений / Складено
                    </span>
                    <span className="flex items-center gap-1.5 font-medium text-slate-600">
                        <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span> Прострочено
                    </span>
                    <span className="flex items-center gap-1.5 font-medium text-slate-600">
                        <span className="w-3 h-3 rounded-full bg-slate-200 inline-block"></span> В очікуванні
                    </span>
                </div>
            </header>

            {/* ТАБЛИЦЯ ЖУРНАЛУ */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-600">
                            <th className="p-3 pl-5 sticky left-0 bg-slate-50 z-10 w-64 min-w-[200px] shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                                Учень ({students.length})
                            </th>
                            {columns.map((col) => {
                                const meta = TYPE_CONFIG[col.type] || TYPE_CONFIG.LESSON;
                                const d = new Date(col.createdAt);
                                const dateStr = `${d.getDate().toString().padStart(2, "0")}.${(
                                    d.getMonth() + 1
                                )
                                    .toString()
                                    .padStart(2, "0")}`;

                                return (
                                    <th
                                        key={col.id}
                                        className="p-3 text-center min-w-[110px] border-l border-slate-200/60"
                                    >
                                        <div className="flex flex-col items-center gap-1">
                                                <span
                                                    className={`text-[9px] px-2 py-0.5 rounded-md border font-bold ${meta.badge}`}
                                                >
                                                    {meta.label}
                                                </span>
                                            <span className="text-slate-900 font-extrabold text-xs">
                                                    {dateStr}
                                                </span>
                                            <span
                                                className="text-[10px] text-slate-500 font-normal truncate max-w-[100px]"
                                                title={col.title}
                                            >
                                                    {col.title}
                                                </span>
                                        </div>
                                    </th>
                                );
                            })}
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                        {students.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={columns.length + 1}
                                    className="p-6 text-center text-slate-400"
                                >
                                    Учні у цьому класі відсутні
                                </td>
                            </tr>
                        ) : (
                            students.map((student, idx) => (
                                <tr key={student.id} className="hover:bg-slate-50/80 transition">
                                    {/* Закріплена колонка з ПІБ учня */}
                                    <td className="p-3 pl-5 sticky left-0 bg-white z-10 font-bold text-slate-800 border-r border-slate-100 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                                            <span className="text-slate-400 text-[10px] mr-2">
                                                {idx + 1}.
                                            </span>
                                        {student.fullName}
                                    </td>

                                    {/* Колонки оцінок/статусів */}
                                    {columns.map((col) => {
                                        const grade = grades.find(
                                            (g) =>
                                                g.studentId === student.id &&
                                                g.columnId === col.id
                                        );

                                        const isCompleted =
                                            grade?.status === "COMPLETED" ||
                                            (grade?.value !== null && grade?.value !== undefined);
                                        const status = isCompleted
                                            ? "COMPLETED"
                                            : grade?.status || "PENDING";
                                        const isLesson = col.type === "LESSON";

                                        let cellBg = "bg-slate-50 border-slate-200 text-slate-400";

                                        if (status === "COMPLETED") {
                                            cellBg =
                                                "bg-emerald-50 border-emerald-300 text-emerald-700 font-bold";
                                        } else if (status === "OVERDUE") {
                                            cellBg =
                                                "bg-rose-50 border-rose-300 text-rose-600 font-bold";
                                        }

                                        return (
                                            <td
                                                key={col.id}
                                                className="p-2 text-center border-r border-slate-100/60"
                                            >
                                                {isLesson ? (
                                                    /* Відображення для ознайомлення з уроком */
                                                    <div
                                                        className={`w-10 h-9 mx-auto rounded-xl border flex items-center justify-center text-sm font-bold transition ${cellBg}`}
                                                        title={
                                                            status === "COMPLETED"
                                                                ? "Ознайомився з матеріалом"
                                                                : status === "OVERDUE"
                                                                    ? "Не ознайомився"
                                                                    : "В очікуванні"
                                                        }
                                                    >
                                                        {status === "COMPLETED"
                                                            ? "✓"
                                                            : status === "OVERDUE"
                                                                ? "✗"
                                                                : "—"}
                                                    </div>
                                                ) : (
                                                    /* Введення оцінки для тестів та завдань */
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max="12"
                                                        placeholder={status === "OVERDUE" ? "✗" : "—"}
                                                        value={grade?.value ?? ""}
                                                        onChange={(e) =>
                                                            handleGradeChange(
                                                                student.id,
                                                                col.id,
                                                                e.target.value
                                                            )
                                                        }
                                                        className={`w-10 h-9 text-center rounded-xl border text-xs transition focus:outline-none focus:ring-2 focus:ring-purple-500 ${cellBg}`}
                                                    />
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}