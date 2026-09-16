import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/logger";

// Рекурсивный расчет размера папки и количества файлов
function getDirStats(dirPath: string): { totalSize: number; fileCount: number } {
    let totalSize = 0;
    let fileCount = 0;

    if (!fs.existsSync(dirPath)) {
        return { totalSize: 0, fileCount: 0 };
    }

    try {
        const files = fs.readdirSync(dirPath, { withFileTypes: true });

        for (const file of files) {
            const fullPath = path.join(dirPath, file.name);
            if (file.isDirectory()) {
                const res = getDirStats(fullPath);
                totalSize += res.totalSize;
                fileCount += res.fileCount;
            } else if (file.isFile()) {
                const stats = fs.statSync(fullPath);
                totalSize += stats.size;
                fileCount++;
            }
        }
    } catch (e) {
        console.error("Помилка зчитування директорії uploads:", e);
    }

    return { totalSize, fileCount };
}

export async function GET() {
    try {
        // 1. Подсчет дискового пространства в public/uploads
        const uploadsDir = path.join(process.cwd(), "public", "uploads");
        const { totalSize, fileCount } = getDirStats(uploadsDir);

        const limitBytes = 10 * 1024 * 1024 * 1024; // Лимит 10 GB
        const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2);
        const usagePercentage = Math.min(100, Math.round((totalSize / limitBytes) * 100));

        // 2. Получение данных для безопасности
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Активные сессии за сегодня
        const activeUsersToday = await prisma.user.count({
            where: { updatedAt: { gte: startOfToday } }
        });

        // 3. Подсчет системных ошибок за последние 24 часа
        const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const errorsCount24h = await prisma.systemLog.count({
            where: {
                createdAt: { gte: last24Hours }
            }
        });

        // Берем последних пользователей для имитации журнала безопасности
        const recentUsers = await prisma.user.findMany({
            take: 20,
            orderBy: { updatedAt: "desc" },
            select: { email: true, role: true, updatedAt: true }
        });

        const securityLogs = recentUsers.map((u, i) => ({
            id: `log-${i}`,
            email: u.email,
            event: i === 0 ? "Успішний вхід в систему" : i === 1 ? "Оновлення профілю" : "Авторизація через JWT",
            status: "success" as const,
            ip: "192.168.1." + (10 + i * 3),
            time: u.updatedAt
        }));

        return NextResponse.json({
            storage: {
                folderPath: "public/uploads",
                usedBytes: totalSize,
                usedMB: sizeInMB,
                limitGB: 10,
                percentage: usagePercentage,
                fileCount
            },
            security: {
                activeSessionsToday: activeUsersToday,
                failedAttempts24h: 0,
                securityAlerts: 0,
                logs: securityLogs
            },
            errorsCount24h // Кількість зареєстрованих помилок за добу
        });
    } catch (error: any) {
        // Зберігаємо помилку у базі даних
        await logError({
            message: error.message || "Помилка аналітики системы",
            stack: error.stack,
            source: "API /api/admin/analytics/system [GET]",
        });
        return NextResponse.json(
            { error: "Не вдалося завантажити системні метрики" },
            { status: 500 }
        );
    }
}