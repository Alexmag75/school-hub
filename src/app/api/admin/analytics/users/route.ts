import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {logError} from "@/lib/logger";

export async function GET() {
    try {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // 1. Расчет DAU, MAU и общего количества пользователей
        const [totalUsers, dau, mau, rolesCount] = await Promise.all([
            prisma.user.count(),
            // Активность за сегодня
            prisma.user.count({
                where: {
                    updatedAt: { gte: startOfToday }
                }
            }),
            // Активность за последние 30 дней
            prisma.user.count({
                where: {
                    updatedAt: { gte: thirtyDaysAgo }
                }
            }),
            // Распределение по ролям
            prisma.user.groupBy({
                by: ['role'],
                _count: { _all: true }
            })
        ]);

        const roleMap = rolesCount.reduce((acc, curr) => {
            acc[curr.role] = curr._count._all;
            return acc;
        }, {} as Record<string, number>);

        // Stickiness Ratio (DAU / MAU)
        const stickiness = mau > 0 ? Math.round((dau / mau) * 100) : 0;

        // 2. Обучающие материалы
        const rawMaterials = await prisma.material.findMany({
            take: 6,
            orderBy: {
                createdAt: "desc"
            },
            select: {
                id: true,
                title: true,
                createdAt: true,
                author: {
                    select: {
                        email: true,
                        role: true
                    }
                }
            }
        });

        // Форматируем под интерфейс фронтенда
        const topMaterials = rawMaterials.map((item) => ({
            id: item.id,
            title: item.title,
            viewsCount: 0, // Дефолтное значение, если просмотры не трекаются в БД
            downloadsCount: 0,
            createdAt: item.createdAt,
            author: item.author ? {
                name: item.author.email.split("@")[0], // Формируем отображаемое имя из email
                role: item.author.role
            } : undefined
        }));

        return NextResponse.json({
            metrics: {
                dau,
                mau,
                stickiness,
                totalUsers,
                roles: {
                    students: roleMap["STUDENT"] || 0,
                    teachers: roleMap["TEACHER"] || 0,
                    admins: roleMap["ADMIN"] || 0
                }
            },
            topMaterials
        });
    } catch (error:any) {
        // Зберігаємо помилку у базі даних
        await logError({
            message: error.message || "Помилка завантаження аналітики користувачів та контенту",
            stack: error.stack,
            source: "API /api/admin/analytics/users [GET]",
        });
        return NextResponse.json(
            { error: "Не вдалося завантажити метрики користувачів" },
            { status: 500 }
        );
    }
}