"use client";

import { useEffect, useState } from "react";
import { Trophy, Filter, ChevronLeft, ChevronRight, Search } from "lucide-react";

interface StudentItem {
    id: string;
    name: string;
    surname: string;
    points: number;
    completedLessons: number;
    class?: { id: string; name: string };
}

interface ClassOption {
    id: string;
    name: string;
}

const ITEMS_PER_PAGE = 20;

export default function RatingPage() {
    const [students, setStudents] = useState<StudentItem[]>([]);
    const [classes, setClasses] = useState<ClassOption[]>([]);
    const [selectedClass, setSelectedClass] = useState<string>("");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [loading, setLoading] = useState(true);

    // Пагінація
    const [currentPage, setCurrentPage] = useState<number>(1);

    const currentUserId = "";

    useEffect(() => {
        async function fetchRating() {
            try {
                setLoading(true);
                const url = selectedClass
                    ? `/api/rating?classId=${selectedClass}`
                    : "/api/rating";
                const res = await fetch(url);
                if (res.ok) {
                    const data = await res.json();
                    setStudents(data.students || []);
                    if (data.classes) setClasses(data.classes);
                }
            } catch (err) {
                console.error("Помилка завантаження рейтингу:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchRating();
    }, [selectedClass]);

    // Хендлери фільтрації
    const handleClassChange = (classId: string) => {
        setSelectedClass(classId);
        setCurrentPage(1);
    };

    const handleSearchChange = (query: string) => {
        setSearchQuery(query);
        setCurrentPage(1);
    };

    // 1. Фільтрація за пошуковим запитом (ім'я / прізвище)
    const filteredStudents = students.filter((student) => {
        const fullName = `${student.name} ${student.surname}`.toLowerCase();
        return fullName.includes(searchQuery.toLowerCase().trim());
    });

    // 2. Обчислення сторінок для відфільтрованого списку
    const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedStudents = filteredStudents.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
            <main className="flex-grow max-w-5xl w-full mx-auto px-4 py-8 space-y-6">

                {/* Заголовок та фільтри */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <Trophy className="w-7 h-7 text-amber-500" />
                            Загальний рейтинг успішності
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">
                            Знаходьте свій клас, порівнюйте досягнення та змагайтеся за першість!
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        {/* Пошук за ім'ям / прізвищем */}
                        <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 flex-1 sm:flex-initial">
                            <Search className="w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                placeholder="Пошук учня..."
                                className="bg-transparent text-xs font-semibold text-slate-700 outline-none w-full sm:w-36 placeholder:text-slate-400"
                            />
                        </div>

                        {/* Фільтр за класами */}
                        <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 flex-1 sm:flex-initial">
                            <Filter className="w-4 h-4 text-slate-400" />
                            <select
                                value={selectedClass}
                                onChange={(e) => handleClassChange(e.target.value)}
                                className="bg-transparent text-xs font-semibold text-slate-700 outline-none cursor-pointer w-full"
                            >
                                <option value="">Всі класи (Загальний)</option>
                                {classes.map((cls) => (
                                    <option key={cls.id} value={cls.id}>
                                        Клас {cls.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Таблиця рейтингу */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    {loading ? (
                        <div className="p-8 text-center text-slate-400 font-medium">Завантаження рейтингу...</div>
                    ) : filteredStudents.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 font-medium">
                            {searchQuery ? "Учнів за таким запитом не знайдено" : "Учнів за обраним фільтром не знайдено"}
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto flex-grow">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                    <tr className="bg-slate-50 text-slate-400 text-xs font-semibold uppercase border-b border-slate-200">
                                        <th className="py-3 px-4 text-center w-16">Місце</th>
                                        <th className="py-3 px-4">Учень</th>
                                        <th className="py-3 px-4">Клас</th>
                                        <th className="py-3 px-4 text-center">Пройдено уроків</th>
                                        <th className="py-3 px-4 text-right">Набрані бали</th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-sm">
                                    {paginatedStudents.map((student) => {
                                        // Зберігаємо оригінальне реальне місце з масиву `students`
                                        const place = students.findIndex((s) => s.id === student.id) + 1;
                                        const isCurrentUser = student.id === currentUserId;

                                        return (
                                            <tr
                                                key={student.id}
                                                className={`transition ${
                                                    isCurrentUser
                                                        ? "bg-amber-50/60 font-semibold border-l-4 border-amber-500"
                                                        : "hover:bg-slate-50/80"
                                                }`}
                                            >
                                                {/* Позиція */}
                                                <td className="py-3.5 px-4 text-center font-bold">
                                                    {place === 1 && <span className="text-xl">🥇</span>}
                                                    {place === 2 && <span className="text-xl">🥈</span>}
                                                    {place === 3 && <span className="text-xl">🥉</span>}
                                                    {place > 3 && <span className="text-slate-400 text-xs">#{place}</span>}
                                                </td>

                                                {/* Учень */}
                                                <td className="py-3.5 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center border border-slate-200">
                                                            {student.name?.[0]}{student.surname?.[0]}
                                                        </div>
                                                        <span className="text-slate-900 font-semibold">
                                                                {student.name} {student.surname}
                                                            {isCurrentUser && (
                                                                <span className="ml-2 text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-bold">
                                                                        Це ви
                                                                    </span>
                                                            )}
                                                            </span>
                                                    </div>
                                                </td>

                                                {/* Клас */}
                                                <td className="py-3.5 px-4 text-slate-500 text-xs font-medium">
                                                    {student.class?.name || "—"}
                                                </td>

                                                {/* Уроки */}
                                                <td className="py-3.5 px-4 text-center font-semibold text-slate-700">
                                                    {student.completedLessons || 0}
                                                </td>

                                                {/* Бали */}
                                                <td className="py-3.5 px-4 text-right font-bold text-amber-600">
                                                    {student.points || 0} б.
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Панель пагінації */}
                            {totalPages > 1 && (
                                <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50/50 text-xs font-semibold text-slate-600">
                                    <div>
                                        Показано {startIndex + 1}–{Math.min(startIndex + ITEMS_PER_PAGE, filteredStudents.length)} з {filteredStudents.length} учнів
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                            disabled={currentPage === 1}
                                            className="p-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <span>
                                            Сторінка {currentPage} з {totalPages}
                                        </span>
                                        <button
                                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                            disabled={currentPage === totalPages}
                                            className="p-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}