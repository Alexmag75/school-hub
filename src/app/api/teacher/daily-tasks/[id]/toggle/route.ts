import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {logError} from "@/lib/logger";

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const taskId = resolvedParams.id;

        const body = await req.json();
        const { isActive } = body;

        if (!taskId) {
            return NextResponse.json(
                { error: "ID задачи не вказано" },
                { status: 400 }
            );
        }

        // Змінюємо статус лише для обраної задачи, не чіпаючи інші
        const updatedTask = await prisma.dailyTask.update({
            where: { id: taskId },
            data: { isActive: Boolean(isActive) },
            include: {
                subject: { select: { title: true } },
            },
        });

        return NextResponse.json(updatedTask);
    } catch (error:any) {
        // Зберігаємо помилку у базі даних
        await logError({
            message: error.message || "Помилка оновлення статусу задачи",
            stack: error.stack,
            source: "API /api/teacher/daily-tasks/[id]/toggle [PATCH]",
        });
        return NextResponse.json(
            { error: "Не вдалося змінити статус задачи" },
            { status: 500 }
        );
    }
}