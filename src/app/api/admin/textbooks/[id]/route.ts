import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {logError} from "@/lib/logger";

/**
 * ==============================================================================
 * ROUTE: DELETE /api/admin/textbooks/[id]
 * ==============================================================================
 * @description Видалення електронного підручника / посібника з бази даних
 * @access      Тільки АДМІНІСТРАТОР (ADMIN)
 *
 * @param       {Request} req — Вхідний HTTP-запит
 * @param       {Object} context — Контекст маршутизації Next.js
 * @param       {Object} context.params — Динамічні параметри URL
 * @param       {string} context.params.id — Унікальний ID підручника для видалення
 *
 * @returns {Object} Повідомлення про успішне видалення
 * @status  200 OK — підручник успішно видалено
 * @status  401 Unauthorized — користувач не авторизований
 * @status  403 Forbidden — користувач не має прав адміністратора
 * @status  404 Not Found — підручник із зазначеним ID не знайдено в БД
 * @status  500 Internal Server Error — помилка сервера або бази даних
 * ==============================================================================
 */
export async function DELETE(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        // 1. Перевірка наявності активної сесії
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. Підтвердження ролі ADMIN напряму з БД для максимальної безпеки
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { role: true },
        });

        if (!user || user.role !== "ADMIN") {
            return NextResponse.json(
                { error: "Forbidden: Admin access required" },
                { status: 403 }
            );
        }

        const { id } = params;

        // Перевірка наявності переданого ID
        if (!id) {
            return NextResponse.json(
                { error: "Не вказано ID підручника" },
                { status: 400 }
            );
        }

        // 3. Видалення запису підручника з БД
        await prisma.textbook.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Підручник успішно видалено" });
    } catch (error:any) {
        // Обробка специфічної помилки Prisma, коли запис за ID не знайдено в БД
        if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === "P2025"

        ) {
            return NextResponse.json(
                { error: "Підручник не знайдено або вже видалено" },
                { status: 404 }
            );
        }
        // Зберігаємо помилку у базі даних
        await logError({
            message: error.message || "Помилка при видаленні підручника",
            stack: error.stack,
            source: "API /api/admin/textbooks/[id] [DELETE]",
        });
        return NextResponse.json(
            { error: "Помилка при видаленні підручника" },
            { status: 500 }
        );
    }
}