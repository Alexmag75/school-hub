import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {logError} from "@/lib/logger";

// Оголошуємо точний тип для результату запиту Prisma з включеними відношеннями
type UserWithRelations = Prisma.UserGetPayload<{
    select: {
        id: true;
        fullName: true;
        lastName: true;
        className: {
            select: { id: true; name: true };
        };
        submissions: {
            select: { score: true };
        };
        lessonProgresses: {
            select: { id: true };
        };
    };
}>;

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const classId = searchParams.get("classId");

        const whereCondition: Prisma.UserWhereInput = { role: "STUDENT" };
        if (classId) {
            whereCondition.classId = classId;
        }

        // 1. Отримуємо дані
        const [studentsData, classes] = await Promise.all([
            prisma.user.findMany({
                where: whereCondition,
                select: {
                    id: true,
                    fullName: true,
                    lastName: true,
                    className: {
                        select: { id: true, name: true },
                    },
                    submissions: {
                        select: { score: true },
                    },
                    lessonProgresses: {
                        select: { id: true },
                    },
                },
            }) as Promise<UserWithRelations[]>,
            prisma.class.findMany({
                select: { id: true, name: true },
                orderBy: { name: "asc" },
            }),
        ]);

        // 2. Агрегуємо бали та сортуємо
        const students = studentsData
            .map((student: UserWithRelations) => {
                const points = student.submissions.reduce(
                    (sum: number, sub: { score: number | null }) => sum + (sub.score || 0),
                    0
                );
                const completedLessons = student.lessonProgresses.length;

                return {
                    id: student.id,
                    name: student.fullName,
                    surname: student.lastName,
                    points,
                    completedLessons,
                    class: student.className,
                };
            })
            .sort((a, b) => b.points - a.points || b.completedLessons - a.completedLessons);

        return NextResponse.json({ students, classes });
    } catch (error:any) {
        // Зберігаємо помилку у базі даних
        await logError({
            message: error.message || "Помилка отримання рейтингу",
            stack: error.stack,
            source: "API /api/rating [GET]",
        });
        return NextResponse.json({ error: "Помилка сервера" }, { status: 500 });
    }
}