"use client";

import { useState, useEffect } from "react";

interface Subject {
    id: string;
    title: string;
}

interface Comment {
    id: string;
    text: string;
    isWinner: boolean;
    createdAt: string;
    author: {
        id: string;
        fullName: string;
        email?: string;
    };
}

interface Task {
    id: string;
    title: string;
    description: string;
    imageUrl?: string | null;
    isActive: boolean;
    isClosed: boolean;
    createdAt: string;
    subject: { id: string; title: string };
    _count: { comments: number };
}

interface Props {
    subjects?: Subject[];
}

export default function TeacherDailyTasks({ subjects = [] }: Props) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [localSubjects, setLocalSubjects] = useState<Subject[]>(subjects);
    const [loading, setLoading] = useState(true);

    // Форма
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [selectedSubject, setSelectedSubject] = useState("");
    const [makeActive, setMakeActive] = useState(true);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Модальне вікно відповідей
    const [activeTaskForModal, setActiveTaskForModal] = useState<Task | null>(null);
    const [taskComments, setTaskComments] = useState<Comment[]>([]);
    const [loadingComments, setLoadingComments] = useState(false);

    useEffect(() => {
        if (subjects && subjects.length > 0) {
            setLocalSubjects(subjects);
            if (!selectedSubject) setSelectedSubject(subjects[0].id);
        } else {
            // Завантажуємо дані через ваш API /api/teacher/my-data
            fetch("/api/teacher/my-data")
                .then((res) => res.json())
                .then((data) => {
                    // Беремо масив subjects з відповіді вашого роуту
                    const teacherSubjects = data.subjects || [];

                    if (Array.isArray(teacherSubjects) && teacherSubjects.length > 0) {
                        setLocalSubjects(teacherSubjects);
                        setSelectedSubject((prev) => prev || teacherSubjects[0].id);
                    } else {
                        console.warn("У вчителя немає призначених предметів у TeacherSubjectClass");
                    }
                })
                .catch((err) => console.error("Помилка завантаження предметів вчителя:", err));
        }
    }, [subjects]);

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const res = await fetch("/api/teacher/daily-tasks");
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) setTasks(data);
            }
        } catch (err) {
            console.error("Помилка завантаження задач:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !description || !selectedSubject) return;

        setIsSubmitting(true);
        try {
            let uploadedImageUrl = null;

            if (imageFile) {
                const formData = new FormData();
                formData.append("file", imageFile);

                const uploadRes = await fetch("/api/upload", {
                    method: "POST",
                    body: formData,
                });

                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    uploadedImageUrl = uploadData.imageUrl || uploadData.url;
                }
            }

            const res = await fetch("/api/teacher/daily-tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    description,
                    subjectId: selectedSubject,
                    imageUrl: uploadedImageUrl,
                    makeActive,
                }),
            });

            if (res.ok) {
                setTitle("");
                setDescription("");
                setImageFile(null);
                setImagePreview(null);
                fetchTasks();
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleTaskActive = async (taskId: string, currentStatus: boolean) => {
        try {
            const res = await fetch(`/api/teacher/daily-tasks/${taskId}/toggle`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !currentStatus }),
            });

            if (res.ok) fetchTasks();
        } catch (err) {
            console.error("Помилка при зміні статусу:", err);
        }
    };

    const openCommentsModal = async (task: Task) => {
        setActiveTaskForModal(task);
        setLoadingComments(true);
        try {
            const res = await fetch(`/api/teacher/daily-tasks/${task.id}/comments`);
            if (res.ok) {
                const data = await res.json();
                setTaskComments(data);
            }
        } finally {
            setLoadingComments(false);
        }
    };

    const toggleWinner = async (commentId: string, currentWinnerStatus: boolean) => {
        if (!activeTaskForModal) return;
        try {
            const res = await fetch(`/api/teacher/daily-tasks/${activeTaskForModal.id}/comments`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ commentId, isWinner: !currentWinnerStatus }),
            });

            if (res.ok) {
                setTaskComments((prev) =>
                    prev.map((c) => (c.id === commentId ? { ...c, isWinner: !currentWinnerStatus } : c))
                );
                fetchTasks();
            }
        } catch (err) {
            console.error("Помилка обрання переможця:", err);
        }
    };

    // 1. Додаємо функцію архівації
    const archiveTask = async (taskId: string) => {
        if (!confirm("Перевести задачу в архів? Вона зникне з кабінету й буде перенесена до публічного архіву.")) return;

        try {
            const res = await fetch(`/api/teacher/daily-tasks/${taskId}/archive`, {
                method: "PATCH",
            });

            if (res.ok) {
                // Оновлюємо стейт локально, щоб задача одразу зникла з екрана учителя
                setTasks((prevTasks) =>
                    prevTasks.map((task) =>
                        task.id === taskId ? { ...task, isClosed: true, isActive: false } : task
                    )
                );
                // Також можна заново зробити повторний fetch:
                // fetchTasks();
            } else {
                const errorData = await res.json();
                alert(errorData.error || "Не вдалося перевести в архів");
            }
        } catch (err) {
            console.error("Помилка при архівації:", err);
            alert("Виникла помилка з'єднання з сервером.");
        }
    };

