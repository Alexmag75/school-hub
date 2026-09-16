/**
 * ==============================================================================
 * API ROUTE: Стрічка подій та Експорт в CSV (`/api/admin/activity`)
 * ==============================================================================
 */

import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {logError} from "@/lib/logger";

const formatUserName = (user?: { lastName?: string | null; fullName?: string | null }) => {
    if (!user) return "Користувач";
    if (user.fullName?.trim()) return user.fullName.trim();
    if (user.lastName?.trim()) return user.lastName.trim();
    return "Користувач";
};

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const isExport = searchParams.get("export") === "csv";

        // За останні 24 години
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        // 1. Реєстрації
        const recentUsers = await prisma.user.findMany({
            where: { createdAt: { gte: twentyFourHoursAgo } },
            take: 50,
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                fullName: true,
                lastName: true,
                role: true,
                createdAt: true,
            },
        });

        // 2. Матеріали
        const recentMaterials = await prisma.material.findMany({
            where: { createdAt: { gte: twentyFourHoursAgo } },
            take: 50,
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                title: true,
                createdAt: true,
                author: {
                    select: { fullName: true, lastName: true },
                },
            },
        }).catch(() => []);

        // 3. Завдання / Роботи
        const recentSubmissions = await prisma.submission.findMany({
            where: { startedAt: { gte: twentyFourHoursAgo } },
            take: 50,
            orderBy: { startedAt: "desc" },
            select: {
                id: true,
                startedAt: true,
                submittedAt: true,
                student: {
                    select: { fullName: true, lastName: true },
                },
            },
        }).catch(() => []);

        // Формування єдиного масиву
        const userEvents = recentUsers.map((u) => ({
            id: `user-${u.id}`,
            type: "USER_REGISTERED" as const,
            title: "Новий користувач",
            description: `${formatUserName(u)} (${u.role === "TEACHER" ? "Вчитель" : u.role === "ADMIN" ? "Адмін" : "Учень"})`,
            timestamp: u.createdAt,
        }));

        const materialEvents = recentMaterials.map((m: any) => ({
            id: `mat-${m.id}`,
            type: "MATERIAL_CREATED" as const,
            title: "Створено навчальний матеріал",
            description: `"${m.title || "Без назви"}" — ${formatUserName(m.author)}`,
            timestamp: m.createdAt,
        }));

        const submissionEvents = recentSubmissions.map((s) => ({
            id: `sub-${s.id}`,
            type: "WORK_SUBMITTED" as const,
            title: s.submittedAt ? "Здано виконання завдання" : "Розпочато виконання завдання",
            description: `Учень: ${formatUserName(s.student)}`,
            timestamp: s.submittedAt || s.startedAt,
        }));

        const allEvents = [...userEvents, ...materialEvents, ...submissionEvents]
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        // ЯКЩО ЗАПИТ НА ЕКСПОРТ В CSV
        if (isExport) {
            // Створюємо заголовки CSV
            const headers = ["ID", "Тип події", "Заголовок", "Опис / Користувач", "Дата та час"];

            // Формуємо рядки
            const rows = allEvents.map((event) => [
                `"${event.id}"`,
                `"${event.type}"`,
                `"${event.title.replace(/"/g, '""')}"`,
                `"${event.description.replace(/"/g, '""')}"`,
                `"${new Date(event.timestamp).toLocaleString("uk-UA")}"`
            ]);

            // BOM (\uFEFF) обов'язковий для коректного відкриття кирилиці в MS Excel
            const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");

            const filename = `activity_report_${new Date().toISOString().split("T")[0]}.csv`;

            return new NextResponse(csvContent, {
                status: 200,
                headers: {
                    "Content-Type": "text/csv; charset=utf-8",
                    "Content-Disposition": `attachment; filename="${filename}"`,
                },
            });
        }

        return NextResponse.json(allEvents);
    } catch (error:any) {
        // Зберігаємо помилку у базі даних
        await logError({
            message: error.message || "Помилка отримання системної активності",
            stack: error.stack,
            source: "API /api/admin/activity [GET]",
        });
        return NextResponse.json(
            { error: "Не вдалося завантажити останні події" },
            { status: 500 }
        );
    }
}