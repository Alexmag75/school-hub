import { prisma } from "@/lib/prisma";

interface LogPayload {
    message: string;
    stack?: string;
    source?: string;
    userId?: string;
    userEmail?: string;
    userRole?: string;
    userAgent?: string;
}

export async function logError(data: LogPayload) {
    try {
        console.error(`[SYSTEM LOG ERROR] ${data.source || ""}:`, data.message);

        await prisma.systemLog.create({
            data: {
                level: "ERROR",
                message: data.message,
                stack: data.stack || null,
                source: data.source || "System",
                userId: data.userId || null,
                userEmail: data.userEmail || null,
                userRole: data.userRole || null,
                userAgent: data.userAgent || null,
            },
        });
    } catch (err) {
        // Якщо сама база даних не відповідає — просто виводимо у консоль сервера
        console.error("Не вдалося зберегти лог у БД:", err);
    }
}