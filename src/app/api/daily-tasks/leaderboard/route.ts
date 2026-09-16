import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {logError} from "@/lib/logger";

export async function GET() {
    try {
        // 1. Топ за кількістю перемог (isWinner = true)
        const topWinners = await prisma.user.findMany({
            where: {
                dailyTaskComments: {
                    some: { isWinner: true },
                },
            },
            select: {
                id: true,
                fullName: true,
                _count: {
                    select: {
                        dailyTaskComments: {
                            where: { isWinner: true },
                        },
                    },
                },
            },
            take: 5,
        });

        // 2. Топ за активністю (загальна кількість відповідей)
        const topActive = await prisma.user.findMany({
            where: {
                dailyTaskComments: {
                    some: {},
                },
            },
            select: {
                id: true,
                fullName: true,
                _count: {
                    select: { dailyTaskComments: true },
                },
            },
            take: 5,
        });

        // Форматування результатів
        const winnersFormatted = topWinners
            .map((u) => ({
                id: u.id,
                fullName: u.fullName,
                count: u._count.dailyTaskComments,
            }))
            .sort((a, b) => b.count - a.count);

        const activeFormatted = topActive
            .map((u) => ({
                id: u.id,
                fullName: u.fullName,
                count: u._count.dailyTaskComments,
            }))
            .sort((a, b) => b.count - a.count);

        return NextResponse.json({
            winners: winnersFormatted,
            active: activeFormatted,
        });
    } catch (error:any) {
        // Зберігаємо помилку у базі даних
        await logError({
            message: error.message || "Помилка завантаження рейтингу ",
            stack: error.stack,
            source: "API /api/daily-tasks/leaderboard [GET]",
        });
        return NextResponse.json(
            { error: "Не вдалося завантажити рейтинг" },
            { status: 500 }
        );
    }
}