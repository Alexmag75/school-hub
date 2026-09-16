import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {logError} from "@/lib/logger";

/**
 * ==============================================================================
 * ROUTE: GET /api/teacher/topics
 * ==============================================================================
 * @description Отримання списку навчальних тем/розділів (Topic) для конкретного
 *              предмета (`subjectId`). Використовується при конструюванні
 *              уроків та календарно-тематичному плануванні.
 *
 * @queryParams {string} subjectId — Унікальний ідентифікатор предмета (обов'язковий)
 *
 * @returns {Array<Object>} Масив об'єктів тем `Topic`, відсортованих за датою створення
 * @status  200 OK — список тем успішно отримано
 * @status  400 Bad Request — відсутній обов'язковий параметр `subjectId`
 * @status  500 Internal Server Error — помилка зчитування з бази даних
 * ==============================================================================
 */
export async function GET(req: Request) {
    try {
        // 1. Отримання та валідація URL-параметра subjectId
        const { searchParams } = new URL(req.url);
        const subjectId = searchParams.get("subjectId");

        if (!subjectId) {
            return NextResponse.json(
                { error: "Не вказано ідентифікатор предмета" },
                { status: 400 }
            );
        }

        // 2. Вибірка розділів із бази даних із хронологічним сортуванням
        const topics = await prisma.topic.findMany({
            where: { subjectId },
            orderBy: { createdAt: "asc" },
        });

        return NextResponse.json(topics);
    } catch (error:any) {
        // Зберігаємо помилку у базі даних
        await logError({
            message: error.message || "Помилка при отриманні тем",
            stack: error.stack,
            source: "API /api/teacher/topics [GET]",
        });
        return NextResponse.json(
            { error: "Помилка при отриманні тем" },
            { status: 500 }
        );
    }
}

/**
 * ==============================================================================
 * ROUTE: POST /api/teacher/topics
 * ==============================================================================
 * @description Створення нового навчального розділу/теми (Topic) для предмета.
 *
 * @access      Тільки авторизовані користувачі (Вчителі / Адміністратори)
 *
 * @bodyParams  {string} title — Назва розділу (обов'язково)
 * @bodyParams  {string} subjectId — ID предмета, до якого належить розділ (обов'язково)
 *
 * @returns {Object} JSON об'єкт новоствореної теми `Topic`
 * @status  201 Created — розділ успішно створено
 * @status  400 Bad Request — відсутні назва розділу або ID предмета
 * @status  401 Unauthorized — користувач не авторизований
 * @status  403 Forbidden — недостатньо прав для створення тем
 * @status  500 Internal Server Error — помилка створення в базі даних
 * ==============================================================================
 */
export async function POST(req: Request) {
    try {
        // 1. Перевірка авторизації та ролі користувача
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Неавторизований доступ" }, { status: 401 });
        }

        if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Немає доступу" }, { status: 403 });
        }

        // 2. Отримання та валідація входження даних
        const body = await req.json();
        const { title, subjectId } = body;

        if (!title?.trim() || !subjectId) {
            return NextResponse.json(
                { error: "Необхідно вказати назву та предмет" },
                { status: 400 }
            );
        }

        // 3. Створення нового запису розділу в БД
        const topic = await prisma.topic.create({
            data: {
                title: title.trim(),
                subjectId
            },
        });

        return NextResponse.json(topic, { status: 201 });
    } catch (error:any) {
        // Зберігаємо помилку у базі даних
        await logError({
            message: error.message || "Помилка при отриманні тем",
            stack: error.stack,
            source: "API /api/teacher/topics [POST]",
        });
        return NextResponse.json(
            { error: "Помилка при створенні розділу" },
            { status: 500 }
        );
    }
}