import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {logError} from "@/lib/logger";

/**
 * ==============================================================================
 * ROUTE: GET /api/admin/classes
 * ==============================================================================
 * @description Отримання списку всіх існуючих навчальних класів
 * @access      Тільки АДМІНІСТРАТОР (ADMIN)
 *
 * @returns {Array<Object>} Масив об'єктів класів із підрахованою кількістю учнів
 * @status  200 OK — список успішно отримано
 * @status  403 Forbidden — відсутня сесія або роль не ADMIN
 * @status  500 Internal Server Error — помилка запиту до БД
 * ==============================================================================
 */
export async function GET() {
    // 1. Проверка аутентификации и авторизации (RBAC)
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Немає доступу" }, { status: 403 });
    }

    try {
        // 2. Запрос списка классов с агрегацией количества учеников
        const classes = await prisma.class.findMany({
            include: {
                // Агрегация: подтягиваем только COUNT(students), а не весь массив пользователей
                _count: {
                    select: { students: true },
                },
            },
            // Сортировка: сначала свежие учебные года, внутри года — по алфавиту (10-А, 9-А, 9-Б)
            orderBy: [{ year: "desc" }, { name: "asc" }],
        });

        return NextResponse.json(classes);
    } catch (error:any) {
        // Зберігаємо помилку у базі даних
        await logError({
            message: error.message || "Помилка завантаження списку класів",
            stack: error.stack,
            source: "API /api/admin/classes [GET]",
        });
        return NextResponse.json(
            { error: "Помилка завантаження списку класів" },
            { status: 500 }
        );
    }
}

/**
 * ==============================================================================
 * ROUTE: POST /api/admin/classes
 * ==============================================================================
 * @description Створення нового навчального класу в БД (Идемпотентный метод)
 * @access      Тільки АДМІНІСТРАТОР (ADMIN)
 *
 * @body {
 *   name: string, // Назва класу (наприклад: "9-А")
 *   year?: number // Рік навчання (за замовчуванням поточний календарний рік)
 * }
 *
 * @returns {Object} Об'єкт створеного або вже існуючого класу
 * @status  201 Created — клас успішно створено
 * @status  200 OK — клас вже існував (повернуто існуючий запис)
 * @status  400 Bad Request — назва не передана або некоректна
 * @status  403 Forbidden — відсутня сесія або роль не ADMIN
 * @status  500 Internal Server Error — помилка створення в БД
 * ==============================================================================
 */
export async function POST(req: Request) {
    // 1. Проверка прав доступа
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Немає доступу" }, { status: 403 });
    }

    try {
        // 2. Извлечение и валидация входящих данных
        const { name, year } = await req.json();

        // Проверка на пустую строку или некоректный тип данных
        if (!name || typeof name !== "string" || !name.trim()) {
            return NextResponse.json(
                { error: "Вкажіть коректну назву класу" },
                { status: 400 }
            );
        }

        // Санитизация имени (удаление лишних пробелов по краям)
        const formattedName = name.trim();
        // Если год не передан, привязываем к текущему календарному году
        const currentYear = year || new Date().getFullYear();

        // 3. Проверка дубликатов (защита от создания двух одинаковых "9-А" в одном году)
        const existingClass = await prisma.class.findFirst({
            where: {
                name: formattedName,
                year: currentYear,
            },
        });

        // Если класс уже есть — возвращаем его со статусом 200 OK (идемпотентность)
        if (existingClass) {
            return NextResponse.json(existingClass, { status: 200 });
        }

        // 4. Создание новой записи класса
        const newClass = await prisma.class.create({
            data: {
                name: formattedName,
                year: currentYear,
            },
        });

        return NextResponse.json(newClass, { status: 201 });
    } catch (error:any) {
        // Зберігаємо помилку у базі даних
        await logError({
            message: error.message || "Помилка при створенні класу",
            stack: error.stack,
            source: "API /api/admin/classes [POST]",
        });
        return NextResponse.json(
            { error: "Помилка при створенні класу" },
            { status: 500 }
        );
    }
}