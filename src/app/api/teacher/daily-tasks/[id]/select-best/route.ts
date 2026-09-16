import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {logError} from "@/lib/logger";

export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const taskId = params.id;
        const { commentId, teacherNote, bonusPoints } = await req.json();

        if (!commentId) {
            return NextResponse.json({ error: "Не вказано коментар" }, { status: 400 });
        }

        // 1. Снимаем статус лучшего ответа со всех комментариев этой задачи
        await prisma.dailyTaskComment.updateMany({
            where: { taskId },
            data: { isBestAnswer: false },
        });

        // 2. Отмечаем выбранный комментарий как лучший и сохраняем похвалу
        const updatedComment = await prisma.dailyTaskComment.update({
            where: { id: commentId },
            data: {
                isBestAnswer: true,
                teacherNote: teacherNote || null,
            },
            include: { author: true },
        });

        // 3. Закрываем задачу (завершаем прием ответов)
        await prisma.dailyTask.update({
            where: { id: taskId },
            data: { isClosed: true },
        });

        return NextResponse.json({
            success: true,
            message: "Переможця обрано успішно!",
            comment: updatedComment,
        });
    } catch (error:any) {
        // Зберігаємо помилку у базі даних
        await logError({
            message: error.message || "Помилка вибору кращої відповіді",
            stack: error.stack,
            source: "API /api/teacher/daily-tasks/[id]/select-best [POST]",
        });
        return NextResponse.json({ error: "Не вдалося зберегти вибір" }, { status: 500 });
    }
}