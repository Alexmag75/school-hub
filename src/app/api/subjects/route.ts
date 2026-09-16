import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/logger";
import { Prisma } from "@prisma/client";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const all = searchParams.get("all") === "true";

        const where: Prisma.SubjectWhereInput = {};

        // Якщо all не передано (або all=false) — фільтруємо лише предмети з активними Задачами дня
        if (!all) {
            where.dailyTasks = {
                some: {
                    isActive: true,
                },
            };
        }

        const subjects = await prisma.subject.findMany({
            where,
            select: {
                id: true,
                title: true,
            },
            orderBy: {
                title: "asc",
            },
        });

        return NextResponse.json(subjects);
    } catch (error: any) {
        await logError({
            message: error.message || "Помилка завантаження предметів",
            stack: error.stack,
            source: "API /api/subjects [GET]",
        });
        return NextResponse.json(
            { error: "Не вдалося завантажити предмети" },
            { status: 500 }
        );
    }
}