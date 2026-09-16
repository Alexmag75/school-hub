"use client";

/**
 * ==============================================================================
 * КОМПОНЕНТ ФОРМИ ПОПОШТУЧНОГО СТВОРЕННЯ КОРИСТУВАЧІВ (`SingleUserForm.tsx`)
 * ==============================================================================
 * @description Форма для створення одного користувача з можливістю:
 *              - Призначення учня в клас та підгрупи предметів.
 *              - Налаштування навантаження вчителя (Предмети + Класи + Підгрупи).
 * ==============================================================================
 */

import { useState, useEffect } from "react";
import { CreatedUser, SchoolClass, Subject } from "@/types/userCreate";
import { generateLogin, generatePass } from "@/utils/userCreationUtils";
import { ClassSelector } from "./ClassSelector";

// Розширений тип предмета, що включає підгрупи відповідно до вашої Prisma-схеми
export interface SubjectGroupInfo {
    id: string;
    name: string;
    subjectId: string;
}

export interface ExtendedSubject extends Subject {
    groups?: SubjectGroupInfo[];
}

interface SingleUserFormProps {
    availableClasses: SchoolClass[];
    availableSubjects: ExtendedSubject[];
    selectedClass: string;
    setSelectedClass: (val: string) => void;
    isCreatingNewClass: boolean;
    setIsCreatingNewClass: (val: boolean) => void;
    newClassName: string;
    setNewClassName: (val: string) => void;
    onSuccess: (user: CreatedUser) => void;
    onError: (msg: string) => void;
}

interface TeacherAssignmentItem {
    subjectId: string;
    classId: string;
    subgroupId?: string;
}

