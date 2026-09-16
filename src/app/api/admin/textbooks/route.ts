import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {logError} from "@/lib/logger";

/**
 * ==============================================================================
 * ROUTE: POST /api/admin/textbooks
 * ==============================================================================
 * @description Створення та публікація нового електронного підручника / посібника
 * @access      Тільки АДМІНІСТРАТОР (ADMIN)
 *
 * @body {
 *   title: string,         // Назва підручника (обов'язкове)
 *   fileUrl: string,       // Посилання на PDF/файл підручника (обов'язкове)
 *   subjectId: string,     // ID предмета, до якого належить підручник (обов'язкове)
 *   author?: string,       // Автор підручника (опціонально)
 *   category?: string,     // Категорія с enum TextbookCategory (за замовчуванням "TEXTBOOK")
 *   classIds?: string[]    // Масив ID класів, яким доступний підручник (опціонально)
 * }
 *
 * @returns {Object} Створений об'єкт підручника з підтягнутим масивом прикріплених класів
 * @status  201 Created — підручник успішно створено
 * @status  400 Bad Request — відсутні обов'язкові поля
 * @status  401 Unauthorized — користувач не авторизований
 * @status  403 Forbidden — відсутні права адміністратора
 * @status  500 Internal Server Error — помилка при збереженні в БД
 * ==============================================================================
 */
export async function POST(req: Request) {
    try {
        // 1. Перевірка аутентифікації сесії
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. Перевірка ролі користувача напряму з БД
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, role: true },
        });

        if (!user || user.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // 3. Извлечение и первичная валидация тела запроса
        const body = await req.json();
        const { title, author, category, fileUrl, subjectId, classIds } = body;

        // Перевірка наявності критично важливих полів
        if (!title || !fileUrl || !subjectId) {
            return NextResponse.json(
                { error: "Заповніть обов'язкові поля" },
                { status: 400 }
            );
        }

        // 4. Створення запису підручника в БД
        // Використовуємо connect для масової прив'язки класів через Many-to-Many
        const textbook = await prisma.textbook.create({
            data: {
                title,
                author: author || null,
                category: category || "TEXTBOOK",
                fileUrl,
                subjectId,
                createdById: user.id, // Фіксуємо авторство адміністратора
                classes: Array.isArray(classIds) && classIds.length > 0
                    ? { connect: classIds.map((id: string) => ({ id })) }
                    : undefined,
            },
            include: {
                // Відразу повертаємо інформацію про прикріплені класи для миттєвого оновлення UI
                classes: { select: { id: true, name: true } },
            },
        });

        return NextResponse.json(textbook, { status: 201 });
    } catch (error:any) {
        // Зберігаємо помилку у базі даних
        await logError({
            message: error.message || "Створення та публікація нового електронного підручника / посібника",
            stack: error.stack,
            source: "API /api/admin/textbooks [POST]",
        });
        return NextResponse.json(
            { error: "Помилка сервера при збереженні" },
            { status: 500 }
        );
    }
}