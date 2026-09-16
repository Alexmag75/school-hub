"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Trash2, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";

interface LogItem {
    id: string;
    level: string;
    message: string;
    stack?: string;
    source?: string;
    userEmail?: string;
    createdAt: string;
}

export default function SystemLogsWidget() {
    const [logs, setLogs] = useState<LogItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/logs?limit=30");
            if (res.ok) {
                const data = await res.json();
                setLogs(data.logs || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const clearLogs = async () => {
        if (!confirm("Ви дійсно бажаєте очистити всі логи?")) return;
        await fetch("/api/admin/logs", { method: "DELETE" });
        fetchLogs();
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b pb-4">
                <div>
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                        Логи системних помилок
                    </h2>
                    <p className="text-xs text-slate-500">
                        Останні зареєстровані проблеми та помилки користувачів
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={fetchLogs}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition"
                        title="Оновити"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                    </button>
                    {logs.length > 0 && (
                        <button
                            onClick={clearLogs}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition"
                            title="Очистити логи"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <p className="text-xs text-slate-400 text-center py-4">Завантаження логів...</p>
            ) : logs.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                    ✅ Помилок не виявлено! Система працює стабільно.
                </div>
            ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                    {logs.map((log) => {
                        const isExpanded = expandedId === log.id;
                        return (
                            <div
                                key={log.id}
                                className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2"
                            >
                                <div
                                    className="flex items-start justify-between cursor-pointer gap-2"
                                    onClick={() => setExpandedId(isExpanded ? null : log.id)}
                                >
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 font-bold rounded text-[10px]">
                        {log.source || "ERROR"}
                      </span>
                                            <span className="text-slate-400 text-[10px]">
                        {new Date(log.createdAt).toLocaleString("uk-UA")}
                      </span>
                                            {log.userEmail && (
                                                <span className="text-blue-600 text-[10px]">👤 {log.userEmail}</span>
                                            )}
                                        </div>
                                        <p className="font-semibold text-slate-800 break-all">{log.message}</p>
                                    </div>
                                    <button className="text-slate-400 hover:text-slate-600 mt-1">
                                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    </button>
                                </div>

                                {/* Детальний stack trace при кліку */}
                                {isExpanded && log.stack && (
                                    <div className="mt-2 p-3 bg-slate-900 text-slate-200 rounded-lg overflow-x-auto font-mono text-[11px] leading-relaxed">
                                        <pre>{log.stack}</pre>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}