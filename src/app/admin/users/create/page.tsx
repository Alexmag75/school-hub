"use client";

/**
 * ==============================================================================
 * СТОРІНКА СТВОРЕННЯ КОРИСТУВАЧІВ (`src/app/admin/users/create/page.tsx`)
 * ==============================================================================
 * @description Головний клієнтський контейнер для управління процесом реєстрації
 *              нових користувачів системи. Підтримує два режими:
 *              1. Масовий імпорт класу з автогенерацією списку та Excel-звіту.
 *              2. Попоштучне додавання окремого користувача (Учень, Вчитель, Адмін).
 *
 * @tech_stack Next.js App Router, React (useState, useEffect), Tailwind CSS.
 * ==============================================================================
 */

import { useState, useEffect } from "react";
import Link from "next/link";

// Імпорт типів даних
import { CreatedUser, SchoolClass, Subject } from "@/types/userCreate";

// Імпорт дочірніх компонентів та форм
import { SingleUserCreatedModal } from "@/components/admin/users/SingleUserCreatedModal";
import { BulkUsersResultTable } from "@/components/admin/users/BulkUsersResultTable";
import { BulkUserForm } from "@/app/admin/users/create/BulkUserForm";
import { SingleUserForm } from "@/app/admin/users/create/SingleUserForm";

