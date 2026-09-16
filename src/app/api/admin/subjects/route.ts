import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {logError} from "@/lib/logger";

/**
 * ==============================================================================
 * ROUTE: GET /api/admin/subjects
 * ==============================================================================
 * @description Отримання списку всіх навчальних предметів із викладачами та класами
 * @access      Тільки АДМІНІСТРАТОР (ADMIN)
 *
 * @returns {Array<Object>} Масив предметів. Для зворотної сумісності з фронтендом
 *                          додано поле `teacher` (перший викладач зі списку `teachers`)
 * @status  200 OK — список успішно отримано
 * @status  403 Forbidden — відсутня сесія або роль не ADMIN
 * @status  500 Internal Server Error — помилка запиту до БД
 * ==============================================================================
 */
export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Немає доступу" }, { status: 403 });
    }

    try {
        const subjects = await prisma.subject.findMany({
            orderBy: { title: "asc" },
            include: {
                groups: true, // Включаємо підгрупи
                teachers: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                    },
                },
                classes: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        const formattedSubjects = subjects.map((sub) => ({
            ...sub,
            teacher: sub.teachers[0] || null,
        }));

        return NextResponse.json(formattedSubjects);
    } catch (error: any) {
        await logError({
            message: error.message || "Помилка завантаження списку предметів",
            stack: error.stack,
            source: "API /api/admin/subjects [GET]",
        });
        return NextResponse.json(
            { error: "Помилка завантаження списку предметів" },
            { status: 500 }
        );
    }
}

/**
 * ==============================================================================
 * ROUTE: POST /api/admin/subjects
 * ==============================================================================
 * @description Створення нового навчального предмета з опціональною прив'язкою викладача
 * @access      Тільки АДМІНІСТРАТОР (ADMIN)
 *
 * @body {
 *   title?: string,    // Назва предмета (наприклад: "Фізика")
 *   name?: string,     // Альтернативне поле назви (для сумісності з формами)
 *   teacherId?: string // ID викладача для початкової прив'язки (опціонально)
 * }
 *
 * @returns {Object} Об'єкт створеного предмета з масивом teachers та полем teacher
 * @status  201 Created — предмет успішно створено
 * @status  400 Bad Request — назва не передана або предмет з такою назвою вже існує
 * @status  403 Forbidden — відсутня сесія або роль не ADMIN
 * @status  500 Internal Server Error — помилка створення в БД
 * ==============================================================================
 */
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Немає доступу" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const rawTitle = body.title || body.name;
        const hasGroups = Boolean(body.hasGroups); // Отримуємо прапор ділення на групи

        if (!rawTitle || typeof rawTitle !== "string" || !rawTitle.trim()) {
            return NextResponse.json(
                { error: "Вкажіть коректну назву предмета" },
                { status: 400 }
            );
        }

        const formattedTitle = rawTitle.trim();

        const existingSubject = await prisma.subject.findFirst({
            where: { title: formattedTitle },
        });

        if (existingSubject) {
            return NextResponse.json(
                { error: "Предмет з такою назвою вже існує" },
                { status: 400 }
            );
        }

        // Створення предмета разом з автоматичним створення 2-х підгруп (якщо прапор true)
        const newSubject = await prisma.subject.create({
            data: {
                title: formattedTitle,
                hasGroups: hasGroups,
                ...(hasGroups
                    ? {
                        groups: {
                            create: [
                                { name: "1 група" },
                                { name: "2 група" },
                            ],
                        },
                    }
                    : {}),
                ...(body.teacherId
                    ? {
                        teachers: {
                            connect: [{ id: body.teacherId }],
                        },
                    }
                    : {}),
            },
            include: {
                groups: true,
                teachers: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                    },
                },
            },
        });

        return NextResponse.json(
            {
                ...newSubject,
                teacher: newSubject.teachers[0] || null,
            },
            { status: 201 }
        );
    } catch (error: any) {
        await logError({
            message: error.message || "Помилка при створенні предмета",
            stack: error.stack,
            source: "API /api/admin/subjects [POST]",
        });
        return NextResponse.json(
            { error: "Помилка при створенні предмета" },
            { status: 500 }
        );
    }
}