/**
 * ==============================================================================
 * ВІДЖЕТ СИСТЕМИ ТА СХОВИЩА (`src/components/admin/SystemAnalyticsTab.tsx`)
 * ==============================================================================
 */

"use client";

import { useEffect, useState } from "react";
import {
    HardDrive,
    ShieldAlert,
    Folder,
    File,
    CheckCircle2,
    ShieldCheck,
    RefreshCw,
    Search
} from "lucide-react";

interface SystemData {
    storage: {
        folderPath: string;
        usedBytes: number;
        usedMB: string;
        limitGB: number;
        percentage: number;
        fileCount: number;
    };
    security: {
        activeSessionsToday: number;
        failedAttempts24h: number;
        securityAlerts: number;
        logs: Array<{
            id: string;
            email: string;
            event: string;
            status: "success" | "warning" | "danger";
            ip: string;
            time: string;
        }>;
    };
}

export default function SystemAnalyticsTab() {
    const [data, setData] = useState<SystemData | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    const fetchSystemData = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/analytics/system");
            if (res.ok) {
                const result = await res.json();
                setData(result);
            }
        } catch (err) {
            console.error("Помилка завантаження системних даних:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSystemData();
    }, []);

    if (loading && !data) {
        return (
            <div className="py-12 text-center space-y-2">
                <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-400 font-medium">Завантаження системної інформації...</p>
            </div>
        );
    }

    if (!data) return null;

    const { storage, security } = data;

    // Фильтрация журнала по логину/email
    const filteredLogs = security.logs.filter((log) =>
        log.email.toLowerCase().includes(searchQuery.toLowerCase().trim())
    );

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. ВИКОРИСТАННЯ ДИСКОВОГО ПРОСТОРУ */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <HardDrive className="w-4 h-4 text-emerald-600" />
                            Використання дискового простору
                        </h3>
                        <button
                            onClick={fetchSystemData}
                            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition"
                            title="Оновити розмір"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Folder className="w-4 h-4 text-amber-500 shrink-0" />
                                    <span className="text-xs font-mono font-bold text-slate-700">{storage.folderPath}</span>
                                </div>
                                <span className="text-xs font-bold text-slate-500">{storage.usedMB} MB</span>
                            </div>

                            <div className="space-y-1.5">
                                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${
                                            storage.percentage > 85 ? "bg-rose-500" : storage.percentage > 60 ? "bg-amber-500" : "bg-emerald-500"
                                        }`}
                                        style={{ width: `${Math.max(2, storage.percentage)}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                                    <span>Зайнято: {storage.percentage}%</span>
                                    <span>Лимит: {storage.limitGB} GB</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 flex items-center gap-3">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                    <File className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-400 font-medium">Всього файлів</p>
                                    <p className="text-sm font-black text-slate-800">{storage.fileCount}</p>
                                </div>
                            </div>

                            <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 flex items-center gap-3">
                                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                                    <HardDrive className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-400 font-medium">Тип сховища</p>
                                    <p className="text-xs font-bold text-slate-800">Локальне (Public)</p>
                                </div>
                            </div>
                        </div>

                        <p className="text-[11px] text-slate-400 italic">
                            * Файли зберігаються локально на сервері в папці <code className="font-mono">/public/uploads</code>.
                        </p>
                    </div>
                </div>

                {/* 2. БЕЗОПАСНОСТЬ И АВТОРИЗАЦИИ */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 text-rose-600" />
                            Спроби авторизації та безпека
                        </h3>
                        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> Захищено
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-0.5">
                            <p className="text-[10px] text-slate-400 font-medium">Сесії за сьогодні</p>
                            <p className="text-lg font-black text-slate-800">{security.activeSessionsToday}</p>
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-0.5">
                            <p className="text-[10px] text-slate-400 font-medium">Невдалі входи (24г)</p>
                            <p className="text-lg font-black text-emerald-600">{security.failedAttempts24h}</p>
                        </div>
                    </div>

                    {/* Поиск по логину и фильтрация */}
                    <div className="space-y-3 pt-1">
                        <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-bold text-slate-700">Останні події</p>
                            <div className="relative w-48">
                                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Пошук за логином..."
                                    className="w-full pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-indigo-500 focus:bg-white transition placeholder:text-slate-400"
                                />
                            </div>
                        </div>

                        {/* Список со скроллбаром */}
                        <div className="space-y-2 max-h-[230px] overflow-y-auto pr-1">
                            {filteredLogs.length === 0 ? (
                                <p className="text-xs text-slate-400 py-6 text-center">Записів не знайдено</p>
                            ) : (
                                filteredLogs.map((log) => (
                                    <div
                                        key={log.id}
                                        className="p-2.5 bg-slate-50/70 hover:bg-slate-50 transition border border-slate-100 rounded-xl flex items-center justify-between gap-2"
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-slate-800 truncate">{log.email}</p>
                                                <p className="text-[10px] text-slate-400">{log.event}</p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <span className="text-[10px] font-mono text-slate-400 block">{log.ip}</span>
                                            <span className="text-[10px] text-slate-400">
                                                {new Date(log.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}