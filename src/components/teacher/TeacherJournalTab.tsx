"use client";

import Link from "next/link";

interface ClassItem {
    id: string;
    name: string;
}

interface TeacherJournalTabProps {
    classes: ClassItem[];
}

export default function TeacherJournalTab({ classes }: TeacherJournalTabProps) {
    return (
        <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-800">📊 Електронний журнал</h3>
            <p className="text-xs text-slate-500">
                Оберіть клас для перегляду та ведення журналів успішності учнів:
            </p>

            {classes.length === 0 ? (
                <p className="text-xs text-slate-400">Список класів порожній.</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {classes.map((cls) => (
                        <Link
                            key={cls.id}
                            href={`/teacher/journal?classId=${cls.id}`}
                            className="p-4 bg-slate-50 border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 rounded-2xl transition flex items-center justify-between group"
                        >
              <span className="font-bold text-sm text-slate-800 group-hover:text-indigo-700">
                Журнал {cls.name}
              </span>
                            <span className="text-indigo-600 font-bold text-xs">Переглянути ➔</span>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}