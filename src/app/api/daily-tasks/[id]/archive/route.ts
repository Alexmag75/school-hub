import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/logger";

export async function PATCH(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;

    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Неавторизовано" }, { status: 401 });
        }

        const body = await req.json().catch(() => ({}));
        // Якщо передано explicitly { isClosed: false }, відкриваємо, інакше закриваємо
        const isClosed = body.isClosed !== undefined ? body.isClosed : true;

        const updatedTask = await prisma.dailyTask.update({
            where: {
                id, // 👈 Змінено params.id на id
                authorId: session.user.id, // Гарантуємо, що вчитель архівує лише СВОЮ задачу
            },
            data: {
                isClosed,
                isActive: false, // При архівуванні знімаємо з головної сторінки
            },
        });

        return NextResponse.json(updatedTask);
    } catch (error: any) {
        await logError({
            message: error.message || "Помилка зміни архівного статусу задачі",
            stack: error.stack,
            source: "API /api/teacher/daily-tasks/[id]/archive [PATCH]",
        });
        return NextResponse.json({ error: "Не вдалося оновити статус" }, { status: 500 });
    }
}