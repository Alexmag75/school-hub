"use client";

/**
 * ==============================================================================
 * КОМПОНЕНТ ВИБОРУ АБО СТВОРЕННЯ КЛАСУ (`ClassSelector.tsx`)
 * ==============================================================================
 * @description Універсальний селектор для перемикання між вибором наявного класу
 *              із випадаючого списку та ручним введенням назви нового класу.
 *              Використовується у формах масового та одиночного створення користувачів.
 *
 * @tech_stack React (Client Component), Tailwind CSS.
 * ==============================================================================
 */

import { SchoolClass } from "@/types/userCreate";

/** Пропси компонента вибору класу */
interface ClassSelectorProps {
    /** Список наявних класів у системі */
    availableClasses: SchoolClass[];
    /** Поточна назва обраного класу */
    selectedClass: string;
    /** Функція оновлення обраного класу */
    setSelectedClass: (val: string) => void;
    /** Прапорець, що визначає режим введення нового класу */
    isCreatingNewClass: boolean;
    /** Функція змінення режиму створення нового класу */
    setIsCreatingNewClass: (val: boolean) => void;
    /** Назва нового класу, яка вводиться вручну */
    newClassName: string;
    /** Функція оновлення назви нового класу */
    setNewClassName: (val: string) => void;
    /** Прапорець заблокованого стану (опціонально) */
    disabled?: boolean;
}

export function ClassSelector({
                                  availableClasses,
                                  selectedClass,
                                  setSelectedClass,
                                  isCreatingNewClass,
                                  setIsCreatingNewClass,
                                  newClassName,
                                  setNewClassName,
                                  disabled = false,
                              }: ClassSelectorProps) {
    return (
        <div>
            {/* ШАПКА ПОЛЯ З КНОПКОЮ ПЕРЕКЛЮЧЕННЯ РЕЖИМУ */}
            <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">Оберіть клас</label>

                {/* Кнопка перемикання між списком та введенням нового класу */}
                {!disabled && (
                    <button
                        type="button"
                        onClick={() => setIsCreatingNewClass(!isCreatingNewClass)}
                        className="text-xs text-blue-600 hover:underline font-medium focus:outline-none"
                    >
                        {isCreatingNewClass ? "← Обрати зі списку" : "+ Додати новий клас"}
                    </button>
                )}
            </div>

            {/* ДИНАМІЧНИЙ ВІДОБРАЖУВАНИЙ ЕЛЕМЕНТ (ІНПУТ АБО СЕЛЕКТ) */}
            {isCreatingNewClass ? (
                /* Режим 1: Поле введення назви нового класу */
                <input
                    type="text"
                    disabled={disabled}
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    placeholder="Введіть назву (напр. 5-Б)"
                    className={`w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition ${
                        disabled ? "bg-gray-100 cursor-not-allowed text-gray-400" : "bg-white text-gray-800"
                    }`}
                />
            ) : (
                /* Режим 2: Випадаючий список наявних класів */
                <select
                    disabled={disabled || availableClasses.length === 0}
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className={`w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition ${
                        disabled || availableClasses.length === 0
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-white text-gray-800"
                    }`}
                >
                    {availableClasses.length === 0 ? (
                        <option value="">Немає створених класів</option>
                    ) : (
                        availableClasses.map((cls) => (
                            <option key={cls.id || cls.name} value={cls.name}>
                                Клас {cls.name}
                            </option>
                        ))
                    )}
                </select>
            )}
        </div>
    );
}