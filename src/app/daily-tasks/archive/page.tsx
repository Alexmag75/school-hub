"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Archive, ArrowLeft, Calendar, Trophy, RotateCcw } from "lucide-react";

interface WinnerComment {
    id: string;
    text: string;
    author: { fullName: string };
}

interface ArchivedTask {
    id: string;
    title: string;
    description: string;
    imageUrl?: string | null;
    createdAt: string;
    subject: { id: string; title: string };
    comments: WinnerComment[];
}

export default function TeacherArchivePage() {
    const { data: session } = useSession();
    const [tasks, setTasks] = useState<ArchivedTask[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchMyArchive = useCallback(async () => {
        if (!session?.user?.id) return;
        setLoading(true);

        try {
            // Передаємо authorId поточного вчителя в наш універсальний роут
            const res = await fetch(`/api/daily-tasks/archive?authorId=${session.user.id}&limit=50`);
            if (res.ok) {
                const data = await res.json();
                setTasks(data.tasks || []);
            }
        } catch (err) {
            console.error("Помилка завантаження архіву:", err);
        } finally {
            setLoading(false);
        }
    }, [session?.user?.id]);

    useEffect(() => {
        fetchMyArchive();
    }, [fetchMyArchive]);

    // Функція для відновлення задачі з архіву
    const handleUnarchive = async (taskId: string) => {
        if (!confirm("Відновити задачу з архіву? Вона знову з'явиться в робочому кабінеті.")) return;

        try {
            const res = await fetch(`/api/teacher/daily-tasks/${taskId}/archive`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isClosed: false }),
            });

            if (res.ok) {
                setTasks((prev) => prev.filter((t) => t.id !== taskId));
            } else {
                alert("Не вдалося відновити задачу");
            }
        } catch (err) {
            console.error("Помилка відновлення:", err);
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-4 space-y-6 font-sans">
            <div className="flex items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3">
                    <Link
                        href="/teacher"
                        className="p-2 hover:bg-slate-100 rounded-xl transition text-slate-600 border border-slate-200"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <Archive className="w-6 h-6 text-amber-500" />
                            Мій архів задач
                        </h1>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Завершені задачі, створені вами
                        </p>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="p-8 text-center text-sm text-slate-400 bg-white rounded-2xl border border-slate-200">
                    Завантаження...
                </div>
            ) : tasks.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500 bg-white rounded-2xl border border-slate-200">
                    У вашому архіві немає жодної задачі.
                </div>
            ) : (
                <div className="space-y-4">
                    {tasks.map((task) => (
                        <div key={task.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                                <span className="text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 rounded-full">
                                    {task.subject?.title}
                                </span>
                                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {new Date(task.createdAt).toLocaleDateString("uk-UA")}
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row justify-between gap-4">
                                <div className="space-y-1 flex-1">
                                    <h3 className="text-base font-bold text-slate-800">{task.title}</h3>
                                    <p className="text-sm text-slate-600 whitespace-pre-line">{task.description}</p>
                                </div>
                                {task.imageUrl && (
                                    <img src={task.imageUrl} alt={task.title} className="w-24 h-24 object-cover rounded-xl border border-slate-200 shrink-0" />
                                )}
                            </div>

                            {task.comments && task.comments.length > 0 ? (
                                <div className="bg-amber-50/70 border border-amber-200 p-3 rounded-xl space-y-1">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                                        <Trophy className="w-4 h-4 text-amber-600" />
                                        Переможець: {task.comments[0].author.fullName}
                                    </div>
                                    <p className="text-xs text-amber-950 italic">«{task.comments[0].text}»</p>
                                </div>
                            ) : (
                                <div className="text-xs text-slate-400 italic">Переможця не було визначено.</div>
                            )}

                            <div className="flex justify-end pt-2 border-t border-slate-100">
                                <button
                                    onClick={() => handleUnarchive(task.id)}
                                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    Відновити з архіву
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}