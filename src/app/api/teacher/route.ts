import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/logger";

export async function GET() {
    try {
        const teachers = await prisma.user.findMany({
            where: {
                role: "TEACHER",
            },
            select: {
                id: true,
                fullName: true,
                lastName: true,
                email: true,
            },
            orderBy: {
                fullName: "asc",
            },
        });

        const formattedTeachers = teachers.map((t) => ({
            id: t.id,
            fullName: t.fullName || t.lastName || t.email,
        }));

        return NextResponse.json(formattedTeachers);
    } catch (error: any) {
        await logError({
            message: error.message || "Помилка завантаження списку вчителів",
            stack: error.stack,
            source: "API /api/teachers [GET]",
        });
        return NextResponse.json(
            { error: "Не вдалося завантажити список вчителів" },
            { status: 500 }
        );
    }
}