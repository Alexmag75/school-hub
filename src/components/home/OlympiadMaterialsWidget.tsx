"use client";

import Link from "next/link";
import { Zap, Code, ArrowRight, Award } from "lucide-react";

export default function OlympiadMaterialsWidget() {
    return (
        <section id="olympiads" className="space-y-4">
            <div className="border-b pb-3 border-slate-200">
                <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <Award className="w-6 h-6 text-indigo-600" />
                    Підготовка до олімпіад
                </h3>
                <p className="text-slate-500 text-sm">Матеріали, завдання минулих років та корисні посилання за предметами</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Каточка Физика */}
                <Link
                    href="/olympiads/physics"
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4 hover:border-blue-400 hover:shadow-md transition group"
                >
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                        <Zap className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-slate-800 group-hover:text-blue-600 transition">
                            Олімпіада з Фізики
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">
                            Архів задач II-III етапів Всеукраїнської олімпіады з розв&apos;язками та експериментальні завдання.
                        </p>
                        <span className="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-blue-600">
                            Читати матеріали <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                        </span>
                    </div>
                </Link>

                {/* Карточка Информатика */}
                <Link
                    href="/olympiads/informatics"
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4 hover:border-indigo-400 hover:shadow-md transition group"
                >
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                        <Code className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-slate-800 group-hover:text-indigo-600 transition">
                            Олімпіада з Інформатики (IT)
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">
                            Задачі з алгоритмізації, розбір олімпіадних завдань Scratch/Python, алгоритми та структури даних.
                        </p>
                        <span className="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-indigo-600">
                            Читати матеріали <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                        </span>
                    </div>
                </Link>
            </div>
        </section>
    );
}