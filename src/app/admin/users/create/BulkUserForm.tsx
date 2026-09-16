"use client";

/**
 * ==============================================================================
 * КОМПОНЕНТ ФОРМИ МАСОВОГО СТВОРЕННЯ КОРИСТУВАЧІВ (`BulkUserForm.tsx`)
 * ==============================================================================
 * @description Форма для імпорту всієї групи/класу учнів за списком ПІБ.
 *              Автоматично ґенерує унікальні логіни та паролі для кожного учня,
 *              надсилає пакетний запит на сервер та експортує підсумкові
 *              облікові дані в Excel-файл (.xlsx).
 *
 * @tech_stack React (useState), Next.js Client Components, XLSX / FileSaver (утиліти).
 * ==============================================================================
 */

import { useState } from "react";

// Імпорт інтерфейсів типів даних
import { CreatedUser, SchoolClass } from "@/types/userCreate";

// Імпорт допоміжних утиліт генерації даних та експорту
import { generateLogin, generatePass, exportUsersToExcel } from "@/utils/userCreationUtils";

// Дочірній компонент вибору або створення класу
import { ClassSelector } from "./ClassSelector";

/** Пропси компонента масового імпорту */
interface BulkUserFormProps {
    /** Список наявних класів для вибору */
    availableClasses: SchoolClass[];
    /** Назва поточного обраного класу */
    selectedClass: string;
    /** Функція зміни обраного класу */
    setSelectedClass: (val: string) => void;
    /** Прапорець створення нового класу */
    isCreatingNewClass: boolean;
    /** Перемикач режиму створення нового класу */
    setIsCreatingNewClass: (val: boolean) => void;
    /** Назва нового класу, що створюється */
    newClassName: string;
    /** Функція оновлення назви нового класу */
    setNewClassName: (val: string) => void;
    /** Зворотний виклик при успішному створенні пакету користувачів */
    onSuccess: (created: CreatedUser[], message: string) => void;
    /** Зворотний виклик при виникненні помилки */
    onError: (msg: string) => void;
}

export function BulkUserForm({
                                 availableClasses,
                                 selectedClass,
                                 setSelectedClass,
                                 isCreatingNewClass,
                                 setIsCreatingNewClass,
                                 newClassName,
                                 setNewClassName,
                                 onSuccess,
                                 onError,
                             }: BulkUserFormProps) {
    // --------------------------------------------------------------------------
    // ЛОКАЛЬНИЙ СТАН (LOCAL STATE)
    // --------------------------------------------------------------------------

    /** Необроблений текстовий список ПІБ з текстового поля (по одному на рядок) */
    const [rawNames, setRawNames] = useState("");

    /** Прапорець стану відправки та обробки запиту на сервері */
    const [loading, setLoading] = useState(false);

    // --------------------------------------------------------------------------
    // ОБРОБНИКИ ПОДІЙ (HANDLERS)
    // --------------------------------------------------------------------------

    /**
     * Головна функція масового створення учнів та автоматичного вивантаження Excel
     */
    const handleBulkCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        onError("");

        // 1. Перевірка та визначення цільового класу
        const targetClass = isCreatingNewClass ? newClassName.trim() : selectedClass;
        if (!targetClass) return onError("Будь ласка, оберіть або вкажіть клас");

        // 2. Розбиття текстового блоку на масив окремих ПІБ
        const namesList = rawNames.split("\n").map((n) => n.trim()).filter(Boolean);
        if (namesList.length === 0) return onError("Введіть хоча б одне ім'я");

        setLoading(true);

        // 3. Формування масиву об'єктів нових користувачів із згенерованими логінами та паролями
        const usersToCreate = namesList.map((fullName) => ({
            fullName,
            className: targetClass,
            role: "STUDENT",
            email: generateLogin("student"),
            password: generatePass(),
        }));

        try {
            // 4. Відправка пакетного запиту на сервер
            const res = await fetch("/api/admin/users/bulk", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ users: usersToCreate }),
            });

            const data = await res.json();

            if (!res.ok) {
                onError(data.error || "Не вдалося створити користувачів");
            } else {
                // 5. Нормалізація отриманих від сервера даних про створених користувачів
                const resultList: CreatedUser[] = (data.users || usersToCreate).map((u: any) => ({
                    fullName: u.fullName || u.name,
                    email: u.email,
                    password: u.password || u.pass,
                }));

                // 6. Очищення форми
                setRawNames("");

                // 7. Автоматична генерація та завантаження Excel-файлу
                exportUsersToExcel(resultList, `Клас_${targetClass}`);

                // 8. Передача результатів у батьківський компонент
                onSuccess(
                    resultList,
                    `Успішно створено учнів: ${data.createdCount || usersToCreate.length}. Файл Excel завантажено!`
                );
            }
        } catch {
            onError("Помилка при відправці даних на сервер");
        } finally {
            setLoading(false);
        }
    };

    // --------------------------------------------------------------------------
    // РЕНДЕР ФОРМИ
    // --------------------------------------------------------------------------

    return (
        <form onSubmit={handleBulkCreate} className="space-y-5">
            {/* СЕКЦІЯ НАЛАШТУВАННЯ КЛАСУ ТА РОЛІ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Компонент вибору наявного або введення нового класу */}
                <ClassSelector
                    availableClasses={availableClasses}
                    selectedClass={selectedClass}
                    setSelectedClass={setSelectedClass}
                    isCreatingNewClass={isCreatingNewClass}
                    setIsCreatingNewClass={setIsCreatingNewClass}
                    newClassName={newClassName}
                    setNewClassName={setNewClassName}
                />

                {/* Фіксована роль у режимі масового імпорту */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">Роль в системі</label>
                    <input
                        type="text"
                        disabled
                        value="Учень (STUDENT)"
                        className="mt-1 w-full border border-gray-200 rounded-lg p-2.5 text-sm bg-gray-100 text-gray-500 font-medium cursor-not-allowed"
                    />
                </div>
            </div>

            {/* ВВЕДЕННЯ СПИСКУ ПІБ */}
            <div>
                <label className="block text-sm font-medium text-gray-700">
                    Список ПІБ учнів (кожен з нового рядка)
                </label>
                <p className="text-xs text-gray-400 mb-1">
                    Скопіюйте та вставте список із Word або Excel.
                </p>
                <textarea
                    rows={9}
                    required
                    value={rawNames}
                    onChange={(e) => setRawNames(e.target.value)}
                    placeholder={"Шевченко Тарас Григорович\nУкраїнка Леся Петрівна"}
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none font-mono transition"
                />
            </div>

            {/* ПАНЕЛЬ УПРАВЛІННЯ ТА КНОПКА СТВОРЕННЯ */}
            <div className="flex justify-between items-center pt-2">
                <span className="text-xs text-gray-500 flex items-center gap-1">
                    📥 Файл Excel завантажиться автоматично при створенні.
                </span>

                <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg text-sm transition shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                    {loading ? "Створення..." : "Згенерувати та завантажити Excel"}
                </button>
            </div>
        </form>
    );
}