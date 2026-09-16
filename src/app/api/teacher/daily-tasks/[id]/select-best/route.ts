import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/logger";

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;

    try {
        const taskId = id; // 👈 Використовуємо отриманий id замість params.id
        const { commentId, teacherNote, bonusPoints } = await req.json();

        if (!commentId) {
            return NextResponse.json({ error: "Не вказано коментар" }, { status: 400 });
        }

        // 1. Знімаємо статус кращої відповіді з усіх коментарів цієї задачі
        await prisma.dailyTaskComment.updateMany({
            where: { taskId },
            data: { isBestAnswer: false },
        });

        // 2. Позначаємо обраний коментар як кращий та зберігаємо похвалу
        const updatedComment = await prisma.dailyTaskComment.update({
            where: { id: commentId },
            data: {
                isBestAnswer: true,
                teacherNote: teacherNote || null,
            },
            include: { author: true },
        });

        // 3. Закриваємо задачу (завершуємо прийом відповідей)
        await prisma.dailyTask.update({
            where: { id: taskId },
            data: { isClosed: true },
        });

        return NextResponse.json({
            success: true,
            message: "Переможця обрано успішно!",
            comment: updatedComment,
        });
    } catch (error: any) {
        // Зберігаємо помилку у базі даних
        await logError({
            message: error.message || "Помилка вибору кращої відповіді",
            stack: error.stack,
            source: "API /api/teacher/daily-tasks/[id]/select-best [POST]",
        });
        return NextResponse.json({ error: "Не вдалося зберегти вибір" }, { status: 500 });
    }
}