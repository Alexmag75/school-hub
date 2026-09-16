"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    UserPlus,
    Users,
    Settings,
    ShieldCheck,
    AlertTriangle,
    RefreshCw,
    Zap,
    ArrowRight
} from "lucide-react";

interface SystemData {
    storage: {
        percentage: number;
        usedMB: string;
    };
    security: {
        failedAttempts24h: number;
        securityAlerts: number;
    };
    errorsCount24h?: number;
}

export default function QuickActionsWidget() {
    const [systemData, setSystemData] = useState<SystemData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchStatus = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/analytics/system");
            if (res.ok) {
                const data = await res.json();
                setSystemData(data);
            }
        } catch (err) {
            console.error("Помилка перевірки статусу:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus();
    }, []);

    // Також заміна звичайних <a> на <Link> запобігає перезавантаженню всієї сторінки при кліку
    const hasErrors = systemData ? (systemData.errorsCount24h ?? 0) > 0 : false;
    const hasWarnings = systemData
        ? (systemData.storage.percentage > 85 || systemData.security.failedAttempts24h > 5 || hasErrors)
        : false;

    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6 flex flex-col justify-between h-full">
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    Швидкі дії
                </h3>

                <div className="space-y-2.5">
                    <Link
                        href="/admin/users?action=new"
                        className="w-full flex items-center gap-3 p-3 bg-blue-50/80 text-blue-700 rounded-xl hover:bg-blue-100 transition text-xs font-bold"
                    >
                        <UserPlus className="w-4 h-4 shrink-0" />
                        <span>Додати користувача</span>
                    </Link>

                    <Link
                        href="/admin/classes"
                        className="w-full flex items-center gap-3 p-3 bg-emerald-50/80 text-emerald-700 rounded-xl hover:bg-emerald-100 transition text-xs font-bold"
                    >
                        <Users className="w-4 h-4 shrink-0" />
                        <span>Управління класами</span>
                    </Link>

                    <Link
                        href="/admin/settings"
                        className="w-full flex items-center gap-3 p-3 bg-slate-50 text-slate-700 rounded-xl hover:bg-slate-100 transition text-xs font-bold"
                    >
                        <Settings className="w-4 h-4 shrink-0" />
                        <span>Налаштування системи</span>
                    </Link>
                </div>
            </div>

            {/* ДИНАМІЧНИЙ БЛОК СТАТУСУ */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Статус платформи
                    </span>
                    <button
                        onClick={fetchStatus}
                        className="text-slate-400 hover:text-slate-600 transition p-1 rounded hover:bg-slate-100"
                        title="Оновити"
                    >
                        <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
                    </button>
                </div>

                {loading && !systemData ? (
                    /* Скелетон із фіксованою висотою, щоб інтерфейс не "стрибав" під час завантаження */
                    <div className="h-[62px] w-full bg-slate-100 animate-pulse rounded-xl flex items-center justify-center">
                        <span className="text-xs text-slate-400">Завантаження статусу...</span>
                    </div>
                ) : hasWarnings ? (
                    <Link
                        href="/admin/logs"
                        className="p-3 bg-rose-50 border border-rose-200/80 rounded-xl text-rose-900 flex items-start justify-between gap-2 hover:bg-rose-100/70 transition group cursor-pointer block"
                    >
                        <div className="flex items-start gap-2.5">
                            <AlertTriangle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                            <div className="text-xs space-y-0.5">
                                <p className="font-bold text-rose-700">Виявлено проблеми</p>
                                <p className="text-[11px] text-rose-600 leading-tight">
                                    {hasErrors
                                        ? `Зареєстровано ${systemData?.errorsCount24h} помилок за 24г.`
                                        : systemData && systemData.storage.percentage > 85
                                            ? `Сховище заповнено на ${systemData.storage.percentage}%.`
                                            : `Виявлено ${systemData?.security.failedAttempts24h} спроб входу.`}
                                </p>
                            </div>
                        </div>
                        <span className="text-rose-500 group-hover:translate-x-1 transition-transform">
                            <ArrowRight className="w-4 h-4 mt-1" />
                        </span>
                    </Link>
                ) : (
                    <div className="p-3 bg-emerald-50/80 border border-emerald-100 rounded-xl text-emerald-900 flex items-start gap-2.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                        <div className="text-xs space-y-0.5">
                            <p className="font-bold">Все працює штатно</p>
                            <p className="text-[11px] text-emerald-700 leading-tight">
                                Критичних помилок та переповнення сховища не виявлено.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}