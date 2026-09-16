import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/logger";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);

        // Пагінація
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || "15", 10);
        const skip = (page - 1) * limit;

        // Фільтри
        const search = searchParams.get("search") || "";
        const subjectId = searchParams.get("subjectId") || "";
        const classId = searchParams.get("classId") || "";
        const authorId = searchParams.get("authorId") || "";
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

        // Формуємо об'єкт умов Prisma
        const where: any = {
            isClosed: true,
        };

        if (subjectId) where.subjectId = subjectId;
        if (authorId) where.authorId = authorId;
        if (classId) where.classId = classId;

        if (search) {
            where.OR = [
                { title: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
            ];
        }

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                where.createdAt.lte = end;
            }
        }

        // Паралельно запитуємо дані та їх загальну кількість + метадані для фільтрів
        const [tasks, total, subjects, authors, classes] = await Promise.all([
            prisma.dailyTask.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    subject: { select: { id: true, title: true } },
                    author: { select: { id: true, fullName: true } },
                    comments: {
                        where: { isWinner: true },
                        include: {
                            author: { select: { id: true, fullName: true } },
                        },
                    },
                },
            }),
            prisma.dailyTask.count({ where }),
            prisma.subject.findMany({ select: { id: true, title: true }, orderBy: { title: "asc" } }),
            prisma.user.findMany({
                where: { role: { in: ["TEACHER", "ADMIN"] } },
                select: { id: true, fullName: true },
                orderBy: { fullName: "asc" },
            }),
            prisma.class.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
        ]);

        const totalPages = Math.ceil(total / limit);

        return NextResponse.json({
            tasks,
            pagination: {
                total,
                page,
                totalPages,
                limit,
            },
            filtersData: {
                subjects,
                authors,
                classes,
            },
        });
    } catch (error: any) {
        await logError({
            message: error.message || "Помилка завантаження архіву задач",
            stack: error.stack,
            source: "API /api/daily-tasks/archive [GET]",
        });
        return NextResponse.json({ error: "Помилка сервера" }, { status: 500 });
    }
}