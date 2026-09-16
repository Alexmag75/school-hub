/**
 * ==============================================================================
 * КОМПОНЕНТ ДЗВІНОЧКА СПОВІЩЕНЬ (`src/components/layout/NotificationBell.tsx`)
 * ==============================================================================
 * @description Клієнтський інтерактивний компонент сповіщень для користувача.
 *              Забезпечує:
 *              1. Асинхронне завантаження списку сповіщень через сервіс.
 *              2. Відображення індикатора непрочитаних повідомлень з анімацією.
 *              3. Випадаюче меню з історією сповіщень (попередження про дедлайни,
 *                 нові оцінки, призначення або досягнення).
 *              4. Кнопки «Прочитати все» та відмітку про прочитання окремих елементів.
 *              5. Обробку кліків поза межами компонента для закриття меню.
 * ==============================================================================
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { StudentNotification } from "@/types/notification";
import { notificationService } from "@/services/notificationService";

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<StudentNotification[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Завантаження сповіщень з API при монтуванні компонента
    useEffect(() => {
        async function loadNotifications() {
            try {
                const data = await notificationService.fetchMyNotifications();
                // Гарантуємо, що обробляємо саме масив даних
                setNotifications(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("Помилка завантаження сповіщень:", err);
                setNotifications([]);
            } finally {
                setLoading(false);
            }
        }

        loadNotifications();
    }, []);

    // Закриття випадаючого списку при кліку за його межами
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Підрахунок кількості непрочитаних сповіщень
    const unreadCount = notifications.filter((n) => !n.isRead).length;

    // Обробник відмітки всіх сповіщень як прочитаних
    const handleMarkAllAsRead = async () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        try {
            await notificationService.markAllAsRead();
        } catch (err) {
            console.error("Не вдалося оновити статус сповіщень на сервері", err);
        }
    };

    // Обробник відмітки конкретного сповіщення як прочитаного
    const handleMarkAsRead = async (id: string, isRead: boolean) => {
        if (isRead) return;

        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );

        try {
            await notificationService.markAsRead(id);
        } catch (err) {
            console.error("Помилка оновлення статусу", err);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Кнопка-дзвіночок з бейджем кількості */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center justify-center focus:outline-none"
                title="Сповіщення"
            >
                <span className="text-lg">🔔</span>
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                        {unreadCount}
                    </span>
                )}
            </button>

            {/* Випадаюче вікно зі списком сповіщень */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-sm text-slate-800">Сповіщення</h3>
                            {unreadCount > 0 && (
                                <span className="bg-blue-100 text-blue-700 text-[11px] font-extrabold px-2 py-0.5 rounded-full">
                                    +{unreadCount} нових
                                </span>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 transition"
                            >
                                Прочитати все
                            </button>
                        )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                        {loading ? (
                            <div className="p-8 text-center text-xs text-slate-400">
                                Завантаження сповіщень...
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center text-xs text-slate-400">
                                Немає нових сповіщень
                            </div>
                        ) : (
                            notifications.map((item) => (
                                <div
                                    key={item.id}
                                    onClick={() => handleMarkAsRead(item.id, item.isRead)}
                                    className={`p-3.5 transition cursor-pointer flex items-start gap-3 hover:bg-slate-50 ${
                                        !item.isRead ? "bg-blue-50/40" : ""
                                    }`}
                                >
                                    {/* Іконка типу сповіщення */}
                                    <div className="text-xl shrink-0 mt-0.5">
                                        {item.type === "DEADLINE_WARNING" && "⏳"}
                                        {item.type === "GRADE_RECEIVED" && "🌟"}
                                        {item.type === "NEW_ASSIGNMENT" && "📚"}
                                        {item.type === "ACHIEVEMENT_UNLOCKED" && "🏆"}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-1 mb-0.5">
                                            <p className={`text-xs ${!item.isRead ? "font-bold text-slate-900" : "font-semibold text-slate-700"}`}>
                                                {item.title}
                                            </p>
                                            {!item.isRead && (
                                                <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">
                                            {item.message}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}