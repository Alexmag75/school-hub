import {NextRequest, NextResponse} from "next/server";
import { prisma } from "@/lib/prisma";
import {logError} from "@/lib/logger";

// Отримати всі відповіді до задачи
export async function GET(
     req: NextRequest, context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const comments = await prisma.dailyTaskComment.findMany({
            where: { id },
            orderBy: { createdAt: "asc" },
            include: {
                author: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true
                    }
                },
            },
        });
        return NextResponse.json(comments);
    } catch (error:any) {
        // Зберігаємо помилку у базі даних
        await logError({
            message: error.message || "Помилка завантаження відповідей",
            stack: error.stack,
            source: "API /api/teacher/daily-tasks/[id]/comments [GET]",
        });
        return NextResponse.json({ error: "Помилка завантаження відповідей" }, { status: 500 });
    }
}

// Позначити/зняти переможну відповідь
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const body = await req.json();
        const { commentId, isWinner } = body;

        const updatedComment = await prisma.dailyTaskComment.update({
            where: { id: commentId },
            data: { isWinner: Boolean(isWinner) },
            include: {
                author: {
                    select: {
                        id: true,
                        fullName: true
                    }
                },
            },
        });

        return NextResponse.json(updatedComment);
    } catch (error:any) {
        // Зберігаємо помилку у базі даних
        await logError({
            message: error.message || "Не вдалося змінити статус відповіді",
            stack: error.stack,
            source: "API /api/teacher/daily-tasks/[id]/comments [PATCH]",
        });
        return NextResponse.json({ error: "Не вдалося змінити статус відповіді" }, { status: 500 });
    }
}