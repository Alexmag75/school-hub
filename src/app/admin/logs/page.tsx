/**
 * ==============================================================================
 * СТОРІНКА ЖУРНАЛУ СИСТЕМНИХ ПОМИЛОК (`src/app/admin/logs/page.tsx`)
 * ==============================================================================
 */


import { ArrowLeft, ShieldAlert } from "lucide-react";
import Link from "next/link";
import SystemLogsWidget from "@/components/admin/Logs/SystemLogsWidget";

export default function AdminLogsPage() {
    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Хлібні крихти та заголовок */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <Link
                        href="/admin"
                        className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition font-medium mb-1"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Повернутися в панель
                    </Link>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
                        <ShieldAlert className="w-7 h-7 text-rose-600" />
                        Журнал системних помилок
                    </h1>
                    <p className="text-xs text-slate-500">
                        Моніторинг клієнтських та серверних збоїв платформи у реальному часі
                    </p>
                </div>
            </div>

            {/* Віджет зі списком помилок */}
            <SystemLogsWidget />
        </div>
    );
}