export default function CreateUsersPage() {
    // --------------------------------------------------------------------------
    // СТАН РЕЖИМУ ТА ВІДОБРАЖЕННЯ (UI STATE)
    // --------------------------------------------------------------------------

    /** Активний режим створення: "bulk" — масовий, "single" — одиночний */
    const [mode, setMode] = useState<"bulk" | "single">("bulk");

    // --------------------------------------------------------------------------
    // ДОПОМІЖНІ ДАНІ З БАЗИ ДАНИХ ( справочники )
    // --------------------------------------------------------------------------

    /** Список доступних навчальних класів */
    const [availableClasses, setAvailableClasses] = useState<SchoolClass[]>([]);

    /** Поточний обраний клас у випадаючому списку */
    const [selectedClass, setSelectedClass] = useState<string>("");

    /** Список доступних навчальних предметів (для реєстрації вчителів) */
    const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);

    // --------------------------------------------------------------------------
    // СТАН СТВОРЕННЯ НОВОГО КЛАСУ "НА ЛЬОТУ"
    // --------------------------------------------------------------------------

    /** Прапорець перемикання на створення нового класу замість вибору з наявних */
    const [isCreatingNewClass, setIsCreatingNewClass] = useState(false);

    /** Назва нового класу, який створюється разом із користувачами */
    const [newClassName, setNewClassName] = useState("");

    // --------------------------------------------------------------------------
    // СТАН СПОВІЩЕНЬ ТА РЕЗУЛЬТАТІВ (FEEDBACK STATE)
    // --------------------------------------------------------------------------

    /** Повідомлення про помилку виконання операцій */
    const [error, setError] = useState("");

    /** Повідомлення про успішне виконання операції */
    const [success, setSuccess] = useState("");

    /** Список успішно створених користувачів під час масового імпорту */
    const [createdUsers, setCreatedUsers] = useState<CreatedUser[]>([]);

    /** Об'єкт одного створеного користувача для відображення в модальному вікні */
    const [singleCreatedUser, setSingleCreatedUser] = useState<CreatedUser | null>(null);

    // --------------------------------------------------------------------------
    // ПОЧАТКОВЕ ЗАВАНТАЖЕННЯ ДАНИХ (DATA FETCHING)
    // --------------------------------------------------------------------------

    useEffect(() => {
        /**
         * Асинхронна функція для паралельного завантаження списків класів та предметів
         */
        async function fetchData() {
            try {
                const [resClasses, resSubjects] = await Promise.all([
                    fetch("/api/admin/classes"),
                    fetch("/api/admin/subjects"),
                ]);

                // Завантаження класів
                if (resClasses.ok) {
                    const dataClasses = await resClasses.json();
                    setAvailableClasses(dataClasses);
                    if (dataClasses.length > 0) setSelectedClass(dataClasses[0].name);
                }

                // Завантаження предметів
                if (resSubjects.ok) {
                    const dataSubjects = await resSubjects.json();
                    setAvailableSubjects(dataSubjects);
                }
            } catch {
                console.error("Не вдалося завантажити початкові дані");
            }
        }

        fetchData();
    }, []);

    // --------------------------------------------------------------------------
    // РЕНДЕР КЛІЄНТСЬКОГО ІНТЕРФЕЙСУ
    // --------------------------------------------------------------------------

    return (
        <div className="max-w-4xl mx-auto space-y-6">

            {/* ШАПКА СТОРІНКИ */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Реєстрація користувачів</h1>
                    <p className="text-gray-500 text-sm">Швидкий імпорт класу учнів або попоштучне додавання</p>
                </div>

                {/* Кнопка повернення до списку користувачів */}
                <Link
                    href="/admin/users"
                    className="text-sm font-medium text-slate-600 hover:text-slate-900 border px-3 py-1.5 rounded-md bg-white shadow-sm transition"
                >
                    ← До списку
                </Link>
            </div>

            {/* ПЕРЕКЛЮЧЕННЯ РЕЖИМІВ (ВКЛАДКИ) */}
            <div className="flex border-b border-gray-200 bg-white rounded-t-xl px-4 pt-3 gap-4">
                {/* Вкладка 1: Масовий імпорт */}
                <button
                    type="button"
                    onClick={() => { setMode("bulk"); setError(""); setSuccess(""); }}
                    className={`pb-3 text-sm font-semibold border-b-2 transition ${
                        mode === "bulk"
                            ? "border-blue-600 text-blue-600"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                >
                    ⚡ Масовий імпорт класу (Авто-скачування Excel)
                </button>

                {/* Вкладка 2: Одиночне створення */}
                <button
                    type="button"
                    onClick={() => { setMode("single"); setError(""); setSuccess(""); }}
                    className={`pb-3 text-sm font-semibold border-b-2 transition ${
                        mode === "single"
                            ? "border-blue-600 text-blue-600"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                >
                    👤 Один користувач (Вчитель / Адмін / Учень)
                </button>
            </div>

            {/* ОСНОВНИЙ КОНТЕЙНЕР ФОРМИ */}
            <div className="bg-white p-6 rounded-b-xl shadow-sm border border-gray-200 border-t-0">

                {/* Блок відображення системних помилок */}
                {error && (
                    <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100" role="alert">
                        {error}
                    </div>
                )}

                {/* Блок відображення успішного виконання */}
                {success && (
                    <div className="mb-4 text-sm text-emerald-700 bg-emerald-50 p-3 rounded-lg font-medium border border-emerald-100" role="status">
                        {success}
                    </div>
                )}

                {/* Динамічний рендер обраної форми */}
                {mode === "bulk" ? (
                    <BulkUserForm
                        availableClasses={availableClasses}
                        selectedClass={selectedClass}
                        setSelectedClass={setSelectedClass}
                        isCreatingNewClass={isCreatingNewClass}
                        setIsCreatingNewClass={setIsCreatingNewClass}
                        newClassName={newClassName}
                        setNewClassName={setNewClassName}
                        onSuccess={(users, message) => {
                            setCreatedUsers(users);
                            setSuccess(message);
                        }}
                        onError={setError}
                    />
                ) : (
                    <SingleUserForm
                        availableClasses={availableClasses}
                        availableSubjects={availableSubjects}
                        selectedClass={selectedClass}
                        setSelectedClass={setSelectedClass}
                        isCreatingNewClass={isCreatingNewClass}
                        setIsCreatingNewClass={setIsCreatingNewClass}
                        newClassName={newClassName}
                        setNewClassName={setNewClassName}
                        onSuccess={(user) => setSingleCreatedUser(user)}
                        onError={setError}
                    />
                )}

                {/* Таблиця з результатами масового імпорту */}
                <BulkUsersResultTable
                    users={createdUsers}
                    targetClass={isCreatingNewClass ? newClassName : selectedClass}
                />
            </div>

            {/* МОДАЛЬНЕ ВІКНО РЕЗУЛЬТАТУ СТВОРЕННЯ ОДИНОЧНОГО КОРИСТУВАЧА */}
            {singleCreatedUser && (
                <SingleUserCreatedModal
                    user={singleCreatedUser}
                    onClose={() => setSingleCreatedUser(null)}
                />
            )}
        </div>
    );
}