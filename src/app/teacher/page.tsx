/**
 * ==============================================================================
 * ГОЛОВНА СТОРІНКА КАБІНЕТУ ВЧИТЕЛЯ (`src/app/teacher/page.tsx`)
 * ==============================================================================
 * @description Клієнтський компонент дашбуарду вчителя, що об'єднує:
 *              1. Керування навчальними матеріалами (уроки, теорія).
 *              2. Керування контрольними та тестовими перевірками.
 *              3. Доступ до електронного журналу оцінок за предметами та класами.
 *              4. Фільтрацію за класами, предметами, розділами, датами та пошуком.
 *              5. Синхронізацію активних вкладок із параметрами URL (`?tab=...`).
 * ==============================================================================
 */

"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import TeacherDailyTasks from "@/components/teacher/TeacherDailyTasks";
import TeacherNewsTab from "@/components/teacher/TeacherNewsTab";

// Інтерфейс для класу
interface ClassItem {
    id: string;
    name: string;
}

// Інтерфейс для навчального предмета
interface SubjectItem {
    id: string;
    title: string;
}

// Інтерфейс для розділу теми
interface TopicItem {
    id: string;
    title: string;
}

// Предмет із прив'язаними до нього класами (на основі навантаження вчителя)
interface SubjectWithClasses extends SubjectItem {
    classes: ClassItem[];
}

// Інтерфейс для матеріалу (урок, тест, контрольна тощо)
interface MaterialItem {
    id: string;
    title: string;
    type: "THEORY" | "QUIZ" | "CONTROL_WORK" | "ATTESTATION" | "HOMEWORK";
    content: string;
    createdAt: string;
    topic?: { id: string; title: string };
    subject?: { id: string; title: string };
    assignments?: { class: { id: string; name: string } }[];
}

