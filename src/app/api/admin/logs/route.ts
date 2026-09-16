import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/logger";

// GET: Отримання списку логів для адмінки
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const limit = Number(searchParams.get("limit")) || 50;

        const logs = await prisma.systemLog.findMany({
            take: limit,
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ logs });
    } catch (error:any) {
        // Зберігаємо помилку у базі даних
        await logError({
            message: error.message || "Не вдалося завантажити логи",
            stack: error.stack,
            source: "API /api/admin/logs [GET]",
        });
        return NextResponse.json({ error: "Не вдалося завантажити логи" }, { status: 500 });
    }
}

// POST: Прийом помилок з клієнтської частини (React/Next.js components)
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const userAgent = req.headers.get("user-agent") || undefined;

        await logError({
            message: body.message || "Невідома клієнтська помилка",
            stack: body.stack,
            source: body.source || "Client Side",
            userId: body.userId,
            userEmail: body.userEmail,
            userRole: body.userRole,
            userAgent,
        });

        return NextResponse.json({ success: true });
    } catch (error:any) {
        // Зберігаємо помилку у базі даних
        await logError({
            message: error.message || "Помилка збереження логу",
            stack: error.stack,
            source: "API /api/admin/logs [POST]",
        });
        return NextResponse.json({ error: "Помилка збереження логу" }, { status: 500 });
    }
}

// DELETE: Очищення логів (наприклад, видалити старше 30 днів або всі)
export async function DELETE() {
    try {
        await prisma.systemLog.deleteMany({});
        return NextResponse.json({ success: true });
    } catch (error:any) {
        // Зберігаємо помилку у базі даних
        await logError({
            message: error.message || "Помилка збереження логу",
            stack: error.stack,
            source: "API /api/admin/logs [DELETE]",
        });
        return NextResponse.json({ error: "Не вдалося очистити логи" }, { status: 500 });
    }
}