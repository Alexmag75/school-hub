/**
 * ==============================================================================
 * ПАНЕЛЬ ДОДАВАННЯ БЛОКУ У КОНТЕНТ УРОКУ (`src/components/admin/lessons/AddBlockToolbar.tsx`)
 * ==============================================================================
 * @description Клієнтський компонент панелі швидкого вставлення нового контент-блоку
 *              між існуючими елементами конструктора уроків. Забезпечує:
 *              1. Візуальний розділювач з ефектом підсвічування при наведенні.
 *              2. Набір кнопок для вибору типу блоку (Текст, Фото, Відео,
 *                 Презентація або Інтерактивні елементи).
 *              3. Передачу індексу та типу блоку у батьківський компонент через callback.
 * ==============================================================================
 */

"use client";

import {BlockType} from "@/types/lesson";

interface AddBlockToolbarProps {
    insertIndex: number;
    onAddBlock: (index: number, type: BlockType) => void;
}

export const AddBlockToolbar = ({ insertIndex, onAddBlock }: AddBlockToolbarProps) => (
    <div className="flex items-center justify-center gap-2 py-2 group">
        {/* Ліва лінія розділювача */}
        <div className="h-px bg-slate-200 flex-grow group-hover:bg-slate-300 transition" />

        {/* Панель з кнопками вибору типу контенту */}
        <div className="flex flex-wrap items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-full shadow-sm text-xs font-semibold text-slate-600">
            <span className="text-slate-400 text-[11px] mr-1">+ Вставити:</span>

            {/* Кнопка додавання текстового блоку */}
            <button
                type="button"
                onClick={() => onAddBlock(insertIndex, "text")}
                className="hover:bg-slate-100 hover:text-blue-600 px-2 py-0.5 rounded-md transition flex items-center gap-1"
            >
                📝 Текст
            </button>

            {/* Кнопка додавання зображення */}
            <button
                type="button"
                onClick={() => onAddBlock(insertIndex, "image")}
                className="hover:bg-slate-100 hover:text-blue-600 px-2 py-0.5 rounded-md transition flex items-center gap-1"
            >
                🖼️ Фото
            </button>

            {/* Кнопка додавання відеоматеріалу */}
            <button
                type="button"
                onClick={() => onAddBlock(insertIndex, "video")}
                className="hover:bg-slate-100 hover:text-blue-600 px-2 py-0.5 rounded-md transition flex items-center gap-1"
            >
                🎬 Відео
            </button>

            {/* Кнопка додавання презентації */}
            <button
                type="button"
                onClick={() => onAddBlock(insertIndex, "presentation")}
                className="hover:bg-slate-100 hover:text-blue-600 px-2 py-0.5 rounded-md transition flex items-center gap-1"
            >
                📊 Презентація
            </button>

            {/* Кнопка додавання інтерактивного елемента */}
            <button
                type="button"
                onClick={() => onAddBlock(insertIndex, "interactive")}
                className="hover:bg-slate-100 hover:text-blue-600 px-2 py-0.5 rounded-md transition flex items-center gap-1"
            >
                🧩 Інтерактив
            </button>
        </div>

        {/* Права лінія розділювача */}
        <div className="h-px bg-slate-200 flex-grow group-hover:bg-slate-300 transition" />
    </div>
);