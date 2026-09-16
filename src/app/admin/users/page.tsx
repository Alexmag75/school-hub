"use client";

/**
 * ==============================================================================
 * ГОЛОВНА СТОРІНКА УПРАВЛІННЯ КОРИСТУВАЧАМИ (`src/app/admin/users/page.tsx`)
 * ==============================================================================
 * @description Центральна панель адміністратора для перегляду, фільтрації,
 *              експорту та управління обліковими записами вчителів і учнів.
 *              Підтримує:
 *              - Фільтрацію за ролями, класами, предметами та текстовим пошуком.
 *              - Скидання паролів користувачів із виводом у модальне вікно.
 *              - Модальне підтвердження та видалення акаунтів.
 *              - Експорт відфільтрованого списку в Excel.
 *
 * @tech_stack React (useState, useEffect, useMemo), Next.js App Router,
 *             Tailwind CSS, Excel Export Service.
 * ==============================================================================
 */

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";

// Типи та сервіси
import { User } from "@/types/user";
import { userService } from "@/services/userService";
import { exportUsersToExcel } from "@/services/exportService";
import { getUserClasses, getUserSubjects } from "@/utils/userUtils";

// Дочірні UI-компоненти та модальні вікна
import { UserFilterPanel } from "@/components/admin/users/UserFilterPanel";
import { UsersTable } from "@/components/admin/users/UsersTable";
import { PasswordResetModal } from "@/components/admin/users/PasswordResetModal";
import { DeleteUserModal } from "@/components/admin/users/DeleteUserModal";

