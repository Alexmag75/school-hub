import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {logError} from "@/lib/logger";

export async function GET() {
    try {
        // 1. Статусы выполнения ДЗ (Completion Rate)
        const submissions = await prisma.submission.findMany({
            select: {
                id: true,
                submittedAt: true,
                startedAt: true,
                score: true,
                assignment: {
                    select: {
                        deadline: true
                    }
                }
            }
        });

        let onTime = 0;
        let late = 0;
        let pending = 0;

        // Инициализируем матрицу 7 дней (0 - Пн ... 6 - Вс) х 24 часа
        const heatmap: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));

        submissions.forEach((sub) => {
            // Анализ дисциплины
            if (!sub.submittedAt) {
                pending++;
            } else if (sub.assignment?.deadline && new Date(sub.submittedAt) > new Date(sub.assignment.deadline)) {
                late++;
            } else {
                onTime++;
            }

            // Заполнение тепловой карты по времени отправки (или начала работы)
            const activeDate = sub.submittedAt || sub.startedAt;
            if (activeDate) {
                const date = new Date(activeDate);
                // Преобразуем getDay(): 0 (Вс) -> 6, 1 (Пн) -> 0 и т.д.
                const dayIndex = (date.getDay() + 6) % 7;
                const hourIndex = date.getHours();
                heatmap[dayIndex][hourIndex] += 1;
            }
        });

        const totalSubmissions = submissions.length || 1;
        const completionRate = {
            onTime: Math.round((onTime / totalSubmissions) * 100),
            late: Math.round((late / totalSubmissions) * 100),
            pending: Math.round((pending / totalSubmissions) * 100),
            counts: { onTime, late, pending, total: submissions.length }
        };

        // 2. Средний балл по классам
        const classes = await prisma.class.findMany({
            select: {
                id: true,
                name: true,
                students: {
                    select: {
                        submissions: {
                            where: { score: { not: null } },
                            select: { score: true }
                        }
                    }
                }
            }
        });

        const classPerformance = classes.map((cls) => {
            const scores: number[] = [];
            cls.students.forEach((student) => {
                student.submissions.forEach((sub) => {
                    if (sub.score !== null && sub.score !== undefined) {
                        scores.push(sub.score);
                    }
                });
            });

            const avgScore = scores.length
                ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
                : 0;

            return {
                id: cls.id,
                className: cls.name,
                avgScore,
                totalGraded: scores.length
            };
        }).sort((a, b) => b.avgScore - a.avgScore).slice(0, 8);

        return NextResponse.json({
            completionRate,
            classPerformance,
            heatmap
        });
    } catch (error:any) {
        // Зберігаємо помилку у базі даних
        await logError({
            message: error.message || "Помилка завантаження навчальної аналітики",
            stack: error.stack,
            source: "API /api/admin/analytics/academic [GET]",
        });
        return NextResponse.json(
            { error: "Не вдалося завантажити навчальну аналітику" },
            { status: 500 }
        );
    }
}