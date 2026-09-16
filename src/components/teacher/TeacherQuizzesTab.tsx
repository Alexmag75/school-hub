"use client";

import { useState } from "react";
import Link from "next/link";

interface ClassItem {
    id: string;
    name: string;
}

interface SubjectItem {
    id: string;
    title: string;
}

interface QuizItem {
    id: string;
    title: string;
    createdAt: string;
    subject?: { id: string; title: string };
    classCategory?: { id: string; name: string };
}

interface TeacherQuizzesTabProps {
    quizzes: QuizItem[];
    classes: ClassItem[];
    subjects: SubjectItem[];
}

export default function TeacherQuizzesTab({
                                              quizzes,
                                              classes,
                                              subjects,
                                          }: TeacherQuizzesTabProps) {
    const [selectedClass, setSelectedClass] = useState<string>("");
    const [selectedSubject, setSelectedSubject] = useState<string>("");

    const filteredQuizzes = quizzes.filter((quiz) => {
        const matchClass = selectedClass ? quiz.classCategory?.id === selectedClass : true;
        const matchSubject = selectedSubject ? quiz.subject?.id === selectedSubject : true;
        return matchClass && matchSubject;
    });

    return (
        <div className="space-y-6">
            {/* Фільтри */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-wrap gap-4 items-center">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Фільтри:</span>

                <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
                >
                    <option value="">Всі класи</option>
                    {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                            {cls.name}
                        </option>
                    ))}
                </select>

                <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
                >
                    <option value="">Всі предмети</option>
                    {subjects.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                            {sub.title}
                        </option>
                    ))}
                </select>

                {(selectedClass || selectedSubject) && (
                    <button
                        onClick={() => {
                            setSelectedClass("");
                            setSelectedSubject("");
                        }}
                        className="text-xs text-red-500 hover:underline font-semibold ml-auto"
                    >
                        Скинути фільтри
                    </button>
                )}
            </div>

            {/* Список тестів */}
            <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-800">📝 Мої тести та контрольні роботи</h3>
                {filteredQuizzes.length === 0 ? (
                    <p className="text-xs text-slate-400">Тестів не знайдено за обраними фільтрами.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredQuizzes.map((item) => (
                            <div
                                key={item.id}
                                className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between space-y-3"
                            >
                                <div>
                                    <div className="flex justify-between items-start gap-2 mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700">
                      {item.classCategory?.name || "Клас не вказано"}
                    </span>
                                        <span className="text-[10px] text-slate-400 font-semibold">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                                    </div>
                                    <h4 className="font-bold text-sm text-slate-900 line-clamp-2">{item.title}</h4>
                                </div>
                                <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs">
                                    <span className="text-slate-500 font-medium">{item.subject?.title}</span>
                                    <Link
                                        href={`/teacher/quizzes/edit/${item.id}`}
                                        className="text-emerald-600 hover:underline font-bold"
                                    >
                                        Редагувати ✏️
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}