export default function AdminUsersPage() {
    // --------------------------------------------------------------------------
    // ОСНОВНІ СТАНТИ ДАНИХ (DATA STATES)
    // --------------------------------------------------------------------------

    /** Повний масив користувачів, завантажений із сервера */
    const [users, setUsers] = useState<User[]>([]);

    /** Прапорець завантаження списку */
    const [loading, setLoading] = useState(true);

    // --------------------------------------------------------------------------
    // СТАН ФІЛЬТРАЦІЇ ТА ПОШУКУ (FILTER STATES)
    // --------------------------------------------------------------------------

    /** Пошуковий рядок (ім'я або Email) */
    const [search, setSearch] = useState("");

    /** Вкладка ролі ("ALL" | "STUDENT" | "TEACHER" | "ADMIN") */
    const [activeTab, setActiveTab] = useState<string>("ALL");

    /** Фільтр за класом ("ALL" або назва класу) */
    const [selectedClass, setSelectedClass] = useState<string>("ALL");

    /** Фільтр за предметом ("ALL" або назва предмета) */
    const [selectedSubject, setSelectedSubject] = useState<string>("ALL");

    // --------------------------------------------------------------------------
    // СТАН МОДАЛЬНИХ ВІКОН (MODAL STATES)
    // --------------------------------------------------------------------------

    /** Дані згенерованого пароля для модального вікна успішного скидання */
    const [newPasswordData, setNewPasswordData] = useState<{ pass: string; user: User } | null>(null);

    /** Статус копіювання нового пароля в буфер обміну */
    const [copied, setCopied] = useState(false);

    /** Об'єкт користувача, якого готуються видалити */
    const [deletingUser, setDeletingUser] = useState<User | null>(null);

    /** Стан індикатора видалення користувача */
    const [deleteLoading, setDeleteLoading] = useState(false);

    // --------------------------------------------------------------------------
    // ПЕРВИННЕ ЗАВАНТАЖЕННЯ СПИСКУ КОРИСТУВАЧІВ
    // --------------------------------------------------------------------------
    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await userService.getAll();
            setUsers(data);
        } catch (err) {
            console.error("Помилка при завантаженні користувачів:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // --------------------------------------------------------------------------
    // МЕМОЇЗОВАНІ СПИСКИ КЛАСІВ ТА ПРЕДМЕТІВ ДЛЯ ФІЛЬТРІВ
    // --------------------------------------------------------------------------

    /** Отримання унікального відсортованого списку класів серед усіх користувачів */
    const availableClasses = useMemo(() => {
        const classNamesSet = new Set<string>();
        users.forEach((u) => getUserClasses(u).forEach((c) => classNamesSet.add(c.name)));
        return Array.from(classNamesSet).sort();
    }, [users]);

    /** Отримання унікального відсортованого списку предметів серед усіх користувачів */
    const availableSubjects = useMemo(() => {
        const subjectsSet = new Set<string>();
        users.forEach((u) => getUserSubjects(u).forEach((s) => subjectsSet.add(s.title)));
        return Array.from(subjectsSet).sort();
    }, [users]);

    /** Перевірка наявності хоча б одного активного фільтра */
    const hasActiveFilters = useMemo(() => {
        return activeTab !== "ALL" || search.trim() !== "" || selectedClass !== "ALL" || selectedSubject !== "ALL";
    }, [activeTab, search, selectedClass, selectedSubject]);

    /** Скидання всіх установлених фільтрів до початкового стану */
    const resetFilters = () => {
        setActiveTab("ALL");
        setSearch("");
        setSelectedClass("ALL");
        setSelectedSubject("ALL");
    };

    // --------------------------------------------------------------------------
    // ФІЛЬТРАЦІЯ СПИСКУ КОРИСТУВАЧІВ
    // --------------------------------------------------------------------------
    const filteredUsers = useMemo(() => {
        return users.filter((u) => {
            // Фільтр за роллю
            const matchesTab = activeTab === "ALL" || u.role === activeTab;

            // Фільтр за пошуковим рядком (ПІБ або Email)
            const userName = (u.fullName || u.lastName || "").toLowerCase();
            const matchesSearch = userName.includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());

            // Фільтр за прикріпленим класом
            const hasClass = selectedClass === "ALL" || getUserClasses(u).some((c) => c.name === selectedClass);

            // Фільтр за предметом
            const matchesSubject = selectedSubject === "ALL" || getUserSubjects(u).some((s) => s.title === selectedSubject);

            return matchesTab && matchesSearch && hasClass && matchesSubject;
        });
    }, [users, activeTab, search, selectedClass, selectedSubject]);

    // --------------------------------------------------------------------------
    // ОБРОБНИКИ ДІЙ (HANDLERS)
    // --------------------------------------------------------------------------

    /** Скидання пароля користувача та відкриття модального вікна з новим паролем */
    const handleResetPassword = async (user: User) => {
        try {
            const newPassword = await userService.resetPassword(user.id);
            setNewPasswordData({ pass: newPassword, user });
        } catch (err: any) {
            alert(err.message || "Помилка мережі при скиданні пароля");
        }
    };

    /** Підтвердження та видалення користувача */
    const handleDeleteUser = async () => {
        if (!deletingUser) return;
        setDeleteLoading(true);
        try {
            await userService.deleteUser(deletingUser.id);
            setUsers((prev) => prev.filter((u) => u.id !== deletingUser.id));
            setDeletingUser(null);
        } catch (err: any) {
            alert(err.message || "Помилка при видаленні користувача");
        } finally {
            setDeleteLoading(false);
        }
    };

    /** Скопіювати текст у буфер обміну */
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // --------------------------------------------------------------------------
    // РЕНДЕР ОСНОВНОГО СТОРІНКОВОГО ІНТЕРФЕЙСУ
    // --------------------------------------------------------------------------
    return (
        <div className="space-y-6">

            {/* ШАПКА СТОРІНКИ ТА КНОПКИ ДІЙ */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Список користувачів</h1>
                    <p className="text-gray-500 text-sm">Управління акаунтами вчителів та учнів</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    {/* Кнопка експорту в Excel */}
                    <button
                        type="button"
                        onClick={() => exportUsersToExcel(filteredUsers)}
                        disabled={filteredUsers.length === 0}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-lg text-sm shadow-sm transition inline-flex items-center gap-2 disabled:opacity-50"
                    >
                        <span>📊</span> Експортувати в Excel
                    </button>

                    {/* Кнопка переходу на сторінку створення */}
                    <Link
                        href="/admin/users/create"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg text-sm shadow-sm transition inline-flex items-center justify-center gap-2"
                    >
                        <span>+</span> Створити користувача
                    </Link>
                </div>
            </div>

            {/* ПАНЕЛЬ ФІЛЬТРІВ ТА ПОШУКУ */}
            <UserFilterPanel
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                search={search}
                setSearch={setSearch}
                selectedClass={selectedClass}
                setSelectedClass={setSelectedClass}
                selectedSubject={selectedSubject}
                setSelectedSubject={setSelectedSubject}
                availableClasses={availableClasses}
                availableSubjects={availableSubjects}
                hasActiveFilters={hasActiveFilters}
                onResetFilters={resetFilters}
            />

            {/* ТАБЛИЦЯ КОРИСТУВАЧІВ */}
            <UsersTable
                users={filteredUsers}
                loading={loading}
                hasActiveFilters={hasActiveFilters}
                onResetFilters={resetFilters}
                onResetPassword={handleResetPassword}
                onDelete={setDeletingUser}
            />

            {/* МОДАЛЬНЕ ВІКНО НОВОГО ПАРОЛЯ */}
            {newPasswordData && (
                <PasswordResetModal
                    data={newPasswordData}
                    copied={copied}
                    onCopy={copyToClipboard}
                    onClose={() => setNewPasswordData(null)}
                />
            )}

            {/* МОДАЛЬНЕ ВІКНО ПІДТВЕРДЖЕННЯ ВИДАЛЕННЯ */}
            {deletingUser && (
                <DeleteUserModal
                    user={deletingUser}
                    loading={deleteLoading}
                    onConfirm={handleDeleteUser}
                    onCancel={() => setDeletingUser(null)}
                />
            )}
        </div>
    );
}