// 2. Обов'язково фільтруємо задачі в списку учителя:
    const activeTeacherTasks = tasks.filter((t) => !t.isClosed);

    return (
        <div className="max-w-6xl mx-auto p-2 md:p-4 space-y-8 font-sans">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">💡 Управління «Задачею дня»</h1>
                <p className="text-slate-500 text-sm">
                    Створюйте інтелектуальні задачі для головної сторінки та обирайте найкращі відповіді учнів.
                </p>
            </div>

            {/* Форма створення задачи */}
            <form onSubmit={handleCreateTask} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                <h2 className="text-lg font-bold text-slate-800">Створити нову задачу</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Заголовок задачи</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Наприклад: Логічна задача про двозначні числа"
                            className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Предмет</label>
                        <select
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                            className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        >
                            <option value="">Оберіть предмет</option>
                            {localSubjects.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.title}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Текст умови / запитання</label>
                    <textarea
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Опишіть суть задачи та запитання до учнів..."
                        className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>

                {/* Завантаження зображення */}
                <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Прикріпити зображення (необов'язково)</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                setImageFile(file);
                                setImagePreview(URL.createObjectURL(file));
                            }
                        }}
                        className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border rounded-xl p-1"
                    />

                    {imagePreview && (
                        <div className="mt-3 relative w-32 h-32 border rounded-xl overflow-hidden bg-slate-50">
                            <img src={imagePreview} alt="Прев'ю" className="w-full h-full object-cover" />
                            <button
                                type="button"
                                onClick={() => {
                                    setImageFile(null);
                                    setImagePreview(null);
                                }}
                                className="absolute top-1 right-1 bg-rose-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow"
                            >
                                ✕
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between pt-2">
                    <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={makeActive}
                            onChange={(e) => setMakeActive(e.target.checked)}
                            className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        Опублікувати на головній сторінці негайно
                    </label>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded-xl text-sm transition disabled:opacity-50"
                    >
                        {isSubmitting ? "Збереження..." : "Опублікувати задачу"}
                    </button>
                </div>
            </form>

            {/* Список задач */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b bg-slate-50 font-bold text-slate-700 text-sm flex justify-between items-center">
                    <span>Активні та робочі задачі</span>
                    <a href="/daily-tasks/archive" className="text-xs font-semibold text-amber-600 hover:underline">
                        Переглянути архів ➔
                    </a>
                </div>

                {loading ? (
                    <div className="p-6 text-center text-sm text-slate-500">Завантаження...</div>
                ) : activeTeacherTasks.length === 0 ? (
                    <div className="p-6 text-center text-sm text-slate-500">Активних задач немає. Усі задачі в архіві або ще не створені.</div>
                ) : (
                    <div className="divide-y">
                        {activeTeacherTasks.map((task) => (
                            <div key={task.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between hover:bg-slate-50/50 transition gap-4">
                                <div className="flex items-start gap-4">
                                    {task.imageUrl && (
                                        <div className="w-16 h-16 relative rounded-xl overflow-hidden border border-slate-200 flex-shrink-0 bg-slate-50">
                                            <img src={task.imageUrl} alt={task.title} className="w-full h-full object-cover" />
                                        </div>
                                    )}

                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-200">
                                    {task.subject?.title}
                                </span>
                                            {task.isActive && (
                                                <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                                        Активна на головній
                                    </span>
                                            )}
                                        </div>
                                        <h3 className="font-bold text-slate-800">{task.title}</h3>
                                        <p className="text-xs text-slate-500 line-clamp-1">{task.description}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => openCommentsModal(task)}
                                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 border border-blue-200 hover:bg-blue-50 px-3 py-1.5 rounded-xl transition whitespace-nowrap"
                                    >
                                        💬 Відповіді: <strong>{task._count?.comments || 0}</strong>
                                    </button>

                                    {task.isActive ? (
                                        <button
                                            onClick={() => toggleTaskActive(task.id, true)}
                                            className="text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl transition whitespace-nowrap"
                                        >
                                            Зняти з головної
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => toggleTaskActive(task.id, false)}
                                            className="text-xs font-semibold text-emerald-700 hover:bg-emerald-50 border border-emerald-300 px-3 py-1.5 rounded-xl transition whitespace-nowrap"
                                        >
                                            На головну
                                        </button>
                                    )}

                                    {/* Кнопка переведення в архів */}
                                    <button
                                        onClick={() => archiveTask(task.id)}
                                        className="text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-300 px-3 py-1.5 rounded-xl transition whitespace-nowrap"
                                    >
                                        📦 В архів
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Модальне вікно перевірки відповідей */}
            {activeTaskForModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-xl border max-h-[85vh] flex flex-col">
                        <div className="flex items-center justify-between border-b pb-3">
                            <div>
                                <h3 className="font-bold text-slate-800">{activeTaskForModal.title}</h3>
                                <p className="text-xs text-slate-500">Відповіді учнів</p>
                            </div>
                            <button
                                onClick={() => setActiveTaskForModal(null)}
                                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="overflow-y-auto flex-1 space-y-3 pr-1">
                            {loadingComments ? (
                                <div className="p-6 text-center text-xs text-slate-400">Завантаження відповідей...</div>
                            ) : taskComments.length === 0 ? (
                                <div className="p-6 text-center text-xs text-slate-400">Поки немає жодної відповіді.</div>
                            ) : (
                                taskComments.map((comment) => (
                                    <div
                                        key={comment.id}
                                        className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                                            comment.isWinner ? "bg-amber-50 border-amber-300" : "bg-slate-50 border-slate-200"
                                        }`}
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-xs text-slate-800">{comment.author?.fullName}</span>
                                                {comment.isWinner && (
                                                    <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                            🏆 Переможець
                          </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-600">{comment.text}</p>
                                        </div>

                                        <button
                                            onClick={() => toggleWinner(comment.id, comment.isWinner)}
                                            className={`text-xs font-semibold px-3 py-1.5 rounded-xl transition border whitespace-nowrap ${
                                                comment.isWinner
                                                    ? "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100"
                                                    : "bg-amber-500 text-white border-amber-600 hover:bg-amber-600"
                                            }`}
                                        >
                                            {comment.isWinner ? "Зняти перемогу" : "🏆 Оголосити переможцем"}
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}