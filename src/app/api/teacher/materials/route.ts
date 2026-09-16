import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MaterialType, ColumnType, NotificationType } from "@prisma/client";
import {logError} from "@/lib/logger";

/**
 * ==============================================================================
 * ROUTE: GET /api/teacher/materials
 * ==============================================================================
 * @description Отримання списку навчальних матеріалів (уроків), створених
 *              поточним вчителем, із можливістю фільтрації за предметом та класом.
 *
 * @access      Авторизовані вчителі / адміністрація
 *
 * @queryParams {string} [subjectId] — Фільтр за ID предмета
 * @queryParams {string} [classId]   — Фільтр за ID класу (повіряється через призначення `assignments`)
 *
 * @returns {Array<Object>} Масив об'єктів `Material` зі зв'язаними темами, предметами та призначеннями
 * @status  200 OK — список успішно отримано
 * @status  401 Unauthorized — користувач не авторизований
 * @status  500 Internal Server Error — помилка вибірки з бази даних
 * ==============================================================================
 */
export async function GET(req: Request) {
    // 1. Перевірка авторизації
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: "Неавторизований" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get("subjectId");
    const classId = searchParams.get("classId");

    try {
        // 2. Отримання матеріалів автора з урахуванням опціональних фільтрів
        const materials = await prisma.material.findMany({
            where: {
                authorId: session.user.id,
                ...(subjectId ? { subjectId } : {}),
                ...(classId
                    ? {
                        assignments: {
                            some: { classId },
                        },
                    }
                    : {}),
            },
            include: {
                topic: { select: { id: true, title: true } },
                subject: { select: { id: true, title: true } },
                assignments: {
                    include: {
                        class: { select: { id: true, name: true } },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(materials);
    } catch (error:any) {
            // Зберігаємо помилку у базі даних
            await logError({
                message: error.message || "Помилка отримання матеріалів",
                stack: error.stack,
                source: "API /api/teacher/materials/ [GET]",
            });
        return NextResponse.json({ error: "Помилка отримання матеріалів" }, { status: 500 });
    }
}

/**
 * ==============================================================================
 * ROUTE: POST /api/teacher/materials
 * ==============================================================================
 * @description Створення нового навчального матеріалу (уроку/тесту/практичної),
 *              автоматичне призначення класу, створення колонки в журналі
 *              s розсилка сповіщень всім учням обраного класу.
 *
 * @access      Тільки авторизовані вчителі (`TEACHER`) або адміністратори (`ADMIN`)
 *
 * @bodyParams  {string} title — Назва матеріалу (обов'язково)
 * @bodyParams  {string} subjectId — ID предмета (обов'язково)
 * @bodyParams  {string} classId — ID класу для призначення (обов'язково)
 * @bodyParams  {string} [topicId] — ID теми навчальної програми
 * @bodyParams  {MaterialType} [type="THEORY"] — Тип матеріалу (THEORY, PRACTICE, QUIZ тощо)
 * @bodyParams  {string|Object} [content] — Текстовий вміст або структуровані дані
 * @bodyParams  {Array<Object>} [questions] — Масив запитань для тестів (серіалізується в JSON)
 * @bodyParams  {string} [videoUrl] — Посилання на відео
 * @bodyParams  {string|Date} [deadline] — Граничний термін виконання
 * @bodyParams  {number} [timeLimitMinutes] — Ліміт часу на виконання (у хвилинах)
 *
 * @returns {Object} JSON з об'єктами `{ material, assignment }`
 * @status  201 Created — матеріал успішно створено, призначено та згенеровано колонку
 * @status  400 Bad Request — відсутні обов'язкові параметри
 * @status  403 Forbidden — недостатньо прав доступу
 * @status  500 Internal Server Error — транзакційна помилка збереження
 * ==============================================================================
 */
export async function POST(req: Request) {
    // 1. Перевірка авторизації та ролі
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== "TEACHER" && session.user.role !== "ADMIN")) {
        return NextResponse.json({ error: "Немає доступу" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const {
            title,
            subjectId,
            classId,
            topicId,
            type,
            content,
            questions,
            videoUrl,
            deadline,
            timeLimitMinutes,
        } = body;

        // 2. Валідація обов'язкових полів
        if (!title || !subjectId || !classId) {
            return NextResponse.json(
                { error: "Будь ласка, заповніть назву, предмет та клас" },
                { status: 400 }
            );
        }

        const finalType = (type || "THEORY") as MaterialType;

        // 3. Нормалізація та серіалізація вмісту (JSON для тестів/питань)
        let finalContent = content || "";
        if (questions && Array.isArray(questions)) {
            finalContent = JSON.stringify(questions);
        } else if (typeof content === "object") {
            finalContent = JSON.stringify(content);
        }

        // 4. Створення запису навчального матеріалу
        const newMaterial = await prisma.material.create({
            data: {
                title,
                type: finalType,
                content: finalContent,
                videoUrl: videoUrl || null,
                subjectId,
                authorId: session.user.id,
                topicId: topicId || null,
            },
            include: {
                topic: true,
                subject: true,
            },
        });

        // 5. Призначення матеріалу обраному класу (Assignment)
        const newAssignment = await prisma.assignment.create({
            data: {
                materialId: newMaterial.id,
                classId,
                deadline: deadline ? new Date(deadline) : null,
                timeLimitMinutes: timeLimitMinutes ? Number(timeLimitMinutes) : null,
            },
        });

        // 6. Автоматичне створення відповідної колонки в журналі
        let journalColumnType: ColumnType = ColumnType.LESSON;
        if (finalType === MaterialType.PRACTICE) {
            journalColumnType = ColumnType.ASSIGNMENT;
        } else if (
            finalType === MaterialType.QUIZ ||
            finalType === MaterialType.CONTROL_WORK ||
            finalType === MaterialType.ATTESTATION
        ) {
            journalColumnType = ColumnType.TEST;
        }

        await prisma.journalColumn.create({
            data: {
                title: newMaterial.title,
                type: journalColumnType,
                subjectId,
                classId,
                materialId: newMaterial.id,
                deadline: deadline ? new Date(deadline) : null,
            },
        });

        // 7. Масова розсилка сповіщень усім учням призначеного класу
        const students = await prisma.user.findMany({
            where: {
                classId: classId,
                role: "STUDENT",
            },
            select: { id: true },
        });

        if (students.length > 0) {
            const isQuiz = journalColumnType === ColumnType.TEST;
            const notificationTitle = isQuiz ? "📝 Новий тест!" : "📖 Новий урок!";
            const notificationMessage = `Опубліковано новий ${isQuiz ? "тест" : "матеріал"}: «${title}»`;

            await prisma.notification.createMany({
                data: students.map((student) => ({
                    userId: student.id,
                    title: notificationTitle,
                    message: notificationMessage,
                    type: NotificationType.NEW_ASSIGNMENT,
                    subjectName: newMaterial.subject?.title || "Предмет",
                    isRead: false,
                })),
            });
        }

        return NextResponse.json(
            { material: newMaterial, assignment: newAssignment },
            { status: 201 }
        );
    } catch (error:any) {
        // Зберігаємо помилку у базі даних
        await logError({
            message: error.message || "Помилка при збереженні уроку",
            stack: error.stack,
            source: "API /api/teacher/materials/ [POST]",
        });
        return NextResponse.json(
            { error: "Помилка при збереженні уроку" },
            { status: 500 }
        );
    }
}