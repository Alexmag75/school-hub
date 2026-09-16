"use client";

import { useState } from "react";

interface SubjectItem {
    id: string;
    title: string;
}

interface TeacherDailyTasksNewProps {
    subjects: SubjectItem[];
}

export default function TeacherDailyTasksNew({ subjects }: TeacherDailyTasksNewProps) {
    const [subjectId, setSubjectId] = useState<string>("");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [taskDate, setTaskDate] = useState(() => new Date().toISOString().split("T")[0]);
    const [submitting, setSubmitting] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !description.trim()) return;

        setSubmitting(true);
        setStatusMessage(null);

        try {
            const res = await fetch("/api/teacher/daily-tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    subjectId: subjectId || null,
                    title,
                    description,
                    taskDate,
                }),
            });

            if (res.ok) {
                setStatusMessage({ type: "success", text: "Задачу дня успішно опубліковано!" });
                setTitle("");
                setDescription("");
            } else {
                const errorData = await res.json();
                setStatusMessage({ type: "error", text: errorData.error || "Не вдалося зберегти задачу" });
            }
        } catch (err) {
            setStatusMessage({ type: "error", text: "Помилка при з'єднанні з сервером" });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <span>💡</span> Створити «Задачу дня»
                </h3>

                {statusMessage && (
                    <div
                        className={`p-3 text-xs rounded-xl font-medium mb-4 ${
                            statusMessage.type === "success"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                    >
                        {statusMessage.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Предмет</label>
                            <select
                                value={subjectId}
                                onChange={(e) => setSubjectId(e.target.value)}
                                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-amber-500"
                            >
                                <option value="">Загальна задача (без предмета)</option>
                                {subjects.map((sub) => (
                                    <option key={sub.id} value={sub.id}>
                                        {sub.title}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Дата проведення *</label>
                            <input
                                type="date"
                                required
                                value={taskDate}
                                onChange={(e) => setTaskDate(e.target.value)}
                                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-amber-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Заголовок / Назва задачі *</label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Наприклад: Задача на розрахунок сили тертя"
                            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-amber-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Умова задачі *</label>
                        <textarea
                            required
                            rows={4}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Введіть текст умови задачі або запитання..."
                            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-amber-500"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition shadow-sm disabled:opacity-50"
                    >
                        {submitting ? "Опублікування..." : "Опублікувати задачу дня"}
                    </button>
                </form>
            </div>
        </div>
    );
}