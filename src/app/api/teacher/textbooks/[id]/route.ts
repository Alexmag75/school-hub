
/**
 * ==============================================================================
 * ROUTE: DELETE /api/teacher/textbooks/[id]
 * ==============================================================================
 * @description Видалення навчального матеріалу або завдання з цифрової бібліотеки.
 *              Включає перевірку автентифікації, прав доступу та володіння записом.
 *
 * @access      Адміністратори (`ADMIN`) або вчитель-автор матеріалу (`TEACHER`)
 *
 * @param {string} id — Унікальний ідентифікатор матеріалу (з динамічного роута)
 *
 * @returns {Object} JSON статус успішного видалення
 * @status  200 OK — матеріал успішно видалено
 * @status  401 Unauthorized — користувач не авторизований
 * @status  403 Forbidden — спроба видалити чужий матеріал (для звичайних вчителів)
 * @status  404 Not Found — матеріал не знайдено в базі даних
 * @status  500 Internal Server Error — помилка бази даних
 * ==============================================================================
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/logger";

export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ id: string }> } // 👈 params як Promise
) {
    try {
        const { id } = await context.params; // 👈 Отримуємо id через await

        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Неавторизований доступ" }, { status: 401 });
        }

        const textbook = await prisma.textbook.findUnique({
            where: { id },
            select: { id: true, createdById: true },
        });

        if (!textbook) {
            return NextResponse.json({ error: "Матеріал не знайдено" }, { status: 404 });
        }

        const isAdmin = session.user.role === "ADMIN";
        const isOwner = textbook.createdById === session.user.id;

        if (!isAdmin && !isOwner) {
            return NextResponse.json(
                { error: "У вас немає прав на видалення цього матеріалу" },
                { status: 403 }
            );
        }

        await prisma.textbook.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Матеріал успішно видалено" }, { status: 200 });
    } catch (error: any) {
        await logError({
            message: error.message || "Помилка при видаленні підручника",
            stack: error.stack,
            source: "API /api/teacher/textbooks/[id] [DELETE]",
        });
        return NextResponse.json({ error: "Помилка при видаленні матеріалу" }, { status: 500 });
    }
}