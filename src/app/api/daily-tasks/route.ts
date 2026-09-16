import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {logError} from "@/lib/logger";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const subjectId = searchParams.get("subjectId");
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = 3; // Обмеження 3 задачі на сторінку
        const skip = (page - 1) * limit;

        const where: any = { isActive: true };
        if (subjectId && subjectId !== "all") {
            where.subjectId = subjectId;
        }

        const [tasks, total] = await Promise.all([
            prisma.dailyTask.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    subject: {
                        select: { id: true, title: true },
                    },
                    author: {
                        select: { id: true, fullName: true },
                    },
                    comments: {
                        orderBy: { createdAt: "asc" },
                        include: {
                            author: {
                                select: { id: true, fullName: true, role: true },
                            },
                        },
                    },
                },
            }),
            prisma.dailyTask.count({ where }),
        ]);

        return NextResponse.json({
            tasks: tasks.map((task) => ({
                ...task,
                comments: task.comments || [], // Захист від undefined
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error:any) {
        // Зберігаємо помилку у базі даних
        await logError({
            message: error.message || "Помилка завантаження активних задач ",
            stack: error.stack,
            source: "API /api/daily-tasks [GET]",
        });
        return NextResponse.json(
            { error: "Не вдалося завантажити задачі" },
            { status: 500 }
        );
    }
}