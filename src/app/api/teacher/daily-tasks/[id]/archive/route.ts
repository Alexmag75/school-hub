import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {logError} from "@/lib/logger";

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const updatedTask = await prisma.dailyTask.update({
            where: { id },
            data: {
                isClosed: true,
                isActive: false,
            },
        });

        return NextResponse.json(updatedTask);
    } catch (error:any) {
        // Зберігаємо помилку у базі даних
        await logError({
            message: error.message || "Не вдалося перевести задачу в архів",
            stack: error.stack,
            source: "API /api/teacher/daily-tasks/[id]/archive [POST]",
        });
        return NextResponse.json(
            { error: "Не вдалося перевести задачу в архів" },
            { status: 500 }
        );
    }
}