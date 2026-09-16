/**
 * ==============================================================================
 * ВІДЖЕТ АНАЛІТИКИ КОРИСТУВАЧІВ ТА КОНТЕНТУ (`src/components/admin/UsersAnalyticsTab.tsx`)
 * ==============================================================================
 */

"use client";

import { useEffect, useState } from "react";
import { Users, TrendingUp, FileText, Eye, Download, Shield, GraduationCap, School } from "lucide-react";

interface UsersData {
    metrics: {
        dau: number;
        mau: number;
        stickiness: number;
        totalUsers: number;
        roles: {
            students: number;
            teachers: number;
            admins: number;
        };
    };
    topMaterials: Array<{
        id: string;
        title: string;
        type?: string;
        viewsCount: number;
        downloadsCount: number;
        createdAt: string;
        author?: {
            name: string;
            role: string;
        };
    }>;
}

export default function UsersAnalyticsTab() {
    const [data, setData] = useState<UsersData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchUsersData() {
            try {
                const res = await fetch("/api/admin/analytics/users");
                if (res.ok) {
                    const result = await res.json();
                    setData(result);
                }
            } catch (err) {
                console.error("Помилка завантаження даних користувачів:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchUsersData();
    }, []);

    if (loading) {
        return (
            <div className="py-12 text-center space-y-2">
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-400 font-medium">Завантаження метрик користувачів...</p>
            </div>
        );
    }

    if (!data) return null;

    const { metrics, topMaterials } = data;

    return (
        <div className="space-y-6">
            {/* СЕТКА МЕТРИК АКТИВНОСТИ */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* DAU */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
                    <div className="flex items-center justify-between text-slate-500">
                        <span className="text-[11px] font-bold uppercase tracking-wider">Daily Active (DAU)</span>
                        <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                            <TrendingUp className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="flex items-baseline justify-between">
                        <p className="text-2xl font-black text-slate-800">{metrics.dau}</p>
                        <span className="text-xs text-slate-400">користувачів сьогодні</span>
                    </div>
                </div>

                {/* MAU */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
                    <div className="flex items-center justify-between text-slate-500">
                        <span className="text-[11px] font-bold uppercase tracking-wider">Monthly Active (MAU)</span>
                        <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                            <Users className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="flex items-baseline justify-between">
                        <p className="text-2xl font-black text-slate-800">{metrics.mau}</p>
                        <span className="text-xs text-slate-400">за 30 днів</span>
                    </div>
                </div>

                {/* Sticky Index */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
                    <div className="flex items-center justify-between text-slate-500">
                        <span className="text-[11px] font-bold uppercase tracking-wider">Индекс удержания</span>
                        <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                            DAU / MAU
                        </span>
                    </div>
                    <div className="flex items-baseline justify-between">
                        <p className="text-2xl font-black text-slate-800">{metrics.stickiness}%</p>
                        <span className="text-xs text-slate-400">лояльність користувачів</span>
                    </div>
                </div>

                {/* Всього користувачів */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
                    <div className="flex items-center justify-between text-slate-500">
                        <span className="text-[11px] font-bold uppercase tracking-wider">Всього в системі</span>
                        <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                            <School className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="flex items-baseline justify-between">
                        <p className="text-2xl font-black text-slate-800">{metrics.totalUsers}</p>
                        <span className="text-xs text-slate-400">аккаунтів</span>
                    </div>
                </div>
            </div>

            {/* ДВЕ КОЛОНКИ: РАСПРЕДЕЛЕНИЕ РОЛЕЙ И ТОП КОНТЕНТА */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Разбивка по ролям */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 pb-3 border-b border-slate-100">
                        <Users className="w-4 h-4 text-indigo-600" />
                        Розподіл ролей
                    </h3>

                    <div className="space-y-4">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                                    <GraduationCap className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-700">Учні</p>
                                    <p className="text-[10px] text-slate-400">Здобувачі освіти</p>
                                </div>
                            </div>
                            <span className="text-sm font-black text-slate-800">{metrics.roles.students}</span>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                                    <School className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-700">Вчителі</p>
                                    <p className="text-[10px] text-slate-400">Викладацький склад</p>
                                </div>
                            </div>
                            <span className="text-sm font-black text-slate-800">{metrics.roles.teachers}</span>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-rose-100 text-rose-700 rounded-lg">
                                    <Shield className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-700">Адміністратори</p>
                                    <p className="text-[10px] text-slate-400">Керування системою</p>
                                </div>
                            </div>
                            <span className="text-sm font-black text-slate-800">{metrics.roles.admins}</span>
                        </div>
                    </div>
                </div>

                {/* Топ популярных материалов */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4 lg:col-span-2">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-purple-600" />
                            Популярний контент (Перегляди та Скачування)
                        </h3>
                        <span className="text-xs text-slate-400">Топ 6</span>
                    </div>

                    <div className="space-y-3">
                        {topMaterials.length === 0 ? (
                            <p className="text-xs text-slate-400 text-center py-8">Матеріали відсутні</p>
                        ) : (
                            topMaterials.map((item) => (
                                <div
                                    key={item.id}
                                    className="p-3.5 bg-slate-50/70 hover:bg-slate-50 transition border border-slate-100 rounded-xl flex items-center justify-between gap-4"
                                >
                                    <div className="min-w-0 flex-1 space-y-0.5">
                                        <p className="text-xs font-bold text-slate-800 truncate">{item.title}</p>
                                        <p className="text-[10px] text-slate-400 truncate">
                                            Автор: {item.author?.name || "Система"}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-4 shrink-0">
                                        <div className="flex items-center gap-1 text-slate-600 text-xs font-medium">
                                            <Eye className="w-3.5 h-3.5 text-slate-400" />
                                            <span>{item.viewsCount ?? 0}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-slate-600 text-xs font-medium">
                                            <Download className="w-3.5 h-3.5 text-slate-400" />
                                            <span>{item.downloadsCount ?? 0}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}