// 1. Внутрішній компонент, що містить логіку та працює з useSearchParams()
function TeacherDashboardContent() {
    const searchParams = useSearchParams();

    // Стани початкових даних вчителя
    const [myClasses, setMyClasses] = useState<ClassItem[]>([]);
    const [mySubjects, setMySubjects] = useState<SubjectItem[]>([]);
    const [myTopics, setMyTopics] = useState<TopicItem[]>([]);
    const [mySubjectsWithClasses, setMySubjectsWithClasses] = useState<SubjectWithClasses[]>([]);
    const [teacherName, setTeacherName] = useState<string>("");

    // Стани фільтрів матеріалів
    const [filterClassId, setFilterClassId] = useState<string>("");
    const [filterSubjectId, setFilterSubjectId] = useState<string>("");
    const [filterTopicId, setFilterTopicId] = useState<string>("");
    const [filterDate, setFilterDate] = useState<string>("");
    const [searchQuery, setSearchQuery] = useState<string>("");

    // Стани даних та індикаторів завантаження
    const [materials, setMaterials] = useState<MaterialItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [materialsLoading, setMaterialsLoading] = useState(false);

    // Активна вкладка дашбуарду: уроки, тести чи журнал оцінок
    const [activeTab, setActiveTab] = useState<"lessons" | "quizzes" | "journal" | "tasks" | "news">("lessons");

    /**
     * Ефект: синхронізація активної вкладки зі значенням параметра "tab" у URL
     */
    useEffect(() => {
        const tab = searchParams.get("tab");
        if (tab === "quizzes") setActiveTab("quizzes");
        else if (tab === "journal") setActiveTab("journal");
        else if (tab === "tasks") setActiveTab("tasks");
        else if (tab === "lessons") setActiveTab("lessons");
        else if (tab === "news") setActiveTab("news");
    }, [searchParams]);

    /**
     * Ефект: завантаження базових даних вчителя (класи, предмети, навантаження)
     */
    useEffect(() => {
        async function fetchTeacherData() {
            try {
                setLoading(true);
                const res = await fetch("/api/teacher/my-data");
                if (res.ok) {
                    const data = await res.json();

                    if (data.user?.fullName) {
                        setTeacherName(data.user.fullName);
                    }

                    setMyClasses(data.classes || []);
                    setMySubjects(data.subjects || []);

                    const subjectsWithOwnClasses: SubjectWithClasses[] = (data.subjects || []).map(
                        (subject: SubjectItem) => {
                            const subjectLoadClassIds = (data.loads || [])
                                .filter((l: { subjectId: string; classId: string }) => l.subjectId === subject.id)
                                .map((l: { subjectId: string; classId: string }) => l.classId);

                            const ownClasses = (data.classes || []).filter((c: ClassItem) =>
                                subjectLoadClassIds.includes(c.id)
                            );

                            return {
                                ...subject,
                                classes: ownClasses,
                            };
                        }
                    );

                    setMySubjectsWithClasses(subjectsWithOwnClasses);

                    if (data.subjects?.length > 0) {
                        setFilterSubjectId(data.subjects[0].id);
                    }
                }
            } catch (err) {
                console.error("Помилка завантаження даних вчителя:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchTeacherData();
    }, []);

    /**
     * Ефект: підвантаження списку розділів (тем) при зміні обраного предмета
     */
    useEffect(() => {
        if (!filterSubjectId) {
            setMyTopics([]);
            return;
        }
        async function fetchTopics() {
            const res = await fetch(`/api/teacher/topics?subjectId=${filterSubjectId}`);
            if (res.ok) {
                setMyTopics(await res.json());
            }
        }
        fetchTopics();
    }, [filterSubjectId]);

    /**
     * Ефект: завантаження списку навчальних матеріалів відповідно до фільтрів
     */
    useEffect(() => {
        async function fetchMaterials() {
            try {
                setMaterialsLoading(true);
                const url = filterSubjectId
                    ? `/api/teacher/materials?subjectId=${filterSubjectId}${filterClassId ? `&classId=${filterClassId}` : ''}`
                    : `/api/teacher/materials`;

                const res = await fetch(url);
                if (res.ok) {
                    setMaterials(await res.json());
                }
            } catch (err) {
                console.error("Помилка завантаження матеріалів:", err);
            } finally {
                setMaterialsLoading(false);
            }
        }
        fetchMaterials();
    }, [filterClassId, filterSubjectId]);

    /**
     * Функція для скидання всіх активних фільтрів пошуку
     */
    const handleResetFilters = () => {
        setFilterClassId("");
        setFilterTopicId("");
        setFilterDate("");
        setSearchQuery("");
        if (mySubjects.length > 0) setFilterSubjectId(mySubjects[0].id);
    };

    /**
     * Допоміжна функція: парсинг конспекту уроку для відображення короткого опису
     */
    const getLessonDescription = (rawContent: string) => {
        try {
            const parsed = JSON.parse(rawContent);
            if (parsed.objectives) return parsed.objectives;
            if (parsed.blocks && parsed.blocks.length > 0) {
                const textBlock = parsed.blocks.find((b: any) => b.type === "text" && b.content);
                if (textBlock) return textBlock.content;
            }
            return "Конспект уроку сформовано";
        } catch (e) {
            return rawContent;
        }
    };

    /**
     * Допоміжна функція: парсинг структури тесту для відображення короткого резюме
     */
    const getQuizSummary = (rawContent: string) => {
        try {
            const parsed = JSON.parse(rawContent);
            const qCount = parsed.questions?.length || 0;
            const totalPoints = parsed.questions?.reduce((acc: number, q: any) => acc + (q.points || 1), 0) || 0;
            const timeLimit = parsed.timeLimitMinutes ? `${parsed.timeLimitMinutes} хв` : "Без обмежень";
            return `Питань: ${qCount} | Макс. бал: ${totalPoints} | Час: ${timeLimit}`;
        } catch (e) {
            return "Тестове завдання";
        }
    };

    /**
     * Фільтрація списку матеріалів на стороні клієнта за розділом, назвою, датою та вкладкою
     */
    const filteredMaterials = materials.filter((mat) => {
        const rawType = (mat.type || "").toUpperCase();

        if (filterTopicId && mat.topic?.id !== filterTopicId) return false;
        if (searchQuery && !mat.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;

        if (filterDate) {
            const matDate = new Date(mat.createdAt).toISOString().split("T")[0];
            if (matDate !== filterDate) return false;
        }

        if (activeTab === "lessons") {
            return rawType === "THEORY";
        } else if (activeTab === "quizzes") {
            return ["QUIZ", "CONTROL_WORK", "ATTESTATION", "HOMEWORK"].includes(rawType);
        }

        return true;
    });

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col bg-slate-50">
                <div className="flex-grow flex items-center justify-center text-slate-500 font-medium">
                    Завантаження кабінету вчителя...
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">

            <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-8 space-y-6">

                {/* Верхня панель (шапка кабінету та кнопки створення) */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <span>👨‍🏫</span> Вітаємо, {teacherName || "вчителю"}!
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">
                            Особистий кабінет вчителя • Керування навчальними матеріалами, тестами та оцінками
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        <Link
                            href="/teacher/lessons/create"
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs md:text-sm font-semibold px-4 py-2.5 rounded-xl transition shadow-sm flex items-center gap-1.5"
                        >
                            <span>📖</span>
                            <span>Створити урок</span>
                        </Link>
                        <Link
                            href="/teacher/quizzes/create"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs md:text-sm font-semibold px-4 py-2.5 rounded-xl transition shadow-sm flex items-center gap-1.5"
                        >
                            <span>📝</span>
                            <span>Створити тест / контрольну</span>
                        </Link>
                    </div>
                </div>

                {/* Навігаційна панель по вкладках */}
                <div className="flex flex-wrap border-b border-slate-200 gap-2">
                    <button
                        onClick={() => setActiveTab("lessons")}
                        className={`px-5 py-3 font-semibold text-sm rounded-t-xl transition ${
                            activeTab === "lessons"
                                ? "bg-white text-blue-600 border-t border-x border-slate-200 shadow-sm"
                                : "text-slate-500 hover:text-slate-800"
                        }`}
                    >
                        📚 Навчальні уроки
                    </button>

                    <button
                        onClick={() => setActiveTab("quizzes")}
                        className={`px-5 py-3 font-semibold text-sm rounded-t-xl transition ${
                            activeTab === "quizzes"
                                ? "bg-white text-emerald-600 border-t border-x border-slate-200 shadow-sm"
                                : "text-slate-500 hover:text-slate-800"
                        }`}
                    >
                        📝 Тести та контрольні роботи
                    </button>

                    <button
                        onClick={() => setActiveTab("journal")}
                        className={`px-5 py-3 font-semibold text-sm rounded-t-xl transition ${
                            activeTab === "journal"
                                ? "bg-white text-indigo-600 border-t border-x border-slate-200 shadow-sm"
                                : "text-slate-500 hover:text-slate-800"
                        }`}
                    >
                        📊 Журнал оцінок
                    </button>
                    <button
                        onClick={() => setActiveTab("tasks")}
                        className={`px-5 py-3 font-semibold text-sm rounded-t-xl transition ${
                            activeTab === "tasks"
                                ? "bg-white text-amber-600 border-t border-x border-slate-200 shadow-sm"
                                : "text-slate-500 hover:text-slate-800"
                        }`}
                    >
                        💡 Задачі дня
                    </button>

                    <button
                        onClick={() => setActiveTab("news")}
                        className={`px-5 py-3 font-semibold text-sm rounded-t-xl transition ${
                            activeTab === "news"
                                ? "bg-white text-purple-600 border-t border-x border-slate-200 shadow-sm"
                                : "text-slate-500 hover:text-slate-800"
                        }`}
                    >
                        📢 Оголошення та конкурси
                    </button>

                    <Link
                        href="/teacher/library/"
                        className="px-5 py-3 font-semibold text-sm rounded-t-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100/60 transition flex items-center gap-1.5 ml-auto"
                    >
                        <span>📖</span>
                        <span>Бібліотека та матеріали ➔</span>
                    </Link>
                </div>

                {/* Вміст вкладок Уроків та Тестів */}
                {(activeTab === "lessons" || activeTab === "quizzes") && (
                    <div className="space-y-6">
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                    🔍 Фільтрація та пошук {activeTab === "lessons" ? "уроків" : "тестів"}
                                </h3>
                                <button
                                    onClick={handleResetFilters}
                                    className="text-xs text-blue-600 hover:underline font-semibold"
                                >
                                    Скинути всі фільтри ✕
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                <div className="lg:col-span-2">
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Пошук за назвою</label>
                                    <input
                                        type="text"
                                        placeholder="Введіть назву..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Предмет</label>
                                    <select
                                        value={filterSubjectId}
                                        onChange={(e) => setFilterSubjectId(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs outline-none"
                                    >
                                        {mySubjects.map((s) => (
                                            <option key={s.id} value={s.id}>{s.title}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Клас</label>
                                    <select
                                        value={filterClassId}
                                        onChange={(e) => setFilterClassId(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs outline-none"
                                    >
                                        <option value="">Усі класи</option>
                                        {myClasses.map((c) => (
                                            <option key={c.id} value={c.id}>Клас {c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Розділ</label>
                                    <select
                                        value={filterTopicId}
                                        onChange={(e) => setFilterTopicId(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs outline-none"
                                    >
                                        <option value="">Усі розділи</option>
                                        {myTopics.map((t) => (
                                            <option key={t.id} value={t.id}>{t.title}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {materialsLoading ? (
                            <div className="text-center py-12 text-slate-400 text-sm bg-white rounded-2xl border">
                                Завантаження списку...
                            </div>
                        ) : filteredMaterials.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300 text-slate-500 text-sm space-y-3">
                                <p>{activeTab === "lessons" ? "Уроків" : "Тестів та контрольних"} за вибраними фільтрами не знайдено.</p>
                                <button onClick={handleResetFilters} className="text-blue-600 font-semibold text-xs hover:underline">
                                    Скинути всі фільтри
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredMaterials.map((mat) => {
                                    const rawType = (mat.type || "").toUpperCase();
                                    const isQuiz = ["QUIZ", "CONTROL_WORK", "ATTESTATION", "HOMEWORK"].includes(rawType);

                                    const detailsUrl = isQuiz ? `/teacher/quizzes/${mat.id}` : `/teacher/lessons/${mat.id}`;
                                    const editUrl = isQuiz ? `/teacher/quizzes/${mat.id}/edit` : `/teacher/lessons/${mat.id}/edit`;

                                    return (
                                        <div
                                            key={mat.id}
                                            className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-400 transition shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                                        >
                                            <div className="space-y-2 flex-grow">
                                                <div className="flex flex-wrap items-center gap-2 text-xs">
                                                    {rawType === "CONTROL_WORK" ? (
                                                        <span className="font-bold px-2.5 py-0.5 rounded-md bg-purple-100 text-purple-800">
                                                            🏆 Контрольна робота
                                                        </span>
                                                    ) : rawType === "ATTESTATION" ? (
                                                        <span className="font-bold px-2.5 py-0.5 rounded-md bg-rose-100 text-rose-800">
                                                            🎓 Атестаційна робота
                                                        </span>
                                                    ) : rawType === "QUIZ" ? (
                                                        <span className="font-bold px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                                                            📝 Тестова перевірка
                                                        </span>
                                                    ) : rawType === "HOMEWORK" ? (
                                                        <span className="font-bold px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-800">
                                                            🏠 Домашнє завдання
                                                        </span>
                                                    ) : (
                                                        <span className="font-bold px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-800">
                                                            📖 Теорія / Урок
                                                        </span>
                                                    )}

                                                    {mat.subject && (
                                                        <span className="bg-slate-100 font-semibold text-slate-700 px-2.5 py-0.5 rounded-md">
                                                            Предмет: {mat.subject.title}
                                                        </span>
                                                    )}

                                                    {mat.assignments?.[0]?.class && (
                                                        <span className="bg-indigo-50 font-semibold text-indigo-700 px-2.5 py-0.5 rounded-md">
                                                            Клас: {mat.assignments[0].class.name}
                                                        </span>
                                                    )}

                                                    <span className="bg-amber-50 font-semibold text-amber-800 px-2.5 py-0.5 rounded-md border border-amber-200/60">
                                                        Розділ: {mat.topic ? mat.topic.title : "Без розділу"}
                                                    </span>

                                                    <span className="text-slate-400 ml-auto md:ml-0">
                                                        📅 {new Date(mat.createdAt).toLocaleDateString("uk-UA")}
                                                    </span>
                                                </div>

                                                <h3 className="font-bold text-slate-900 text-base md:text-lg">
                                                    {mat.title}
                                                </h3>

                                                <p className="text-xs text-slate-500 line-clamp-2 max-w-4xl">
                                                    {isQuiz ? getQuizSummary(mat.content) : getLessonDescription(mat.content)}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                                                <Link
                                                    href={detailsUrl}
                                                    className="bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold px-3.5 py-2 rounded-xl transition border border-blue-200 flex items-center gap-1"
                                                >
                                                    <span>👁️</span> Переглянути
                                                </Link>

                                                <Link
                                                    href={editUrl}
                                                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3.5 py-2 rounded-xl transition flex items-center gap-1"
                                                >
                                                    <span>✏️</span> Редагувати
                                                </Link>

                                                <button
                                                    onClick={async () => {
                                                        if (confirm(`Ви впевнені, що хочете видалити "${mat.title}"?`)) {
                                                            const res = await fetch(`/api/teacher/materials/${mat.id}`, { method: "DELETE" });
                                                            if (res.ok) {
                                                                setMaterials(materials.filter(m => m.id !== mat.id));
                                                            } else {
                                                                alert("Не вдалося видалити матеріал");
                                                            }
                                                        }
                                                    }}
                                                    className="bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold px-3 py-2 rounded-xl transition border border-red-100"
                                                    title="Видалити"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Вкладка Задачі дня */}
                {activeTab === "tasks" && <TeacherDailyTasks />}

                {/* Вкладка Оголошення та конкурси */}
                {activeTab === "news" && <TeacherNewsTab />}

                {/* Вкладка Журналу оцінок */}
                {activeTab === "journal" && (
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <span>📊</span> Оберіть предмет та клас
                            </h2>
                            <p className="text-slate-500 text-sm mt-1">
                                Журнали доступні лише для ваших призначених класів
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {mySubjectsWithClasses.map((subject: SubjectWithClasses) => (
                                <div key={subject.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                                    <h3 className="font-bold text-slate-800 text-base flex items-center gap-2 border-b border-slate-200 pb-2">
                                        <span>📚</span> {subject.title}
                                    </h3>

                                    <div className="flex flex-wrap gap-2 pt-1">
                                        {subject.classes.length > 0 ? (
                                            subject.classes.map((cls: ClassItem) => (
                                                <Link
                                                    key={cls.id}
                                                    href={`/teacher/journal/${subject.id}/${cls.id}`}
                                                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition shadow-sm flex items-center gap-1.5"
                                                >
                                                    <span>🏫</span> Клас {cls.name} ➔
                                                </Link>
                                            ))
                                        ) : (
                                            <span className="text-xs text-slate-400 italic">Немає призначених класів</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

// 2. Головний експорт сторінки, обгорнутий у Suspense
export default function TeacherDashboard() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-slate-500 font-medium">Завантаження кабінету вчителя...</div>}>
            <TeacherDashboardContent />
        </Suspense>
    );
}