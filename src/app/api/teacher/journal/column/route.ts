import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {logError} from "@/lib/logger";

/**
 * ==============================================================================
 * ROUTE: POST /api/teacher/journal/column
 * ==============================================================================
 * @description Створення нової колонки в електронному журналі вчителя для
 *              певного класу та предмета.
 *
 * @access      Тільки авторизовані вчителі / адміністрація
 *
 * @bodyParams  {string} [title] — Назва колонки (якщо не вказано, задається "Урок")
 * @bodyParams  {ColumnType} [type="LESSON"] — Тип колонки з enum ColumnType
 * @bodyParams  {string|Date} [date/deadline] — Дата проведення або дедлайн
 * @bodyParams  {string} subjectId — ID предмета (обов'язковий)
 * @bodyParams  {string} classId — ID класу (обов'язковий)
 * @bodyParams  {string} [materialId] — Опціональний ID прикріпленого матеріалу
 *
 * @returns {Object} JSON об'єкт новоствореної колонки `JournalColumn`
 * @status  200 OK — колонка успішно створена
 * @status  400 Bad Request — відсутній ID предмета або класу
 * @status  500 Internal Server Error — помилка створення в базі даних
 * ==============================================================================
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { title, date, deadline, type, subjectId, classId, materialId } = body;

        // 1. Валідація обов'язкових зв'язків
        if (!subjectId || !classId) {
            return NextResponse.json({ error: "Не вказано предмет або клас" }, { status: 400 });
        }

        // 2. Визначення дати/дедлайну
        const targetDeadline = deadline || date;

        // 3. Створення запису відповідно до схеми Prisma
        const newColumn = await prisma.journalColumn.create({
            data: {
                title: title?.trim() || "Урок", // title в схемі обов'язковий (String)
                type: type || "LESSON", // Значення має збігатися з enum ColumnType
                deadline: targetDeadline ? new Date(targetDeadline) : null,
                subjectId,
                classId,
                ...(materialId ? { materialId } : {}),
            },
        });

        return NextResponse.json(newColumn);
    } catch (error:any) {
        // Зберігаємо помилку у базі даних
        await logError({
            message: error.message || "Помилка створення колонки",
            stack: error.stack,
            source: "API /api/teacher/journal/column [POST]",
        });
        return NextResponse.json({ error: "Помилка створення колонки" }, { status: 500 });
    }
}