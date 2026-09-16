import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/logger";
import { Prisma } from "@prisma/client";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);

        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "9");
        const search = searchParams.get("search")?.trim() || "";
        const subjectId = searchParams.get("subjectId") || "";
        const teacherId = searchParams.get("teacherId") || "";

        const skip = (page - 1) * limit;

        // Dynamic Prisma `where` clause
        const where: Prisma.TeacherNewsWhereInput = {};

        // 1. Пошук за заголовком або текстом новини
        if (search) {
            where.OR = [
                { title: { contains: search } },
                { content: { contains: search } },
            ];
        }

        // 2. Фільтр за предметом
        if (subjectId) {
            where.subjectId = subjectId;
        }

        // 3. Фільтр за автором / вчителем
        if (teacherId) {
            where.authorId = teacherId;
        }

        // Отримуємо відфільтрований список новин та їх точну кількість
        const [news, total] = await Promise.all([
            prisma.teacherNews.findMany({
                where,
                take: limit,
                skip: skip,
                orderBy: { createdAt: "desc" },
                include: {
                    author: {
                        select: { id: true, fullName: true },
                    },
                    subject: {
                        select: { id: true, title: true },
                    },
                },
            }),
            prisma.teacherNews.count({ where }),
        ]);

        return NextResponse.json({
            news,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit) || 1,
            },
        });
    } catch (error: any) {
        // Зберігаємо помилку у базі даних
        await logError({
            message: error.message || "Помилка отримання новин",
            stack: error.stack,
            source: "API /api/news [GET]",
        });
        return NextResponse.json({ error: "Помилка сервера" }, { status: 500 });
    }
}