export function SingleUserForm({
                                   availableClasses,
                                   availableSubjects,
                                   selectedClass,
                                   setSelectedClass,
                                   isCreatingNewClass,
                                   setIsCreatingNewClass,
                                   newClassName,
                                   setNewClassName,
                                   onSuccess,
                                   onError,
                               }: SingleUserFormProps) {
    // --------------------------------------------------------------------------
    // ЛОКАЛЬНИЙ СТАН ФОРМИ
    // --------------------------------------------------------------------------
    const [singleFullName, setSingleFullName] = useState("");
    const [singleEmail, setSingleEmail] = useState("");
    const [singlePassword, setSinglePassword] = useState("");
    const [singleRole, setSingleRole] = useState("STUDENT");
    const [isClassEnabled, setIsClassEnabled] = useState(false);
    const [loading, setLoading] = useState(false);

    // Стан для підгруп учня (subjectId -> subgroupId)
    const [selectedSubgroupIds, setSelectedSubgroupIds] = useState<Record<string, string>>({});

    // Стан для навантаження вчителя
    const [teacherAssignments, setTeacherAssignments] = useState<TeacherAssignmentItem[]>([]);

    // --------------------------------------------------------------------------
    // АВТОМАТИЧНИЙ ВИБІР ПЕРШОЇ ПІДГРУПИ ДЛЯ УЧНЯ ПРИ УВІМКНЕННІ КЛАСУ
    // --------------------------------------------------------------------------
    useEffect(() => {
        if (singleRole !== "STUDENT" || !isClassEnabled) {
            setSelectedSubgroupIds({});
            return;
        }

        // Авто-вибір першої підгрупи за замовчуванням для предметів, що мають groups
        const initialMap: Record<string, string> = {};
        availableSubjects.forEach((sub) => {
            if (sub.groups && sub.groups.length > 0) {
                initialMap[sub.id] = sub.groups[0].id;
            }
        });
        setSelectedSubgroupIds(initialMap);
    }, [singleRole, isClassEnabled, availableSubjects]);

    const handleSubgroupChange = (subjectId: string, subgroupId: string) => {
        setSelectedSubgroupIds((prev) => ({ ...prev, [subjectId]: subgroupId }));
    };

    // --------------------------------------------------------------------------
    // ЛОГІКА НАВАНТАЖЕННЯ ВЧИТЕЛЯ
    // --------------------------------------------------------------------------
    const isAssignmentSelected = (subjectId: string, classId: string, subgroupId?: string) => {
        return teacherAssignments.some(
            (a) =>
                a.subjectId === subjectId &&
                a.classId === classId &&
                (subgroupId ? a.subgroupId === subgroupId : !a.subgroupId)
        );
    };

    const toggleTeacherAssignment = (subjectId: string, classId: string, subgroupId?: string) => {
        setTeacherAssignments((prev) => {
            const exists = prev.some(
                (a) =>
                    a.subjectId === subjectId &&
                    a.classId === classId &&
                    (subgroupId ? a.subgroupId === subgroupId : !a.subgroupId)
            );

            if (exists) {
                return prev.filter(
                    (a) =>
                        !(
                            a.subjectId === subjectId &&
                            a.classId === classId &&
                            (subgroupId ? a.subgroupId === subgroupId : !a.subgroupId)
                        )
                );
            } else {
                return [...prev, { subjectId, classId, subgroupId }];
            }
        });
    };

    // --------------------------------------------------------------------------
    // ВІДПРАВКА ФОРМИ
    // --------------------------------------------------------------------------
    const handleSingleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        onError("");
        setLoading(true);

        const targetClass = isClassEnabled
            ? (isCreatingNewClass ? newClassName.trim() : selectedClass || null)
            : null;

        const finalEmail = singleEmail.trim() || generateLogin(singleRole);
        const finalPassword = singlePassword.trim() || generatePass();

        const subgroupIds = singleRole === "STUDENT" ? Object.values(selectedSubgroupIds) : [];

        try {
            const res = await fetch("/api/admin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fullName: singleFullName,
                    email: finalEmail,
                    password: finalPassword,
                    role: singleRole,
                    className: singleRole === "STUDENT" ? targetClass : null,
                    subgroupIds: singleRole === "STUDENT" ? subgroupIds : [],
                    teacherAssignments: singleRole === "TEACHER" ? teacherAssignments : [],
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                onError(data.error || "Не вдалося створити користувача");
            } else {
                onSuccess({ fullName: singleFullName, email: finalEmail, password: finalPassword });
                setSingleFullName("");
                setSingleEmail("");
                setSinglePassword("");
                setTeacherAssignments([]);
                setSelectedSubgroupIds({});
            }
        } catch {
            onError("Помилка мережі");
        } finally {
            setLoading(false);
        }
    };

    // Предмети, у яких є підгрупи
    const subjectsWithGroups = availableSubjects.filter((s) => s.groups && s.groups.length > 0);

    return (
        <form onSubmit={handleSingleCreate} className="space-y-4">
            {/* БЛОК 1: ПІБ ТА ВИБІР РОЛІ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">ПІБ Користувача</label>
                    <input
                        type="text"
                        required
                        value={singleFullName}
                        onChange={(e) => setSingleFullName(e.target.value)}
                        placeholder="Шевченко Тарас"
                        className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Роль</label>
                    <select
                        value={singleRole}
                        onChange={(e) => {
                            const newRole = e.target.value;
                            setSingleRole(newRole);
                            if (singleEmail.includes("@school.local") || !singleEmail) {
                                setSingleEmail(generateLogin(newRole));
                            }
                        }}
                        className="mt-1 w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium transition"
                    >
                        <option value="STUDENT">Учень</option>
                        <option value="TEACHER">Вчитель</option>
                        <option value="ADMIN">Адміністратор</option>
                    </select>
                </div>
            </div>

            {/* БЛОК 2: НАЛАШТУВАННЯ ДЛЯ УЧНЯ */}
            {singleRole === "STUDENT" && (
                <div className="space-y-3">
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="flex items-center gap-1.5 cursor-pointer text-xs text-blue-600 font-medium select-none">
                                <input
                                    type="checkbox"
                                    checked={isClassEnabled}
                                    onChange={(e) => setIsClassEnabled(e.target.checked)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 cursor-pointer"
                                />
                                Прив'язати до класу
                            </label>
                        </div>
                        <ClassSelector
                            availableClasses={availableClasses}
                            selectedClass={selectedClass}
                            setSelectedClass={setSelectedClass}
                            isCreatingNewClass={isCreatingNewClass}
                            setIsCreatingNewClass={setIsCreatingNewClass}
                            newClassName={newClassName}
                            setNewClassName={setNewClassName}
                            disabled={!isClassEnabled}
                        />
                    </div>

                    {/* Вибір підгруп для учня */}
                    {isClassEnabled && subjectsWithGroups.length > 0 && (
                        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
                            <label className="block text-xs font-bold text-slate-800">
                                👥 Розподіл у підгрупи з предметів
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {subjectsWithGroups.map((sub) => (
                                    <div key={sub.id} className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                    <span className="text-xs font-semibold text-slate-700 block">
                      📚 {sub.title}
                    </span>
                                        <select
                                            value={selectedSubgroupIds[sub.id] || ""}
                                            onChange={(e) => handleSubgroupChange(sub.id, e.target.value)}
                                            className="w-full border border-gray-300 rounded-md p-1.5 text-xs bg-slate-50 focus:ring-1 focus:ring-blue-500 font-medium"
                                        >
                                            {sub.groups?.map((g) => (
                                                <option key={g.id} value={g.id}>
                                                    {g.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* БЛОК 3: НАЛАШТУВАННЯ НАВАНТАЖЕННЯ ВЧИТЕЛЯ */}
            {singleRole === "TEACHER" && (
                <div className="space-y-4 pt-2">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                        <div>
                            <label className="block text-sm font-semibold text-gray-800">
                                👨‍🏫 Навантаження вчителя (Предмети, Класи та Підгрупи)
                            </label>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Оберіть, у яких саме класах чи підгрупах учитель викладає кожен з предметів
                            </p>
                        </div>

                        {availableSubjects.length === 0 ? (
                            <p className="text-xs text-gray-400 italic">Спочатку створіть предмети в системі.</p>
                        ) : (
                            <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                                {availableSubjects.map((sub) => {
                                    const assignedForSub = teacherAssignments.filter((a) => a.subjectId === sub.id);
                                    const hasGroups = sub.groups && sub.groups.length > 0;

                                    return (
                                        <div key={sub.id} className="p-3 bg-white rounded-lg border border-slate-200 space-y-3">
                                            <div className="flex justify-between items-center border-b pb-2">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <span>📚</span> {sub.title}
                        </span>
                                                {assignedForSub.length > 0 && (
                                                    <span className="text-[11px] bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-full">
                            Обрано елементів: {assignedForSub.length}
                          </span>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                                                {availableClasses.map((cls) => {
                                                    const isFullSelected = isAssignmentSelected(sub.id, cls.id, undefined);

                                                    return (
                                                        <div key={cls.id} className="p-2.5 border rounded-lg bg-slate-50/50 space-y-2">
                              <span className="text-xs font-bold text-gray-700 block">
                                Клас {cls.name}
                              </span>

                                                            <div className="flex flex-wrap gap-1.5">
                                                                {/* Кнопка "Весь клас" */}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => toggleTeacherAssignment(sub.id, cls.id, undefined)}
                                                                    className={`px-2 py-1 rounded text-xs font-medium border transition ${
                                                                        isFullSelected
                                                                            ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                                                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                                                                    }`}
                                                                >
                                                                    {isFullSelected ? "✓ Весь клас" : "+ Весь клас"}
                                                                </button>

                                                                {/* Варіанти підгруп (якщо вони є у даного предмета) */}
                                                                {hasGroups &&
                                                                    sub.groups!.map((sg) => {
                                                                        const isSgSelected = isAssignmentSelected(sub.id, cls.id, sg.id);

                                                                        return (
                                                                            <button
                                                                                key={sg.id}
                                                                                type="button"
                                                                                onClick={() => toggleTeacherAssignment(sub.id, cls.id, sg.id)}
                                                                                className={`px-2 py-1 rounded text-xs font-medium border transition ${
                                                                                    isSgSelected
                                                                                        ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                                                                                        : "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                                                                                }`}
                                                                            >
                                                                                {isSgSelected ? `✓ ${sg.name}` : `+ ${sg.name}`}
                                                                            </button>
                                                                        );
                                                                    })}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* БЛОК 4: ОБЛІКОВІ ДАНІ (EMAIL ТА ПАРОЛЬ) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm font-medium text-gray-700">Email (Логін)</label>
                        <button
                            type="button"
                            onClick={() => setSingleEmail(generateLogin(singleRole))}
                            className="text-xs text-blue-600 hover:underline font-medium focus:outline-none"
                        >
                            Згенерувати
                        </button>
                    </div>
                    <input
                        type="text"
                        value={singleEmail}
                        onChange={(e) => setSingleEmail(e.target.value)}
                        placeholder="teacher_5645@school.local"
                        className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                    />
                </div>
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm font-medium text-gray-700">Пароль</label>
                        <button
                            type="button"
                            onClick={() => setSinglePassword(generatePass())}
                            className="text-xs text-blue-600 hover:underline font-medium focus:outline-none"
                        >
                            Згенерувати пароль
                        </button>
                    </div>
                    <input
                        type="text"
                        required
                        value={singlePassword}
                        onChange={(e) => setSinglePassword(e.target.value)}
                        placeholder="Введіть або згенеруйте"
                        className="w-full border border-gray-300 rounded-lg p-2.5 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                    />
                </div>
            </div>

            {/* КНОПКА ВІДПРАВКИ */}
            <div className="pt-2 flex justify-end gap-3">
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg text-sm transition shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                    {loading ? "Збереження..." : "Створити користувача"}
                </button>
            </div>
        </form>
    );
}