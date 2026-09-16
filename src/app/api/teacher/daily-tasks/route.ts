import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // Импорт параметров авторизации
import { prisma } from "@/lib/prisma";
import {logError} from "@/lib/logger";

export async function POST(req: Request) {
    try {
        // 1. Проверяем авторизацию учителя через NextAuth
        const session = await getServerSession(authOptions);

        if (!session || (session.user.role !== "TEACHER" && session.user.role !== "ADMIN")) {
            return NextResponse.json(
                { error: "Немає доступу або ви не авторизовані" },
                { status: 403 }
            );
        }

        const body = await req.json();
        const { title, description, subjectId, imageUrl, makeActive } = body;

        // 2. Проверяем наличие всех обязательных полей
        if (!title?.trim() || !description?.trim() || !subjectId) {
            return NextResponse.json(
                { error: "Всі поля (заголовок, опис, предмет) є обов'язковими" },
                { status: 400 }
            );
        }

        const authorId = session.user.id;

        // 3. Если новая задача публикуется как активная, снимаем активность с предыдущих
        if (makeActive) {
            await prisma.dailyTask.updateMany({
                where: { isActive: true },
                data: { isActive: false },
            });
        }

        // 4. Создаем новую задачу
        const newTask = await prisma.dailyTask.create({
            data: {
                title: title.trim(),
                description: description.trim(),
                subjectId,
                authorId,
                imageUrl: imageUrl || null,
                isActive: Boolean(makeActive),
            },
            include: {
                subject: { select: { title: true } },
            },
        });

        return NextResponse.json(newTask, { status: 201 });
    } catch (error:any) {
        // Зберігаємо помилку у базі даних
        await logError({
            message: error.message || "Помилка створення задачи дня",
            stack: error.stack,
            source: "API /api/teacher/daily-tasks/ [POST]",
        });
        return NextResponse.json(
            { error: "Не вдалося зберегти задачу" },
            { status: 500 }
        );
    }
}

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || (session.user.role !== "TEACHER" && session.user.role !== "ADMIN")) {
            return NextResponse.json({ error: "Немає доступу" }, { status: 403 });
        }

        const tasks = await prisma.dailyTask.findMany({
            where: { authorId: session.user.id },
            orderBy: { createdAt: "desc" },
            include: {
                subject: { select: { id: true, title: true } },
                _count: { select: { comments: true } },
            },
        });

        return NextResponse.json(tasks);
    } catch (error:any) {
        // Зберігаємо помилку у базі даних
        await logError({
            message: error.message || "Помилка завантаження задач вчителя",
            stack: error.stack,
            source: "API /api/teacher/daily-tasks/[id] [GET]",
        });
        return NextResponse.json({ error: "Не вдалося завантажити задачі" }, { status: 500 });
    }
}