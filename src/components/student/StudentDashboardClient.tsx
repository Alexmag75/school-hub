/**
 * ==============================================================================
 * КЛІЄНТСЬКИЙ КОМПОНЕНТ КАБІНЕТУ УЧНЯ (`src/components/student/StudentDashboardClient.tsx`)
 * ==============================================================================
 * @description Головний клієнтський компонент особистого кабінету учня освітньої платформи.
 *              Організовує триколонковий інтерфейс управління навчальним процесом:
 *              1. Ліва колонка: віджет прогресу та статистики учня з підтримкою згортання.
 *              2. Центральна колонка: вкладки завдань (потрібно зробити, завершені,
 *                 потребують уваги, протерміновані), панель фільтрації за предметами,
 *                 форматами та сортування за дедлайнами, сітка карток завдань.
 *              3. Права колонка: інтерактивний календар дедлайнів, віджет сповіщень
 *                 та вітрина електронної бібліотеки підручників.
 * ==============================================================================
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { studentService } from "@/services/studentService";
import StudentProgressWidget from "@/components/student/StudentProgressWidget";
import StudentCalendarWidget from "@/components/student/StudentCalendarWidget";
import StudentTaskCard from "@/components/student/StudentTaskCard";
import { StudentTask, TaskTab } from "@/types/student-task";
import StudentNotificationsWidget from "@/components/student/StudentNotificationsWidget";
import { StudentNotification } from "@/types/notification";
import { notificationService } from "@/services/notificationService";
import StudentLibraryWidget, { Book } from "@/components/student/StudentLibraryWidget";

interface StudentDashboardClientProps {
    studentProfile: {
        name: string | null;
        className: string;
    };
    books?: Book[];
}

export default function StudentDashboardClient({ studentProfile, books = [] }: StudentDashboardClientProps) {
    const router = useRouter();

    // Локальні стани фільтрів, вкладок та даних кабінету
    const [selectedSubject, setSelectedSubject] = useState<string>("");
    const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);
    const [activeTab, setActiveTab] = useState<TaskTab>("pending");
    const [tasks, setTasks] = useState<StudentTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [isWidgetCollapsed, setIsWidgetCollapsed] = useState(false);

    const [sortByDate, setSortByDate] = useState<"asc" | "desc">("asc");
    const [selectedType, setSelectedType] = useState<string>("all");
    const [notifications, setNotifications] = useState<StudentNotification[]>([]);

    // Асинхронне завантаження сповіщень учня при монтуванні компонента
    useEffect(() => {
        notificationService.fetchMyNotifications()
            .then(setNotifications)
            .catch(console.error);
    }, []);

    // Фільтрація та сортування масиву завдань відповідно до активних параметрів
    const filteredTasks = tasks
        .filter((task) => {
            if (selectedSubject && task.subjectName !== selectedSubject) return false;

            if (selectedType !== "all") {
                if (selectedType === "LESSON" && task.type !== "LESSON") return false;
                if (selectedType === "QUIZ" && task.type === "LESSON") return false;
            }

            if (selectedCalendarDate) {
                if (!task.deadline) return false;
                const taskDate = new Date(task.deadline);
                if (
                    taskDate.getDate() !== selectedCalendarDate.getDate() ||
                    taskDate.getMonth() !== selectedCalendarDate.getMonth() ||
                    taskDate.getFullYear() !== selectedCalendarDate.getFullYear()
                ) {
                    return false;
                }
            }

            const numericGrade = task.grade12 ?? task.score ?? 0;
            const isCompleted = task.status === "COMPLETED";
            const isQuiz = task.type === "QUIZ" || task.type === "CONTROL_WORK" || task.type === "ATTESTATION";
            const isLesson = task.type === "LESSON";

            switch (activeTab) {
                case "pending":
                    return task.status === "PENDING";
                case "completed":
                    if (!isCompleted) return false;
                    return isLesson || (isQuiz && numericGrade > 0);
                case "requires_attention":
                    return isCompleted && isQuiz && numericGrade === 0;
                case "expired":
                    return task.status === "EXPIRED";
                default:
                    return true;
            }
        })
        .sort((a, b) => {
            const dateA = a.deadline ? new Date(a.deadline).getTime() : 0;
            const dateB = b.deadline ? new Date(b.deadline).getTime() : 0;
            return sortByDate === "asc" ? dateA - dateB : dateB - dateA;
        });

    // Завантаження завдань учня з API при зміні активної вкладки або предмета
    useEffect(() => {
        async function loadTasks() {
            try {
                setLoading(true);
                const data = await studentService.fetchMyTasks(
                    activeTab === "requires_attention" ? "completed" : (activeTab as "pending" | "completed" | "expired"),
                    selectedSubject
                );
                setTasks(data);
            } catch (err) {
                console.error("Помилка завантаження завдань:", err);
            } finally {
                setLoading(false);
            }
        }
        loadTasks();
    }, [activeTab, selectedSubject]);

    // Обробник відмітки окремого сповіщення як прочитаного
    const handleMarkAsRead = async (id: string) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );

        try {
            await notificationService.markAsRead(id);
        } catch (err) {
            console.error("Не вдалося зберегти статус прочитаного:", err);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">

            <main className="flex-grow max-w-[1600px] w-full mx-auto px-4 py-8 space-y-6">
                {/* Верхня інформаційна шапка кабінету учня */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <span>🎓</span> Мій навчальний кабінет
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">
                            Переглядайте уроки, виконуйте тести та стежте за успішністю
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="bg-blue-50 border border-blue-200 px-4 py-2 rounded-xl text-blue-900 text-xs font-semibold text-center">
                            <span className="text-sm font-extrabold block text-slate-900 leading-tight">
                                {studentProfile.name || "Учень"}
                            </span>
                            <span className="text-sm font-extrabold block text-blue-700">
                                Учень {studentProfile.className}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Триколонкова адаптивна сітка панелі */}
                <div className="flex flex-col lg:flex-row items-start gap-6 transition-all duration-300">
                    {/* Ліва колонка: Віджет прогресу та статистики */}
                    <aside
                        className={`w-full transition-all duration-300 lg:sticky lg:top-8 ${
                            isWidgetCollapsed ? "lg:w-16" : "lg:w-[20%]"
                        }`}
                    >
                        <StudentProgressWidget
                            isCollapsed={isWidgetCollapsed}
                            onToggle={() => setIsWidgetCollapsed(!isWidgetCollapsed)}
                        />
                    </aside>

                    {/* Центральна колонка: Навігація, фільтри та сітка завдань */}
                    <main className="w-full flex-1 space-y-6 transition-all duration-300 min-w-0">
                        {/* Вкладки перемикання статусів завдань */}
                        <div className="bg-slate-200/60 p-1.5 rounded-2xl flex items-center gap-1 overflow-x-auto scrollbar-none">
                            <button
                                type="button"
                                onClick={() => setActiveTab("pending")}
                                className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                                    activeTab === "pending"
                                        ? "bg-white text-blue-600 shadow-sm"
                                        : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                                }`}
                            >
                                <span>🎯</span> Потрібно зробити
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab("completed")}
                                className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                                    activeTab === "completed"
                                        ? "bg-white text-emerald-600 shadow-sm"
                                        : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                                }`}
                            >
                                <span>✅</span> Завершені
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab("requires_attention")}
                                className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                                    activeTab === "requires_attention"
                                        ? "bg-white text-amber-700 shadow-sm"
                                        : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                                }`}
                            >
                                <span>⚠️</span> Потребує уваги
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab("expired")}
                                className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                                    activeTab === "expired"
                                        ? "bg-white text-rose-600 shadow-sm"
                                        : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                                }`}
                            >
                                <span>📅</span> Протерміновані
                            </button>
                        </div>

                        {/* Панель інструментів фільтрації та пошуку */}
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                            <div className="text-xs font-bold text-slate-500 flex items-center gap-2">
                                <span>Знайдено:</span>
                                <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 font-extrabold">
                                    {filteredTasks.length}
                                </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                <select
                                    value={selectedSubject}
                                    onChange={(e) => setSelectedSubject(e.target.value)}
                                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition"
                                >
                                    <option value="">📚 Усі предмети</option>
                                    <option value="physics">Фізика</option>
                                    <option value="informatics">Інформатика</option>
                                </select>

                                <select
                                    value={selectedType}
                                    onChange={(e) => setSelectedType(e.target.value)}
                                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition"
                                >
                                    <option value="all">📝 Усі формати</option>
                                    <option value="LESSON">📖 Уроки</option>
                                    <option value="QUIZ">✍️ Тести</option>
                                </select>

                                <button
                                    type="button"
                                    onClick={() => setSortByDate(sortByDate === "asc" ? "desc" : "asc")}
                                    className="bg-slate-50 border border-slate-200 hover:bg-slate-100 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 transition flex items-center gap-1.5"
                                    title="Сортування за датою дедлайну"
                                >
                                    <span>⏳ Дата:</span>
                                    <span className="font-bold text-blue-600">
                                        {sortByDate === "asc" ? "Спочатку ближчі ⬆️" : "Спочатку дальні ⬇️"}
                                    </span>
                                </button>

                                {(selectedSubject || selectedType !== "all" || selectedCalendarDate) && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedSubject("");
                                            setSelectedType("all");
                                            setSelectedCalendarDate(null);
                                        }}
                                        className="bg-rose-50 text-rose-600 hover:bg-rose-100 px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1"
                                    >
                                        ✕ Скинути
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Сповіщення про активний календарний фільтр */}
                        {selectedCalendarDate && (
                            <div className="flex items-center justify-between bg-blue-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm">
                                <span>
                                    📌 Показано завдання на {selectedCalendarDate.toLocaleDateString("uk-UA")}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setSelectedCalendarDate(null)}
                                    className="underline hover:text-blue-100 text-[11px]"
                                >
                                    Показати всі
                                </button>
                            </div>
                        )}

                        {/* Відображення списку карток завдань або станів завантаження/порожнечі */}
                        {loading ? (
                            <div className="text-center py-12 text-slate-400 font-medium text-sm bg-white rounded-2xl border border-slate-200 shadow-sm">
                                Завантаження завдань...
                            </div>
                        ) : filteredTasks.length === 0 ? (
                            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3 shadow-inner text-slate-400 text-sm">
                                Завдань за вибраними фільтрами не знайдено
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 transition-all">
                                {filteredTasks.map((task) => (
                                    <StudentTaskCard
                                        key={task.id}
                                        task={task}
                                        activeTab={activeTab}
                                    />
                                ))}
                            </div>
                        )}
                    </main>

                    {/* Права колонка: Календар, сповіщення та електронна бібліотека */}
                    <aside className="w-full lg:w-[20%] space-y-6 lg:sticky lg:top-8">
                        <StudentCalendarWidget
                            tasks={tasks}
                            selectedDate={selectedCalendarDate}
                            onSelectDate={(date) => setSelectedCalendarDate(date)}
                        />
                        <StudentNotificationsWidget
                            notifications={notifications}
                            onMarkAsRead={handleMarkAsRead}
                        />
                        <StudentLibraryWidget
                            books={books}
                            onViewAll={() => router.push("/student/library")}
                        />
                    </aside>
                </div>
            </main>
        </div>
    );
}