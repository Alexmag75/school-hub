"use client";

/**
 * ==============================================================================
 * КОМПОНЕНТ РЕДАГУВАННЯ НАВАНТАЖЕННЯ ВЧИТЕЛЯ (`TeacherEditAssignments.tsx`)
 * ==============================================================================
 * @description Спеціалізований UI-блок для сторінки редагування вчителя.
 *              Дозволяє динамічно додавати, редагувати та видаляти зв'язки
 *              «Предмет → Клас» (педагогічне навантаження).
 *
 * @tech_stack React Client Component, Tailwind CSS.
 * ==============================================================================
 */

import React from "react";

export interface SchoolClass {
    id: string;
    name: string;
}

export interface SubjectGroupInfo {
    id: string;
    name: string;
    subjectId: string;
}

export interface SubjectWithGroups {
    id: string;
    title: string;
    hasGroups?: boolean;
    groups?: SubjectGroupInfo[];
}

export interface TeacherAssignment {
    id?: string; // 👈 Зроблено обов'язковим для існуючих, але опціональним для нових
    classId?: string;
    subjectId?: string;
    subgroupId?: string | null;
    class?: { id: string; name: string };
    subject?: { id: string; title: string };
    subgroup?: { id: string; name: string } | string | null;
}

interface TeacherEditAssignmentsProps {
    availableClasses: SchoolClass[];
    availableSubjects: SubjectWithGroups[];
    assignments: TeacherAssignment[];
    onChangeAssignments: (assignments: TeacherAssignment[]) => void;
}

export function TeacherEditAssignments({
                                           availableClasses,
                                           availableSubjects,
                                           assignments,
                                           onChangeAssignments,
                                       }: TeacherEditAssignmentsProps) {

    // Додати новий рядок навантаження
    const handleAddAssignment = () => {
        const defaultSubject = availableSubjects[0]?.id || "";
        const defaultClass = availableClasses[0]?.id || "";
        onChangeAssignments([
            ...assignments,
            {
                id: `temp_${Date.now()}_${Math.random()}`, // 👈 Тимчасовий унікальний ID
                subjectId: defaultSubject,
                classId: defaultClass,
                subgroupId: null
            },
        ]);
    };

    // Оновити конкретне поле
    const handleChange = (
        index: number,
        field: "subjectId" | "classId" | "subgroupId",
        value: string
    ) => {
        const updated = [...assignments];
        if (field === "subgroupId") {
            updated[index] = {
                ...updated[index],
                subgroupId: value === "" ? null : value,
            };
        } else {
            updated[index] = {
                ...updated[index],
                [field]: value,
                // При зміні предмета скидаємо вибрану підгрупу
                ...(field === "subjectId" ? { subgroupId: null } : {}),
            };
        }
        onChangeAssignments(updated);
    };

    // Видалити рядок
    const handleRemoveAssignment = (index: number) => {
        const updated = assignments.filter((_, i) => i !== index);
        onChangeAssignments(updated);
    };

    return (
        <div className="space-y-4 pt-2 border-t border-gray-100">
            <div className="flex justify-between items-center">
                <label className="block text-sm font-semibold text-gray-700">
                    👨‍🏫 Навантаження вчителя (Предмет + Клас + Група)
                </label>
                <button
                    type="button"
                    onClick={handleAddAssignment}
                    className="text-xs text-blue-600 hover:text-blue-800 border border-blue-200 bg-blue-50 px-3 py-1.5 rounded-lg font-medium transition"
                >
                    + Додати предмет
                </button>
            </div>

            {assignments.length === 0 ? (
                <div className="text-sm text-gray-400 italic p-3 bg-gray-50 rounded-lg text-center border border-dashed">
                    Навантаження ще не призначено. Натисніть "+ Додати предмет".
                </div>
            ) : (
                <div className="space-y-3">
                    {assignments.map((assignment, index) => {
                        const currentSubject = availableSubjects.find(
                            (s) => s.id === assignment.subjectId
                        );
                        const availableGroups = currentSubject?.groups || [];

                        return (
                            <div
                                key={assignment.id || index}
                                className="flex items-center gap-2 bg-gray-50 p-3 rounded-xl border border-gray-200 shadow-sm"
                            >
                                {/* 1. Селект Предмета */}
                                <select
                                    value={assignment.subjectId}
                                    onChange={(e) => handleChange(index, "subjectId", e.target.value)}
                                    className="flex-1 border border-gray-300 rounded-lg p-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                >
                                    <option value="" disabled>Оберіть предмет</option>
                                    {availableSubjects.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            📚 {s.title}
                                        </option>
                                    ))}
                                </select>

                                <span className="text-gray-400 text-sm">→</span>

                                {/* 2. Селект Класу */}
                                <select
                                    value={assignment.classId}
                                    onChange={(e) => handleChange(index, "classId", e.target.value)}
                                    className="flex-1 border border-gray-300 rounded-lg p-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                >
                                    <option value="" disabled>Оберіть клас</option>
                                    {availableClasses.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            🏫 Клас {c.name}
                                        </option>
                                    ))}
                                </select>

                                <span className="text-gray-400 text-sm">→</span>

                                {/* 3. Селект Підгрупи */}
                                <select
                                    value={assignment.subgroupId || ""}
                                    onChange={(e) => handleChange(index, "subgroupId", e.target.value)}
                                    className="flex-1 border border-gray-300 rounded-lg p-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                                >
                                    <option value="">👥 Весь клас (Без групи)</option>
                                    {availableGroups.map((sg) => (
                                        <option key={sg.id} value={sg.id}>
                                            🔹 {sg.name}
                                        </option>
                                    ))}
                                </select>

                                {/* Кнопка видалення рядка */}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveAssignment(index)}
                                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                                    title="Видалити"
                                >
                                    ✕
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}