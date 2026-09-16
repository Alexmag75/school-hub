import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {logError} from "@/lib/logger";

// GET: Получение текущей активной задачи дня для главной страницы
export async function GET() {
    try {
        const activeTask = await prisma.dailyTask.findFirst({
            where: { isActive: true },
            include: {
                subject: { select: { title: true } },
                author: { select: { fullName: true } },
                comments: {
                    include: {
                        author: { select: { id: true, fullName: true, className: { select: { name: true } } } },
                    },
                    orderBy: { createdAt: "desc" },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        if (!activeTask) {
            return NextResponse.json(null);
        }

        // Находим комментарий с победителем (если учитель уже сделал выбор)
        const bestAnswer = activeTask.comments.find((c) => c.isBestAnswer) || null;

        return NextResponse.json({
            ...activeTask,
            bestAnswer,
        });
    } catch (error:any) {
        // Зберігаємо помилку у базі даних
        await logError({
            message: error.message || "Помилка завантаження задачи дня",
            stack: error.stack,
            source: "API /api/home/daily-tasks [GET]",
        });
        return NextResponse.json({ error: "Не вдалося завантажити задачу" }, { status: 500 });
    }
}

// POST: Отправка комментария / ответа учеником
export async function POST(req: Request) {
    try {
        const { taskId, text, userId } = await req.json();

        if (!taskId || !text || !userId) {
            return NextResponse.json({ error: "Заповніть всі поля" }, { status: 400 });
        }

        // Проверяем, не закрыта ли задача
        const task = await prisma.dailyTask.findUnique({
            where: { id: taskId },
            select: { isClosed: true },
        });

        if (task?.isClosed) {
            return NextResponse.json(
                { error: "Прийом відповідей до цієї задачи вже завершено" },
                { status: 400 }
            );
        }

        const comment = await prisma.dailyTaskComment.create({
            data: {
                text,
                taskId,
                authorId: userId,
            },
            include: {
                author: { select: { id: true, fullName: true, className: { select: { name: true } } } },
            },
        });

        return NextResponse.json(comment, { status: 201 });
    } catch (error:any) {
        // Зберігаємо помилку у базі даних
        await logError({
            message: error.message || "Помилка відправки відповіді",
            stack: error.stack,
            source: "API /api/home/daily-tasks [POST]",
        });
        return NextResponse.json({ error: "Не вдалося зберегти відповідь" }, { status: 500 });
    }
}