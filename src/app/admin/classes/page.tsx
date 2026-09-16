"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface SubjectGroup {
    id: string;
    name: string;
}

interface SchoolClass {
    id: string;
    name: string;
    _count?: {
        users?: number;
    };
}

interface Subject {
    id: string;
    title: string;
    hasGroups: boolean;
    groups?: SubjectGroup[];
    teacher?: {
        fullName: string;
    };
}

export default function AdminClassesPage() {
    const [classes, setClasses] = useState<SchoolClass[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);

    const [newClassName, setNewClassName] = useState("");
    const [newSubjectName, setNewSubjectName] = useState("");
    const [hasGroups, setHasGroups] = useState(false); // Новий стан для чекбокса груп

    const [loadingClasses, setLoadingClasses] = useState(false);
    const [loadingSubjects, setLoadingSubjects] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setError("");
        try {
            const [resClasses, resSubjects] = await Promise.all([
                fetch("/api/admin/classes"),
                fetch("/api/admin/subjects"),
            ]);

            if (resClasses.ok) {
                const dataClasses = await resClasses.json();
                setClasses(Array.isArray(dataClasses) ? dataClasses : []);
            } else {
                setError("Помилка завантаження класів");
            }

            if (resSubjects.ok) {
                const dataSubjects = await resSubjects.json();
                setSubjects(Array.isArray(dataSubjects) ? dataSubjects : []);
            } else {
                setError("Помилка завантаження предметів");
            }
        } catch {
            setError("Не вдалося завантажити дані мережі");
        }
    };

    const handleAddClass = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newClassName.trim()) return;

        setError("");
        setSuccess("");
        setLoadingClasses(true);

        try {
            const res = await fetch("/api/admin/classes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newClassName.trim() }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Помилка при створенні класу");
            } else {
                setSuccess(`Клас "${newClassName.trim()}" успішно додано!`);
                setNewClassName("");
                fetchData();
            }
        } catch {
            setError("Помилка мережі при додаванні класу");
        } finally {
            setLoadingClasses(false);
        }
    };

    const handleAddSubject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSubjectName.trim()) return;

        setError("");
        setSuccess("");
        setLoadingSubjects(true);

        try {
            const res = await fetch("/api/admin/subjects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newSubjectName.trim(),
                    hasGroups: hasGroups, // Передаємо прапор
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Помилка при створенні предмета");
            } else {
                setSuccess(`Предмет "${newSubjectName.trim()}" успішно додано!`);
                setNewSubjectName("");
                setHasGroups(false); // Скидаємо чекбокс
                fetchData();
            }
        } catch {
            setError("Помилка мережі при додаванні предмета");
        } finally {
            setLoadingSubjects(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 p-4">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Управління класами та предметами</h1>
                    <p className="text-gray-500 text-sm">
                        Налаштування навчальних класів і предметної програми школи
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link
                        href="/admin/users/create"
                        className="text-sm font-medium text-blue-600 hover:text-blue-800 border border-blue-200 px-3 py-1.5 rounded-md bg-blue-50 transition"
                    >
                        + Реєстрація учнів
                    </Link>
                    <Link
                        href="/admin/users"
                        className="text-sm font-medium text-slate-600 hover:text-slate-900 border px-3 py-1.5 rounded-md bg-white shadow-sm"
                    >
                        ← Користувачі
                    </Link>
                </div>
            </div>

            {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100" role="alert">
                    {error}
                </div>
            )}
            {success && (
                <div className="text-sm text-emerald-700 bg-emerald-50 p-3 rounded-lg border border-emerald-100 font-medium">
                    {success}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* 1. БЛОК КЛАСІВ */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-5">
                    <div className="flex justify-between items-center border-b pb-3">
                        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            🏫 Навчальні класи
                        </h2>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">
                            Всього: {classes.length}
                        </span>
                    </div>

                    <form onSubmit={handleAddClass} className="flex gap-2">
                        <input
                            type="text"
                            required
                            value={newClassName}
                            onChange={(e) => setNewClassName(e.target.value)}
                            placeholder="Назва (напр. 7-А, 11-Б)"
                            className="flex-1 border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                        <button
                            type="submit"
                            disabled={loadingClasses}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-lg text-sm transition shadow-sm disabled:opacity-50 whitespace-nowrap"
                        >
                            {loadingClasses ? "..." : "+ Додати"}
                        </button>
                    </form>

                    <div className="divide-y border rounded-lg overflow-hidden max-h-80 overflow-y-auto">
                        {classes.length === 0 ? (
                            <p className="text-center text-sm text-gray-400 py-6">Класи ще не створені</p>
                        ) : (
                            classes.map((cls) => (
                                <div key={cls.id || cls.name} className="p-3 flex justify-between items-center hover:bg-slate-50 transition">
                                    <span className="font-semibold text-gray-800 text-sm">Клас {cls.name}</span>
                                    {cls._count?.users !== undefined && (
                                        <span className="text-xs text-gray-500 bg-slate-100 px-2 py-0.5 rounded">
                                            Учнів: {cls._count.users}
                                        </span>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* 2. БЛОК ПРЕДМЕТІВ */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-5">
                    <div className="flex justify-between items-center border-b pb-3">
                        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            📚 Навчальні предмети
                        </h2>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">
                            Всього: {subjects.length}
                        </span>
                    </div>

                    <form onSubmit={handleAddSubject} className="space-y-3">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                required
                                value={newSubjectName}
                                onChange={(e) => setNewSubjectName(e.target.value)}
                                placeholder="Назва (напр. Інформатика)"
                                className="flex-1 border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                            <button
                                type="submit"
                                disabled={loadingSubjects}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2.5 rounded-lg text-sm transition shadow-sm disabled:opacity-50 whitespace-nowrap"
                            >
                                {loadingSubjects ? "..." : "+ Додати"}
                            </button>
                        </div>

                        {/* Опція поділу на групи */}
                        <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 select-none pt-1">
                            <input
                                type="checkbox"
                                checked={hasGroups}
                                onChange={(e) => setHasGroups(e.target.checked)}
                                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 border-gray-300"
                            />
                            <span>Ділиться на групи (1 і 2 підгрупа)</span>
                        </label>
                    </form>

                    <div className="divide-y border rounded-lg overflow-hidden max-h-80 overflow-y-auto">
                        {subjects.length === 0 ? (
                            <p className="text-center text-sm text-gray-400 py-6">Предмети ще не створені</p>
                        ) : (
                            subjects.map((sub) => (
                                <div key={sub.id} className="p-3 flex justify-between items-center hover:bg-slate-50 transition">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-gray-800 text-sm">{sub.title}</span>
                                        {sub.hasGroups && (
                                            <span className="text-[11px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-medium border border-purple-200">
                                                2 підгрупи
                                            </span>
                                        )}
                                    </div>
                                    {sub.teacher && (
                                        <span className="text-xs text-gray-500 bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100">
                                            {sub.teacher.fullName}
                                        </span>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}