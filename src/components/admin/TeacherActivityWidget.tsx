/**
 * ==============================================================================
 * КОМПОНЕНТ ВИБОРУ ВЧИТЕЛЯ ТА СТАТИСТИКИ АКТИВНОСТІ (`src/components/admin/TeacherActivityWidget.tsx`)
 * ==============================================================================
 * @description Клієнтський інтерактивний віджет для панелі адміністратора.
 *              Забезпечує:
 *              1. Пошук та вибір викладача з обробкою відсутності результатів.
 *              2. Асинхронне завантаження статистики (уроки, тести, контрольні).
 *              3. Зрозумілу індикацію стану "Нічого не знайдено".
 * ==============================================================================
 */

"use client";

import { useState, useEffect } from "react";
import { UserCheck, BookOpen, FileText, Award, Layers, Search, UserX, AlertCircle } from "lucide-react";

interface Teacher {
    id: string;
    name: string;
    email: string;
    subject?: string;
}

interface TeacherActivityStats {
    lessonsCount: number;
    testsCount: number;
    controlWorksCount: number;
    totalMaterials: number;
}

export default function TeacherActivityWidget() {
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
    const [stats, setStats] = useState<TeacherActivityStats | null>(null);
    const [loadingTeachers, setLoadingTeachers] = useState(true);
    const [loadingStats, setLoadingStats] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // 1. Завантаження списку вчителів при монтуванні компонента
    useEffect(() => {
        async function fetchTeachers() {
            try {
                const res = await fetch("/api/admin/teachers");
                if (res.ok) {
                    const data = await res.json();
                    setTeachers(data);
                    if (data.length > 0) {
                        setSelectedTeacherId(data[0].id);
                    }
                }
            } catch (error) {
                console.error("Помилка завантаження списку вчителів:", error);
            } finally {
                setLoadingTeachers(false);
            }
        }
        fetchTeachers();
    }, []);

    // Фільтрація вчителів за пошуковим запитом
    const filteredTeachers = teachers.filter((t) =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.email && t.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Синхронізація обраного вчителя при зміні пошукового запиту
    useEffect(() => {
        if (filteredTeachers.length > 0) {
            // Якщо поточний вибраний id не входить у відфільтровані — вибираємо першого з результатів
            const isStillInList = filteredTeachers.some((t) => t.id === selectedTeacherId);
            if (!isStillInList) {
                setSelectedTeacherId(filteredTeachers[0].id);
            }
        } else {
            setSelectedTeacherId("");
            setStats(null);
        }
    }, [searchQuery, teachers]);

    // 2. Завантаження активності обраного вчителя при зміні `selectedTeacherId`
    useEffect(() => {
        if (!selectedTeacherId) {
            setStats(null);
            return;
        }

        async function fetchTeacherStats() {
            setLoadingStats(true);
            try {
                const res = await fetch(`/api/admin/teachers/${selectedTeacherId}/activity`);
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                } else {
                    setStats({ lessonsCount: 0, testsCount: 0, controlWorksCount: 0, totalMaterials: 0 });
                }
            } catch (error) {
                console.error("Помилка завантаження статистики вчителя:", error);
                setStats({ lessonsCount: 0, testsCount: 0, controlWorksCount: 0, totalMaterials: 0 });
            } finally {
                setLoadingStats(false);
            }
        }
        fetchTeacherStats();
    }, [selectedTeacherId]);

    const selectedTeacher = teachers.find((t) => t.id === selectedTeacherId);

    if (loadingTeachers) {
        return (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm animate-pulse space-y-4">
                <div className="h-6 w-1/3 bg-slate-200 rounded"></div>
                <div className="h-10 bg-slate-200 rounded-xl"></div>
                <div className="grid grid-cols-3 gap-3">
                    <div className="h-24 bg-slate-200 rounded-xl"></div>
                    <div className="h-24 bg-slate-200 rounded-xl"></div>
                    <div className="h-24 bg-slate-200 rounded-xl"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
            {/* Шапка віджета */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                    <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                        <span>👨‍🏫</span> Активність викладачів
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Моніторинг створених навчальних матеріалів, уроків та контрольних
                    </p>
                </div>

                {/* Пошук вчителя */}
                <div className="relative min-w-[260px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Пошук вчителя за ім'ям або email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 transition bg-slate-50/50 placeholder:text-slate-400"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Список вчителів (вибір) */}
                <div className="lg:col-span-1 space-y-2 max-h-[320px] overflow-y-auto pr-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Виберіть викладача ({filteredTeachers.length}):
                    </span>

                    {filteredTeachers.length === 0 ? (
                        <div className="p-4 rounded-xl border border-amber-200/80 bg-amber-50/50 text-center space-y-2 my-2">
                            <UserX className="w-6 h-6 text-amber-500 mx-auto" />
                            <p className="text-xs font-semibold text-amber-900">
                                {searchQuery ? `Викладача "${searchQuery}" не знайдено` : "Вчителів не знайдено"}
                            </p>
                            <p className="text-[11px] text-amber-700/80">
                                Перевірте правильність написання імені або розширте критерії пошуку.
                            </p>
                        </div>
                    ) : (
                        filteredTeachers.map((teacher) => (
                            <button
                                key={teacher.id}
                                type="button"
                                onClick={() => setSelectedTeacherId(teacher.id)}
                                className={`w-full text-left p-3 rounded-xl border transition flex items-center justify-between ${
                                    selectedTeacherId === teacher.id
                                        ? "bg-blue-50/80 border-blue-300 text-blue-900 shadow-sm"
                                        : "bg-slate-50/60 border-slate-100 hover:bg-slate-100/80 text-slate-700"
                                }`}
                            >
                                <div className="min-w-0 pr-2">
                                    <p className="text-xs font-bold truncate">{teacher.name}</p>
                                    <p className="text-[10px] text-slate-400 truncate">{teacher.email}</p>
                                </div>
                                <UserCheck
                                    className={`w-4 h-4 shrink-0 ${
                                        selectedTeacherId === teacher.id ? "text-blue-600" : "text-slate-300"
                                    }`}
                                />
                            </button>
                        ))
                    )}
                </div>

                {/* Блок детальної статистики обраного вчителя */}
                <div className="lg:col-span-2 bg-slate-50/50 rounded-2xl border border-slate-200/60 p-5 flex flex-col justify-between min-h-[220px]">
                    {loadingStats ? (
                        <div className="py-12 text-center space-y-2 my-auto">
                            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                            <p className="text-xs text-slate-400 font-medium">Завантаження статистики...</p>
                        </div>
                    ) : stats && selectedTeacher ? (
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                        Активний викладач
                                    </span>
                                    <p className="text-sm font-bold text-slate-800">{selectedTeacher.name}</p>
                                </div>
                                <span className="text-xs font-black bg-blue-100 text-blue-800 px-3 py-1.5 rounded-xl self-start sm:self-auto">
                                    Всього матеріалів: {stats.totalMaterials}
                                </span>
                            </div>

                            {/* Метрики активності */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm space-y-1">
                                    <div className="flex items-center justify-between text-blue-600">
                                        <BookOpen className="w-5 h-5" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Уроки</span>
                                    </div>
                                    <p className="text-2xl font-black text-slate-800">{stats.lessonsCount}</p>
                                    <p className="text-[10px] text-slate-400 font-medium">Створено конспектів</p>
                                </div>

                                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm space-y-1">
                                    <div className="flex items-center justify-between text-emerald-600">
                                        <FileText className="w-5 h-5" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Тести</span>
                                    </div>
                                    <p className="text-2xl font-black text-slate-800">{stats.testsCount}</p>
                                    <p className="text-[10px] text-slate-400 font-medium">Інтерактивні тести</p>
                                </div>

                                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm space-y-1">
                                    <div className="flex items-center justify-between text-purple-600">
                                        <Award className="w-5 h-5" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Контрольні</span>
                                    </div>
                                    <p className="text-2xl font-black text-slate-800">{stats.controlWorksCount}</p>
                                    <p className="text-[10px] text-slate-400 font-medium">Роботи та екзамени</p>
                                </div>
                            </div>

                            <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                                <span>💡 Дані оновлюються в реальному часі з бази даних</span>
                                <Layers className="w-4 h-4 text-slate-400" />
                            </div>
                        </div>
                    ) : (
                        <div className="my-auto py-8 text-center space-y-2">
                            <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
                            <p className="text-xs font-semibold text-slate-500">
                                {searchQuery ? `Немає даних для перегляду` : "Виберіть викладача зі списку ліворуч"}
                            </p>
                            <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                                {searchQuery
                                    ? `Викладач за запитом "${searchQuery}" відсутній у базі даних.`
                                    : "Оберіть вчителя для перегляду його активності та розроблених матеріалів."}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}