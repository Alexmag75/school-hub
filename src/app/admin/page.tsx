/**
 * ==============================================================================
 * ГОЛОВНА СТОРІНКА АНАЛІТИКИ ТА ОГЛЯДУ АДМІНІСТРАТОРА (`src/app/admin/page.tsx`)
 * ==============================================================================
 */

import Link from "next/link";
import { Users, GraduationCap, BookOpen, ShieldCheck, ArrowRight, UserCheck, Calendar } from "lucide-react";
import { prisma } from "@/lib/prisma";
import AdminAnalyticsTabs from "@/components/admin/AdminAnalyticsTabs";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
    let studentsCount = 0;
    let teachersCount = 0;
    let classesCount = 0;
    let tasksCount = 0;

    try {
        [studentsCount, teachersCount, classesCount, tasksCount] = await Promise.all([
            prisma.user.count({ where: { role: "STUDENT" } }).catch(() => 0),
            prisma.user.count({ where: { role: "TEACHER" } }).catch(() => 0),
            prisma.class?.count().catch(() => 0) || Promise.resolve(0),
            prisma.assignment?.count().catch(() => 0) || Promise.resolve(0),
        ]);
    } catch (error) {
        console.error("Помилка завантаження статистики адміністратора:", error);
    }

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto pb-12">

            {/* 1. ШАПКА СТОРІНКИ */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                        <span>🛡️</span> Аналітика та огляд системи
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Оперативний контроль навчального процесу та користувачів SchoolHub
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Система активна
                    </span>
                </div>
            </div>

            {/* 2. ГЛОБАЛЬНІ СТАТИСТИЧНІ КАРТКИ (KPI - завжди перед очима) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Учнів у системі</span>
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                            <GraduationCap className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-3xl font-black text-slate-800">{studentsCount}</p>
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-blue-600">
                        <span>Зареєстровані здобувачі освіти</span>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Вчителів</span>
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                            <Users className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-3xl font-black text-slate-800">{teachersCount}</p>
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600">
                        <span>Викладацький склад</span>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Класів</span>
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-3xl font-black text-slate-800">{classesCount}</p>
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                        <span>Сформовані навчальні групи</span>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Завдань / Тестів</span>
                        <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                            <BookOpen className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-3xl font-black text-slate-800">{tasksCount}</p>
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-600">
                        <span>Створено матеріалів</span>
                    </div>
                </div>
            </div>

            {/* 3. ВКЛАДКИ АНАЛІТИКИ */}
            <AdminAnalyticsTabs />
        </div>
    );
}