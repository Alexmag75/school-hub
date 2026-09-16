import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {logError} from "@/lib/logger";

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> } // 1. Оголошуємо params як Promise
) {
    try {
        const { id } = await params; // 2. Розпаковуємо params через await
        const { title, content } = await request.json();

        const updated = await prisma.teacherNews.update({
            where: { id },
            data: {
                title,
                content,
            },
        });

        return NextResponse.json(updated);
    } catch (error:any) {
        // Зберігаємо помилку у базі даних
        await logError({
            message: error.message || "Помилка оновлення новин для вчителів",
            stack: error.stack,
            source: "API /api/teacher-news/[id]  [PUT]",
        });
        return NextResponse.json(
            { error: "Не вдалося оновити новину" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params; // Розпаковуємо і в DELETE маршрутах

        await prisma.teacherNews.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error:any) {
        // Зберігаємо помилку у базі даних
        await logError({
            message: error.message || "Помилка видалення новини",
            stack: error.stack,
            source: "API /api/teacher-news/[id]  [DELETE]",
        });
        return NextResponse.json(
            { error: "Не вдалося видалити новину" },
            { status: 500 }
        );
    }
}