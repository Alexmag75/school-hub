import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {logError} from "@/lib/logger";

export async function GET() {
    try {
        const students = await prisma.user.findMany({
            where: {
                role: "STUDENT"
            },
            select: {
                id: true,
                fullName: true,
                lastName: true,
                className: {
                    select: {
                        name: true
                    }
                },
                submissions: {
                    where: {
                        score: { not: null }
                    },
                    select: {
                        score: true
                    }
                },
                quizSubmissions: {
                    select: {
                        score: true
                    }
                },
                lessonProgresses: {
                    where: {
                        isDone: true
                    },
                    select: {
                        id: true
                    }
                }
            }
        });

        // Подсчитываем общий балл и уроки
        const formatted = students.map((s) => {
            const submissionPoints = s.submissions.reduce((acc, sub) => acc + (sub.score || 0), 0);
            const quizPoints = s.quizSubmissions.reduce((acc, sub) => acc + (sub.score || 0), 0);
            const totalPoints = Math.round(submissionPoints + quizPoints);

            return {
                _id: s.id,
                name: s.fullName,
                surname: "",
                points: totalPoints,
                completedLessons: s.lessonProgresses.length,
                classId: s.className ? { name: s.className.name } : { name: "Учень" }
            };
        });

        // Сортируем по убыванию и берем ТОП-3
        const top3 = formatted
            .sort((a, b) => b.points - a.points)
            .slice(0, 3);

        return NextResponse.json(top3);
    } catch (error:any) {
        await logError({
            message: error.message || "Помилка отримання рейтингу учнів",
            stack: error.stack,
            source: "API /api/home/top-students [GET]",
        });
        return NextResponse.json(
            { error: "Не вдалося завантажити рейтинг" },
            { status: 500 }
        );
    }
}