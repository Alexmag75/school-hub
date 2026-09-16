import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {logError} from "@/lib/logger";

/**
 * ==============================================================================
 * ROUTE: PATCH /api/student/notifications/[id]/read
 * ==============================================================================
 * @description Оновлення статусу окремого сповіщення користувача на "прочитано" (isRead: true).
 *              Використовуєбезпечний підхід `updateMany` із явним фільтром `userId`,
 *              що унеможливлює зміну статусу чужих сповіщень.
 *
 * @access      Тільки авторизовані користувачі
 * @param       {Params} context.params.id — Унікальний ідентифікатор сповіщення (Notification.id)
 *
 * @returns {Object} JSON `{ success: true, updatedCount: number }`
 * @status  200 OK — статус сповіщення успішно оновлено
 * @status  400 Bad Request — відсутній ідентифікатор сповіщення
 * @status  401 Unauthorized — сесія відсутня або недійсна
 * @status  500 Internal Server Error — помилка запиту до бази даних
 * ==============================================================================
 */
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        // 1. Перевірка авторизації користувача
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: "Неавторизовано" }, { status: 401 });
        }

        // 2. Асинхронна розпакування params для повної сумісності з Next.js 14 / 15
        const resolvedParams = await params;
        const notificationId = resolvedParams.id;

        if (!notificationId) {
            return NextResponse.json({ error: "ID сповіщення відсутній" }, { status: 400 });
        }

        console.log(`[PATCH Notification] Updating id=${notificationId} for userId=${session.user.id}`);

        // 3. Безопасное обновление статуса уведомления в БД
        // Использование updateMany гарантирует, что пользователь сможет обновить ТОЛЬКО своё уведомление
        const updated = await prisma.notification.updateMany({
            where: {
                id: notificationId,
                userId: session.user.id,
            },
            data: {
                isRead: true,
            },
        });

        // 4. Успешный ответ с количеством обновленных записей
        return NextResponse.json({ success: true, updatedCount: updated.count });
    } catch (error:any) {
        // Зберігаємо помилку у базі даних
        await logError({
            message: error.message || "Помилка Оновлення статусу",
            stack: error.stack,
            source: "API /api/student/notifications/[id]/read [PATCH]",
        });
        return NextResponse.json(
            { error: "Не вдалося оновити статус" },
            { status: 500 }
        );
    }
}