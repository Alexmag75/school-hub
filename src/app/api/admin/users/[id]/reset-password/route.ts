import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import {logError} from "@/lib/logger";

/**
 * Вспомогательная функция для генерации временного случайного пароля.
 * Создает 8-символьную псевдослучайную альфа-нумерическую строку.
 */
const generateRandomPassword = () => Math.random().toString(36).slice(-8);

/**
 * ==============================================================================
 * ROUTE: POST /api/admin/users/[id]/reset-password
 * ==============================================================================
 * @description Сброс пароля пользователя администратором. Гененрирует новый
 *              временный пароль, хеширует его и возвращает открытый пароль
 *              администратору для передачи пользователю.
 * @access      Только АДМИНИСТРАТОР (ADMIN)
 *
 * @param       {Request} req — Входной HTTP-запрос
 * @param       {Object} context — Контекст маршрутизации Next.js
 * @param       {Promise<{ id: string }> | { id: string }} context.params — Параметры URL
 *
 * @returns {Object} JSON с новым сгенерированным паролем и краткой информацией о пользователе
 * @status  200 OK — пароль успешно сброшен
 * @status  400 Bad Request — ID пользователя не указан
 * @status  403 Forbidden — нет прав администратора
 * @status  404 Not Found — пользователь не найден
 * @status  500 Internal Server Error — ошибка хеширования или работы с БД
 * ==============================================================================
 */
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        // 1. Проверка авторизации администратора
        const session = await getServerSession(authOptions);

        if (!session || session.user?.role !== "ADMIN") {
            return NextResponse.json({ error: "Немає доступу" }, { status: 403 });
        }

        // 2. Разрешение параметров URL (совместимость с асинхронными params в Next.js 15 и синхронными в Next.js 14)
        const resolvedParams = await params;
        const userId = resolvedParams.id;

        if (!userId) {
            return NextResponse.json({ error: "ID користувача не вказано" }, { status: 400 });
        }

        // 3. Проверяем существование пользователя в БД перед сбросом
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, fullName: true, lastName: true },
        });

        if (!user) {
            return NextResponse.json({ error: "Користувача не знайдено" }, { status: 404 });
        }

        // 4. Генерация нового временного пароля и его безопасное хеширование
        const newPassword = generateRandomPassword();
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // 5. Обновление хеша пароля в базе данных
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });

        // 6. Возвращаем новый открытый пароль администратору (чтобы он мог скопировать/передать его)
        return NextResponse.json({
            message: "Пароль успішно скинуто",
            newPassword,
            user: {
                id: user.id,
                email: user.email,
                name: user.fullName || user.lastName,
            },
        });
    } catch (error: any) {
        // Зберігаємо помилку у базі даних
        await logError({
            message: error.message || "Помилка при скиданні пароля на сервері",
            stack: error.stack,
            source: "API /api/admin/users/[id]/reset-password [POST]",
        });
        return NextResponse.json(
            {
                error: "Помилка при скиданні пароля на сервері",
                // Безопасная передача деталей ошибки только в режиме разработки
                details: process.env.NODE_ENV === "development" ? error?.message : undefined
            },
            { status: 500 }
        );
    }
}