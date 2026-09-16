import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import {logError} from "@/lib/logger";

interface IncomingUser {
    fullName: string;
    className: string;
    role: string;
    email: string;
    password: string;
}

/**
 * ==============================================================================
 * ROUTE: POST /api/admin/users/bulk
 * ==============================================================================
 * @description Масове створення учнів класу за один запит з автоматичним
 *              пошуком або створенням навчального класу (Class)
 * @access      Тільки АДМІНІСТРАТОР (ADMIN)
 *
 * @body {
 *   users: Array<{
 *     fullName: string,
 *     className: string,
 *     role: "STUDENT",
 *     email: string,
 *     password: string
 *   }>
 * }
 *
 * @returns {Object} Інформація про кількість створених записів та відкриті дані для друку
 * @status  201 Created — масовий імпорт пройшов успішно
 * @status  400 Bad Request — порожній або некоректний список
 * @status  403 Forbidden — відсутня сесія або роль не ADMIN
 * @status  500 Internal Server Error — помилка під час імпорту
 * ==============================================================================
 */
export async function POST(req: Request) {
    // 1. Перевірка сесії та прав адміністратора
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Немає доступу" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const usersToCreate: IncomingUser[] = body.users;

        if (!Array.isArray(usersToCreate) || usersToCreate.length === 0) {
            return NextResponse.json(
                { error: "Передано порожній список користувачів" },
                { status: 400 }
            );
        }

        const className = usersToCreate[0]?.className;
        const currentYear = new Date().getFullYear();
        let targetClassId: string | null = null;

        // 2. Пошук або автоматичне створення класу за поточний рік
        if (className) {
            let targetClass = await prisma.class.findFirst({
                where: { name: className, year: currentYear },
            });

            if (!targetClass) {
                targetClass = await prisma.class.create({
                    data: {
                        name: className,
                        year: currentYear,
                    },
                });
            }

            targetClassId = targetClass.id;
        }

        // 3. Паралельне хешування паролів та підготовка масиву об'єктів для Prisma
        const preparedUsers = await Promise.all(
            usersToCreate.map(async (u) => {
                const hashedPassword = await bcrypt.hash(u.password, 10);
                return {
                    fullName: u.fullName,
                    lastName: u.fullName, // Дублюємо у lastName відповідно до моделі
                    email: u.email,
                    password: hashedPassword,
                    role: (u.role as Role) || Role.STUDENT,
                    classId: targetClassId,
                };
            })
        );

        // 4. Оптимізоване масове вставлення через createMany
        const result = await prisma.user.createMany({
            data: preparedUsers,
            skipDuplicates: true, // Ігноруємо дублікати Email
        });

        // 5. Повертаємо звіт і вихідний список (з нехешованими паролями для друку картка-доступів)
        return NextResponse.json(
            {
                message: "Учнів успішно імпортовано",
                createdCount: result.count,
                users: usersToCreate,
            },
            { status: 201 }
        );
    } catch (error:any) {
        // Зберігаємо помилку у базі даних
        await logError({
            message: error.message || "Помилка завантаження навчальної аналітики",
            stack: error.stack,
            source: "API /api/admin/users/bulk [POST]",
        });
        return NextResponse.json(
            { error: "Помилка під час масового створення користувачів" },
            { status: 500 }
        );
    }
}