import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {logError} from "@/lib/logger";

// GET /api/teacher-news — отримання новин для головної сторінки
export async function GET() {
    try {
        const news = await prisma.teacherNews.findMany({
            orderBy: { createdAt: "desc" },
            take: 6, // Показуємо останні 6 оголошень
            include: {
                author: {
                    select: { id: true, fullName: true },
                },
            },
        });

        return NextResponse.json(news);
    } catch (error:any) {
        // Зберігаємо помилку у базі даних
        await logError({
            message: error.message || "Помилка завантаження новин",
            stack: error.stack,
            source: "API /api/teacher-news  [GET]",
        });
        return NextResponse.json({ error: "Помилка завантаження новин" }, { status: 500 });
    }
}

// POST /api/teacher-news — створення оголошення вчителем
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== "TEACHER" && session.user.role !== "ADMIN")) {
        return NextResponse.json({ error: "Доступ заборонено" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { title, content, imageUrl, fileUrl, fileName } = body;

        if (!title?.trim() || !content?.trim()) {
            return NextResponse.json({ error: "Заповніть заголовок та зміст" }, { status: 400 });
        }

        const newsItem = await prisma.teacherNews.create({
            data: {
                title: title.trim(),
                content: content.trim(),
                imageUrl: imageUrl || null,
                fileUrl: fileUrl || null,
                fileName: fileName || null,
                authorId: session.user.id,
            },
        });

        return NextResponse.json(newsItem, { status: 201 });
    } catch (error:any) {
        // Зберігаємо помилку у базі даних
        await logError({
            message: error.message || "Помилка створення новини",
            stack: error.stack,
            source: "API /api/teacher-news  [POST]",
        });
        return NextResponse.json({ error: "Помилка створення новини" }, { status: 500 });
    }
}