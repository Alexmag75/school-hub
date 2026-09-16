import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {logError} from "@/lib/logger";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Авторизуйтесь для відповіді" }, { status: 401 });
        }

        const { id: taskId } = await params;
        const body = await req.json();
        const { text } = body;

        if (!text || !text.trim()) {
            return NextResponse.json({ error: "Текст коментаря порожній" }, { status: 400 });
        }

        const comment = await prisma.dailyTaskComment.create({
            data: {
                text: text.trim(),
                taskId,
                authorId: session.user.id,
            },
            include: {
                author: {
                    select: {
                        id: true,
                        fullName: true,
                        role: true
                    }
                },
            },
        });

        return NextResponse.json(comment, { status: 201 });
    } catch (error:any) {
        // Зберігаємо помилку у базі даних
        await logError({
            message: error.message || "Помилка створення коментаря",
            stack: error.stack,
            source: "API /api/daily-tasks/[id]/comments [POST]",
        });
        return NextResponse.json({ error: "Не вдалося зберегти відповідь" }, { status: 500 });
    }
}