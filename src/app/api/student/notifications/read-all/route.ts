// app/api/student/notifications/read-all/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {logError} from "@/lib/logger";

export async function PATCH() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Неавторизовано" }, { status: 401 });
        }

        await prisma.notification.updateMany({
            where: {
                userId: session.user.id,
                isRead: false,
            },
            data: {
                isRead: true,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error:any) {
        // Зберігаємо помилку у базі даних
        await logError({
            message: error.message || "Помилка оновлення",
            stack: error.stack,
            source: "API /api/student/notifications/read-all [GET]",
        });
        return NextResponse.json({ error: "Помилка оновлення" }, { status: 500 });
    }
}