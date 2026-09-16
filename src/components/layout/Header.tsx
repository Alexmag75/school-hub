/**
 * ==============================================================================
 * КОМПОНЕНТ ШАПКИ САЙТУ (`src/components/layout/Header.tsx`)
 * ==============================================================================
 * @description Клієнтський компонент верхньої панелі навігації (Header).
 *              Забезпечує:
 *              1. Динамічний логотип ліцею та перехід на головну сторінку.
 *              2. Основну навігацію по розділах сайту (десктоп + мобільне меню).
 *              3. Інтеграцію системи сповіщень користувача (`NotificationBell`).
 *              4. Динамічне відображення блоку автентифікації.
 * ==============================================================================
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import NotificationBell from "@/components/layout/NotificationBell";
import { Archive, Home, Newspaper, Trophy, Menu, X, LogOut, User } from "lucide-react";

interface HeaderProps {
    initialSettings?: {
        schoolName?: string;
        academicYear?: string;
    };
}

export default function Header({ initialSettings }: HeaderProps) {
    const { data: session, status } = useSession();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const schoolName = initialSettings?.schoolName || "ОЗО Болградський Ліцей";
    const academicYear = initialSettings?.academicYear || "2026-2027";

    const getDashboardLink = () => {
        if (!session?.user) return "/login";
        const role = session.user.role;

        if (role === "ADMIN") return "/admin";
        if (role === "TEACHER") return "/teacher";
        return "/student";
    };

    const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);
    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    return (
        <header className="w-full bg-white shadow-sm border-b border-slate-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-2">

                {/* Логотип платформи */}
                <Link href="/" onClick={closeMobileMenu} className="flex items-center gap-2.5 sm:gap-3 group min-w-0">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-md group-hover:bg-blue-700 transition shrink-0">
                        🎓
                    </div>
                    <div className="min-w-0">
                        <span className="font-extrabold text-slate-900 text-sm sm:text-base md:text-lg tracking-tight block leading-tight truncate">
                            {schoolName}
                        </span>
                        <span className="text-[11px] sm:text-xs text-slate-500 font-medium hidden sm:block">
                            Освітня платформа {academicYear ? `• ${academicYear}` : ""}
                        </span>
                    </div>
                </Link>

                {/* Основне навігаційне меню (Десктоп) */}
                <nav className="hidden md:flex items-center gap-5 lg:gap-6 text-sm font-semibold text-slate-600">
                    <Link href="/" className="flex items-center gap-2 hover:text-blue-600 transition">
                        <Home className="w-4 h-4 text-blue-600" />
                        <span>Головна</span>
                    </Link>

                    <Link href="/news" className="flex items-center gap-2 hover:text-blue-600 transition">
                        <Newspaper className="w-4 h-4 text-blue-600" />
                        <span>Новини</span>
                    </Link>

                    <Link href="/archive" className="flex items-center gap-2 hover:text-amber-600 transition">
                        <Archive className="w-4 h-4 text-amber-500" />
                        <span>Архів задач</span>
                    </Link>

                    <Link href="/rating" className="flex items-center gap-2 hover:text-amber-600 transition">
                        <Trophy className="w-4 h-4 text-amber-500" />
                        <span>Рейтинг</span>
                    </Link>
                </nav>

                {/* Блок авторизації, сповіщень та гамбургер */}
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <NotificationBell />

                    {status === "loading" ? (
                        <div className="text-xs text-slate-400 font-medium px-2 py-1">
                            Завантаження...
                        </div>
                    ) : session ? (
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            <Link
                                href={getDashboardLink()}
                                className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs sm:text-sm px-2.5 sm:px-4 py-2 rounded-xl border border-blue-200 transition flex items-center gap-1.5 whitespace-nowrap"
                            >
                                <User className="w-4 h-4 text-blue-600" />
                                <span className="hidden sm:inline">Мій кабінет</span>
                                <span className="sm:hidden">Кабінет</span>
                            </Link>

                            <button
                                onClick={() => signOut({ callbackUrl: "/" })}
                                className="hidden md:block text-xs text-slate-400 hover:text-red-600 font-medium px-2 py-1 transition"
                                title="Вийти з акаунта"
                            >
                                Вийти
                            </button>
                        </div>
                    ) : (
                        <Link
                            href="/login"
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm px-3.5 sm:px-5 py-2 rounded-xl transition shadow-sm whitespace-nowrap"
                        >
                            Увійти
                        </Link>
                    )}

                    {/* Гамбургер-кнопка для відкриття меню на мобільних */}
                    <button
                        onClick={toggleMobileMenu}
                        className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition focus:outline-none"
                        aria-label="Переключити меню"
                    >
                        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Мобільне меню */}
            {isMobileMenuOpen && (
                <div className="md:hidden border-t border-slate-100 bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg animate-in slide-in-from-top duration-200">
                    <Link
                        href="/"
                        onClick={closeMobileMenu}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                        <Home className="w-4 h-4 text-blue-600" />
                        <span>Головна</span>
                    </Link>

                    <Link
                        href="/news"
                        onClick={closeMobileMenu}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                        <Newspaper className="w-4 h-4 text-blue-600" />
                        <span>Новини</span>
                    </Link>

                    <Link
                        href="/archive"
                        onClick={closeMobileMenu}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                        <Archive className="w-4 h-4 text-amber-500" />
                        <span>Архів задач</span>
                    </Link>

                    <Link
                        href="/rating"
                        onClick={closeMobileMenu}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                        <Trophy className="w-4 h-4 text-amber-500" />
                        <span>Рейтинг</span>
                    </Link>

                    {session && (
                        <>
                            <div className="my-2 border-t border-slate-100" />
                            <button
                                onClick={() => {
                                    closeMobileMenu();
                                    signOut({ callbackUrl: "/" });
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 transition"
                            >
                                <LogOut className="w-4 h-4" />
                                <span>Вийти з акаунта</span>
                            </button>
                        </>
                    )}
                </div>
            )}
        </header>
    );
}