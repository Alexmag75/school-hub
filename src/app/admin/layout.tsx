"use client";

/**
 * ==============================================================================
 * ГОЛОВНИЙ МАКЕТ АДМІНІСТРАТИВНОЇ ПАНЕЛІ (`src/app/admin/layout.tsx`)
 * ==============================================================================
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

interface AdminLayoutProps {
    children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    const pathname = usePathname();

    const navItems = [
        { label: "Аналітика", href: "/admin" },
        { label: "Список користувачів", href: "/admin/users" },
        { label: "Створити користувача", href: "/admin/users/create" },
        { label: "Класи та Предмети", href: "/admin/classes" },
        { label: "Підручники", href: "/admin/textbooks" },
        { label: "Налаштування системи", href: "/admin/settings" },
    ];

    return (
        <div className="flex min-h-screen bg-gray-100 text-gray-800">

            {/* БІЧНА ПАНЕЛЬ НАВІГАЦІЇ (SIDEBAR) */}
            <aside className="w-64 bg-slate-900 text-white flex flex-col justify-between p-4 shadow-lg shrink-0">
                <div>
                    {/* БРЕНДИНГ ТА ЗАГОЛОВОК */}
                    <div className="mb-8 px-2 py-4 border-b border-slate-700">
                        <h1 className="text-xl font-bold tracking-wide text-blue-400">SchoolHub</h1>
                        <p className="text-xs text-slate-400 mt-1">Панель Адміністратора</p>
                    </div>

                    {/* СПИСОК МАРШРУТІВ */}
                    <nav className="space-y-1">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`block px-4 py-2.5 rounded-lg text-sm font-medium text-white transition ${
                                        isActive
                                            ? "bg-blue-600 shadow"
                                            : "hover:bg-slate-800"
                                    }`}
                                >
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* НИЖНІЙ БЛОК: КНОПКА ВИХОДУ З СИСТЕМИ */}
                <div className="pt-4 border-t border-slate-700">
                    <button
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-800 rounded-lg transition"
                    >
                        Вийти з акаунту
                    </button>
                </div>
            </aside>

            {/* ОСНОВНА ОБЛАСТЬ КОНТЕНТУ */}
            <main className="flex-1 p-8 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}