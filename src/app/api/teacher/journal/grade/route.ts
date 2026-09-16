import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {logError} from "@/lib/logger";

/**
 * ==============================================================================
 * ROUTE: POST /api/teacher/journal/grade
 * ==============================================================================
 * @description Виставляння, оновлення або видалення оцінки учня в колонці журналу.
 *              - Якщо `value` порожнє/null — оцінка видаляється з бази.
 *              - Якщо оцінка існує — вона оновлюється.
 *              - Якщо оцінка відсутня — створюється новий запис.
 *
 * @access      Тільки авторизовані вчителі / адміністрація
 *
 * @bodyParams  {string} studentId — ID учня (обов'язковий)
 * @bodyParams  {string} columnId  — ID колонки журналу (обов'язковий)
 * @bodyParams  {string} subjectId — ID предмета (обов'язковий)
 * @bodyParams  {string} [teacherId] — ID вчителя, який виставив оцінку
 * @bodyParams  {number|string|null} [value] — Оцінка від 1 до 12 (або порожньо для видалення)
 * @bodyParams  {string} [comment] — Опціональний коментар до оцінки
 *
 * @returns {Object} Об'єкт оцінки `Grade` або підтвердження видалення `{ success: true, action: "deleted" }`
 * @status  200 OK — оцінка виставлена, оновлена або успішно видалена
 * @status  400 Bad Request — некоректний діапазон оцінки або відсутні обов'язкові параметри
 * @status  500 Internal Server Error — помилка роботи з базою даних
 * ==============================================================================
 */
export async function POST(req: Request) {
    try {
        // 1. Отримання та розпакування даних із тіла запиту
        const body = await req.json();
        const { studentId, columnId, subjectId, teacherId, value, comment } = body;

        // 2. Перевірка наявності обов'язкових ідентифікаторів
        if (!studentId || !columnId || !subjectId) {
            return NextResponse.json({ error: "Недостатньо даних" }, { status: 400 });
        }

        // 3. Логіка видалення оцінки: якщо передано null, undefined або порожній рядок
        if (value === null || value === undefined || value === "") {
            await prisma.grade.deleteMany({
                where: { studentId, columnId },
            });
            return NextResponse.json({ success: true, action: "deleted" });
        }

        // 4. Валідація числового значення оцінки (12-бальна система)
        const numValue = Number(value);
        if (isNaN(numValue) || numValue < 1 || numValue > 12) {
            return NextResponse.json({ error: "Оцінка має бути від 1 до 12" }, { status: 400 });
        }

        // 5. Пошук існуючої оцінки для комбінації (учень + колонка)
        const existingGrade = await prisma.grade.findFirst({
            where: { studentId, columnId },
        });

        // 6. Оновлення або створення запису
        if (existingGrade) {
            const updated = await prisma.grade.update({
                where: { id: existingGrade.id },
                data: { value: numValue, comment: comment || null },
            });
            return NextResponse.json(updated);
        } else {
            const created = await prisma.grade.create({
                data: {
                    value: numValue,
                    comment: comment || null,
                    studentId,
                    teacherId,
                    subjectId,
                    columnId,
                },
            });
            return NextResponse.json(created);
        }
    } catch (error:any) {
        // Зберігаємо помилку у базі даних
        await logError({
            message: error.message || "Помилка збереження",
            stack: error.stack,
            source: "API /api/teacher/journal/grade [POST]",
        });
        return NextResponse.json({ error: "Помилка збереження" }, { status: 500 });
    }
}