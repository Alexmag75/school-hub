"use client";

import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import Link from "next/link";

interface Student {
    _id: string;
    name: string;
    surname: string;
    points?: number;
    completedLessons?: number;
    classId?: { name: string } | string;
}

export default function TopStudentsWidget() {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchTop() {
            try {
                const res = await fetch("/api/home/top-students");
                if (res.ok) {
                    const data = await res.json();
                    setStudents(data);
                }
            } catch (err) {
                console.error("Помилка завантаження топу учнів:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchTop();
    }, []);

    const medals = ["🥇", "🥈", "🥉"];
    const cardBorders = ["border-amber-300 shadow-amber-100", "border-slate-300", "border-amber-700/30"];
    const avatarBg = ["bg-amber-100 text-amber-800 border-amber-300", "bg-slate-100 text-slate-800 border-slate-300", "bg-orange-100 text-amber-900 border-amber-600/30"];

    return (
        <section id="top-students" className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b pb-3 border-slate-200 gap-2">
                <div>
                    <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Trophy className="w-6 h-6 text-amber-500" />
                        Рейтинг найкращих учнів
                    </h3>
                    <p className="text-slate-500 text-sm">Лідери за виконаними уроками та набраними балами</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href="/rating"
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
                    >
                        Весь рейтинг ➔
                    </Link>
                    <span className="text-xs bg-amber-100 text-amber-800 font-bold px-3 py-1 rounded-full border border-amber-200">
                        Топ місяця
                    </span>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 animate-pulse space-y-3">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-slate-200 rounded-full" />
                                <div className="space-y-2 flex-1">
                                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : students.length === 0 ? (
                <div className="bg-white p-6 rounded-2xl border text-center text-slate-500 text-sm">
                    Учнів у рейтингу поки немає
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {students.map((student, index) => {
                        const className = typeof student.classId === "object" ? student.classId?.name : "Учень";
                        const initials = `${student.name?.[0] || ""}${student.surname?.[0] || ""}`;

                        return (
                            <div
                                key={student._id}
                                className={`bg-white p-6 rounded-2xl shadow-sm border ${cardBorders[index] || "border-slate-200"} relative overflow-hidden hover:shadow-md transition`}
                            >
                                <div className="absolute top-3 right-3 text-2xl">{medals[index]}</div>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className={`w-12 h-12 rounded-full font-bold flex items-center justify-center text-lg border-2 ${avatarBg[index] || "bg-slate-100"}`}>
                                        {initials || "УЧ"}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800">{student.name} {student.surname}</h4>
                                        <p className="text-xs text-slate-500">{className}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                                    <div>
                                        <span className="text-slate-400">Бали:</span>{" "}
                                        <strong className="text-slate-800">{student.points || 0}</strong>
                                    </div>
                                    <div>
                                        <span className="text-slate-400">Уроки:</span>{" "}
                                        <strong className="text-slate-800">{student.completedLessons || 0}</strong>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
}