import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * ==============================================================================
 * UTILITY: ClassName Combiner (`cn`)
 * ==============================================================================
 * @description Утиліта для безпечної динамічної комбінації та об'єднання
 *              класів Tailwind CSS.
 *
 * @details
 * 1. `clsx` — дозволяє зручно передавати умовно додані класи (об'єкти, масиви, булеві вирази).
 * 2. `twMerge` — вирішує конфлікти класів Tailwind (наприклад, якщо передано і `px-2`, і `px-4`,
 *    `twMerge` залишить тільки останній правильний клас `px-4`, а не застосує обидва).
 *
 * @param {...ClassValue[]} inputs — Довільна кількість класів, умовних об'єктів чи масивів класів
 * @returns {string} Очищений та оптимізований рядок CSS-класів
 *
 * @example
 * cn("bg-red-500 p-4", isTrue && "bg-blue-500", "p-6")
 * // Результат: "bg-blue-500 p-6" (без конфліктів padding та background)
 * ==============================================================================
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getFirstImageUrl(imageUrl?: string | null): string | null {
  if (!imageUrl) return null;
  // Розбиваємо рядок по комій беремо перший елемент
  const urls = imageUrl.split(",").map((url) => url.trim()).filter(Boolean);
  return urls.length > 0 ? urls[0] : null;
}