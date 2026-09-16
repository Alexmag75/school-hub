import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {logError} from "@/lib/logger";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json([]);
        }

        // Ищем пользователя по email
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true },
        });

        if (!user) {
            return NextResponse.json([]);
        }

        // Получаем уведомления
        const notifications = await prisma.notification.findMany({
            where: {
                userId: user.id,
            },
            orderBy: {
                createdAt: "desc",
            },
            take: 20,
        });

        // Возвращаем чистый массив, как ожидает TS-интерфейс
        return NextResponse.json(notifications);
    } catch (error:any) {
        // Зберігаємо помилку у базі даних
        await logError({
            message: error.message || "Помилка отримання сповіщень",
            stack: error.stack,
            source: "API /api/student/notifications//read-all [GET]",
        });
        // Возвращаем пустой массив при сбоях, чтобы не "валить" фронтенд
        return NextResponse.json([]);
    }
}