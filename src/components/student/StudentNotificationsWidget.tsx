/**
 * ==============================================================================
 * ВІДЖЕТ СПОВІЩЕНЬ УЧНЯ (`src/components/student/StudentNotificationsWidget.tsx`)
 * ==============================================================================
 * @description Клієнтський віджет для відображення актуальних непрочитаних
 *              сповіщень учня у бічній панелі кабінету. Забезпечує:
 *              1. Фільтрацію виключно непрочитаних повідомлень (до 3 штук).
 *              2. Інтерактивну позначку про прочитання клієнтом по картці.
 *              3. Бейджі кількості нових сповіщень та назв предметів.
 * ==============================================================================
 */

"use client";

import { StudentNotification } from "@/types/notification";

interface Props {
    notifications?: StudentNotification[];
    onMarkAsRead?: (id: string) => void;
}

export default function StudentNotificationsWidget({ notifications = [], onMarkAsRead }: Props) {
    // Показуємо лише перші 3 НЕПРОЧИТАНІ сповіщення
    const unreadNotifications = notifications.filter((n) => !n.isRead).slice(0, 3);

    return (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            {/* Шапка віджета зі статусом нових сповіщень */}
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                    <span>🔔</span> Сповіщення
                </h3>
                {unreadNotifications.length > 0 ? (
                    <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-lg">
                        {unreadNotifications.length} нових
                    </span>
                ) : (
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg">
                        Все прочитано
                    </span>
                )}
            </div>

            {/* Список сповіщень або стан відсутності нових повідомлень */}
            <div className="space-y-2.5">
                {unreadNotifications.length === 0 ? (
                    <div className="text-center py-4 space-y-1">
                        <p className="text-xl">🎉</p>
                        <p className="text-xs text-slate-400 font-medium">Нових сповіщень немає</p>
                    </div>
                ) : (
                    unreadNotifications.map((n) => (
                        <div
                            key={n.id}
                            onClick={() => onMarkAsRead && onMarkAsRead(n.id)}
                            className="p-3 rounded-xl bg-blue-50/50 border border-blue-100 hover:border-blue-300 transition space-y-1 cursor-pointer group relative"
                        >
                            <div className="flex items-center justify-between text-xs font-bold">
                                <span className="text-slate-800 truncate pr-2">{n.title}</span>
                                {n.subjectName && (
                                    <span className="text-[10px] text-blue-600 font-extrabold bg-blue-100/60 px-1.5 py-0.5 rounded shrink-0">
                                        {n.subjectName}
                                    </span>
                                )}
                            </div>
                            <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                                {n.message}
                            </p>
                            <div className="pt-1 flex justify-end">
                                <span className="text-[10px] text-blue-600 font-bold opacity-0 group-hover:opacity-100 transition">
                                    Позначити прочитаним ✓
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}