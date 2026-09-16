/**
 * ==============================================================================
 * API ROUTE: Отримання та пошук списку всіх вчителів (`/api/admin/teachers`)
 * ==============================================================================
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {logError} from "@/lib/logger";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search") || searchParams.get("query") || "";

        const teachers = await prisma.user.findMany({
            where: {
                role: "TEACHER",
                ...(search && {
                    OR: [
                        { lastName: { contains: search } },
                        { fullName: { contains: search } },
                        { email: { contains: search } },
                    ],
                }),
            },
            select: {
                id: true,
                lastName: true,
                fullName: true,
                email: true,
            },
            orderBy: {
                lastName: "asc",
            },
        });

        const formattedTeachers = teachers.map((t) => ({
            id: t.id,
            name: t.fullName || `${t.lastName} ""}`.trim(),
            email: t.email,
        }));

        return NextResponse.json(formattedTeachers);
    } catch (error:any) {
        // Зберігаємо помилку у базі даних
        await logError({
            message: error.message || "Помилка завантаження списку вчителів",
            stack: error.stack,
            source: "API /api/admin/teachers [GET]",
        });
        return NextResponse.json(
            { error: "Не вдалося завантажити список вчителів" },
            { status: 500 }
        );
    }
}