import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MaterialType } from "@prisma/client";
import {logError} from "@/lib/logger";

/**
 * ==============================================================================
 * ROUTE: GET /api/teacher/materials/[id]
 * ==============================================================================
 * @description Отримання детальної інформації про конкретний навчальний матеріал
 *              (урок) за його ID, включаючи тему, предмет та призначені класи.
 *
 * @access      Авторизовані користувачі (Вчителі, Учні, Адміністрація)
 * @params      {Promise<{ id: string }>} params — Асинхронний об'єкт параметрів URL (Next.js 15+)
 *
 * @returns {Object} JSON об'єкт матеріалу зі зв'язаними сутностями
 * @status  200 OK — матеріал успішно знайдено
 * @status  401 Unauthorized — користувач не авторизований
 * @status  404 Not Found — матеріал із зазначеним ID відсутній
 * @status  500 Internal Server Error — помилка роботи з базою даних
 * ==============================================================================
 */
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    // 1. Перевірка авторизації
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: "Неавторизований" }, { status: 401 });
    }

    try {
        // 2. Розпакування асинхронних параметрів URL (Next.js 15)
        const resolvedParams = await params;

        // 3. Пошук матеріалу в БД за ID разом із залежними сутностями
        const material = await prisma.material.findUnique({
            where: { id: resolvedParams.id },
            include: {
                topic: { select: { id: true, title: true } },
                subject: { select: { id: true, title: true } },
                assignments: {
                    include: {
                        class: { select: { id: true, name: true } },
                    },
                },
            },
        });

        if (!material) {
            return NextResponse.json({ error: "Урок не знайдено" }, { status: 404 });
        }

        return NextResponse.json(material);
    } catch (error:any) {
        // Зберігаємо помилку у базі даних
        await logError({
            message: error.message || "Помилка отримання уроку",
            stack: error.stack,
            source: "API /api/teacher/materials/[id] [GET]",
        });
        return NextResponse.json({ error: "Помилка отримання уроку" }, { status: 500 });
    }
}

/**
 * ==============================================================================
 * ROUTE: PUT /api/teacher/materials/[id]
 * ==============================================================================
 * @description Оновлення інформації про матеріал (урок) та синхронізація
 *              його призначень (Assignment) для класів або оновлення дедлайнів.
 *
 * @access      Тільки авторизовані вчителі (`TEACHER`) або адміністратори (`ADMIN`)
 * @params      {Promise<{ id: string }>} params — Асинхронний об'єкт параметрів URL
 *
 * @bodyParams  {string} title — Назва уроку (обов'язково)
 * @bodyParams  {string} subjectId — ID предмета (обов'язково)
 * @bodyParams  {string} [classId] — ID конкретного класу для призначення
 * @bodyParams  {string} [topicId] — ID теми програми
 * @bodyParams  {MaterialType} [type="THEORY"] — Тип матеріалу (enum MaterialType)
 * @bodyParams  {string} [content] — Текстовий вміст або HTML-структура уроку
 * @bodyParams  {string} [videoUrl] — Посилання на відеоматеріал
 * @bodyParams  {string|Date} [deadline] — Дата та час дедлайну для виконання
 *
 * @returns {Object} JSON об'єкт оновленого матеріалу
 * @status  200 OK — урок успішно оновлено
 * @status  400 Bad Request — відсутні обов'язкові поля
 * @status  403 Forbidden — недостатньо прав доступу
 * @status  500 Internal Server Error — помилка оновлення в БД
 * ==============================================================================
 */
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    // 1. Перевірка ролі користувача
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "TEACHER" && session.user.role !== "ADMIN")) {
        return NextResponse.json({ error: "Немає доступу" }, { status: 403 });
    }

    try {
        const resolvedParams = await params;
        const body = await req.json();
        const { title, subjectId, classId, topicId, type, content, videoUrl, deadline } = body;

        // 2. Валідація обов'язкових полів
        if (!title || !subjectId) {
            return NextResponse.json({ error: "Заповніть назву та предмет" }, { status: 400 });
        }

        // 3. Оновлення основного запису матеріалу
        const updatedMaterial = await prisma.material.update({
            where: { id: resolvedParams.id },
            data: {
                title,
                type: (type as MaterialType) || "THEORY",
                content: content || "",
                videoUrl: videoUrl || null,
                subjectId: subjectId,
                topicId: topicId || null,
            },
        });

        // 4. Парсинг дедлайну
        const parsedDeadline = deadline ? new Date(deadline) : null;

        // 5. Синхронізація призначень (Assignment) матеріалу
        if (classId) {
            // Якщо передано конкретний клас — шукаємо та оновлюємо/створюємо призначення для нього
            const existingAssignment = await prisma.assignment.findFirst({
                where: {
                    materialId: resolvedParams.id,
                    classId: classId,
                },
            });

            if (existingAssignment) {
                await prisma.assignment.update({
                    where: { id: existingAssignment.id },
                    data: { deadline: parsedDeadline },
                });
            } else {
                await prisma.assignment.create({
                    data: {
                        materialId: resolvedParams.id,
                        classId: classId,
                        deadline: parsedDeadline,
                    },
                });
            }
        } else {
            // Якщо classId не передано — оновлюємо дедлайн для всіх існуючих призначень цього уроку
            await prisma.assignment.updateMany({
                where: { materialId: resolvedParams.id },
                data: { deadline: parsedDeadline },
            });
        }

        return NextResponse.json(updatedMaterial);
    } catch (error:any) {
        // Зберігаємо помилку у базі даних
        await logError({
            message: error.message || "Не вдалося оновити урок",
            stack: error.stack,
            source: "API /api/teacher/materials/[id] [PUT]",
        });
        return NextResponse.json({ error: "Не вдалося оновити урок" }, { status: 500 });
    }
}

/**
 * ==============================================================================
 * ROUTE: DELETE /api/teacher/materials/[id]
 * ==============================================================================
 * @description Видалення навчального матеріалу (уроку) за його ID.
 *              Пов'язані призначення (Assignment) та посилання в журналі
 *              обробляються автоматично каскадними правилами бази даних.
 *
 * @access      Тільки авторизовані вчителі (`TEACHER`) або адміністратори (`ADMIN`)
 * @params      {Promise<{ id: string }>} params — Асинхронний об'єкт параметрів URL
 *
 * @returns {Object} Повідомлення про успішне видалення `{ message: "..." }`
 * @status  200 OK — урок успішно видалено
 * @status  403 Forbidden — недостатньо прав доступу
 * @status  500 Internal Server Error — помилка видалення з бази даних
 * ==============================================================================
 */
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    // 1. Перевірка ролі користувача
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "TEACHER" && session.user.role !== "ADMIN")) {
        return NextResponse.json({ error: "Немає доступу" }, { status: 403 });
    }

    try {
        const resolvedParams = await params;

        // 2. Видалення матеріалу з бази даних
        await prisma.material.delete({
            where: { id: resolvedParams.id },
        });

        return NextResponse.json({ message: "Урок успішно видалено" });
    } catch (error:any) {
        // Зберігаємо помилку у базі даних
        await logError({
            message: error.message || "Не вдалося видалити урок",
            stack: error.stack,
            source: "API /api/teacher/materials/[id] [DELETE]",
        });
        return NextResponse.json({ error: "Не вдалося видалити урок" }, { status: 500 });
    }
}