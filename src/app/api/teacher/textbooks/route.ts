import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {logError} from "@/lib/logger";

/**
 * ==============================================================================
 * ROUTE: POST /api/teacher/library
 * ==============================================================================
 * @description Додавання нового навчального матеріалу або підручника до цифрової
 *              бібліотеки ліцею. Включає перевірку прав доступу (обмеження створення
 *              базових підручників категорій TEXTBOOK для вчителів).
 *
 * @access      Тільки авторизовані вчителі (`TEACHER`) або адміністратори (`ADMIN`)
 *
 * @bodyParams  {string} title — Назва матеріалу/підручника (обов'язково)
 * @bodyParams  {string} fileUrl — Посилання на файл матеріалу (PDF/Docx) (обов'язково)
 * @bodyParams  {string} subjectId — ID предмета, до якого належить матеріал (обов'язково)
 * @bodyParams  {string} category — Категорія матеріалу (обов'язково)
 * @bodyParams  {string} [author] — Автор підручника або посібника
 * @bodyParams  {string} [description] — Короткий опис вмісту
 * @bodyParams  {string} [coverUrl] — Посилання на зображення обкладинки
 * @bodyParams  {string} [classId] — Опціональний ID класу для прив'язки
 *
 * @returns {Object} JSON об'єкт створеного підручника `Textbook`
 * @status  201 Created — матеріал успішно збережено в бібліотеці
 * @status  400 Bad Request — не заповнені обов'язкові поля
 * @status  401 Unauthorized — користувач не авторизований
 * @status  403 Forbidden — спроба завантажити базовий підручник (категорія TEXTBOOK) без прав ADMIN
 * @status  500 Internal Server Error — помилка збереження в базі даних
 * ==============================================================================
 */
export async function POST(req: Request) {
    try {
        // 1. Перевірка авторизації та наявності сесії
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: "Неавторизований доступ" }, { status: 401 });
        }

        // 2. Розпакування даних із тіла запиту
        const body = await req.json();
        const {
            title,
            author,
            description,
            fileUrl,
            coverUrl,
            category,
            subjectId,
            classId,
        } = body;

        // 3. Валідація обов'язкових полів
        if (!title || !fileUrl || !subjectId || !category) {
            return NextResponse.json(
                { error: "Заповніть усі обов'язкові поля" },
                { status: 400 }
            );
        }

        // 🔒 4. ОБМЕЖЕННЯ ПРАВ: Забороняємо вчителям створювати базові підручники (TEXTBOOK)
        // Категорія TEXTBOOK резервується для централізованого завантаження адміністратором
        if (category === "TEXTBOOK" && session.user.role !== "ADMIN") {
            return NextResponse.json(
                { error: "Додавання базових підручників виконується адміністратором" },
                { status: 403 }
            );
        }

        // 5. Створення запису підручника/матеріалу в базі даних
        const textbook = await prisma.textbook.create({
            data: {
                title,
                author: author || null,
                description: description || null,
                fileUrl,
                coverUrl: coverUrl || null,
                category,
                subjectId,
                createdById: session.user.id,
                classId: classId || null,
            },
        });

        return NextResponse.json(textbook, { status: 201 });
    } catch (error:any) {
        // Зберігаємо помилку у базі даних
        await logError({
            message: error.message || "Помилка при збереженні підручника",
            stack: error.stack,
            source: "API /api/teacher/textbooks [POST]",
        });
        return NextResponse.json(
            { error: "Помилка при збереженні файлу" },
            { status: 500 }
        );
    }
}

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
export async function DELETE(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        // 1. Отримуємо та перевіряємо сесію поточного користувача
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json(
                { error: "Неавторизований доступ" },
                { status: 401 }
            );
        }

        const textbookId = params.id;

        // 2. Знаходимо матеріал у базі даних, щоб перевірити його наявність та автора
        const textbook = await prisma.textbook.findUnique({
            where: { id: textbookId },
            select: { id: true, createdById: true },
        });

        if (!textbook) {
            return NextResponse.json(
                { error: "Матеріал не знайдено" },
                { status: 404 }
            );
        }

        // 🔒 3. ПЕРЕВІРКА ПРАВ НА ВИДАЛЕННЯ:
        // Адмін може видаляти будь-які матеріали, а вчитель — тільки ті, які додав сам
        const isAdmin = session.user.role === "ADMIN";
        const isOwner = textbook.createdById === session.user.id;

        if (!isAdmin && !isOwner) {
            return NextResponse.json(
                { error: "У вас немає прав на видалення цього матеріалу" },
                { status: 403 }
            );
        }

        // 4. Видалення запису з бази даних
        await prisma.textbook.delete({
            where: { id: textbookId },
        });

        return NextResponse.json(
            { message: "Матеріал успішно видалено" },
            { status: 200 }
        );
    } catch (error:any) {
        // Зберігаємо помилку у базі даних
        await logError({
            message: error.message || "Помилка при видаленні підручника",
            stack: error.stack,
            source: "API /api/teacher/textbooks [DELETE]",
        });
        return NextResponse.json(
            { error: "Помилка при видаленні матеріалу" },
            { status: 500 }
        );
    }
}