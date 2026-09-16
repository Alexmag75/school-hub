import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StudentTaskStatus } from "@prisma/client";
import {logError} from "@/lib/logger";

/**
 * ==============================================================================
 * ROUTE: GET /api/student/stats
 * ==============================================================================
 * @description Отримання зведеної статистики та аналітики для головного дашборду учня:
 *              відсоток вчасно виконаних завдань, лічильники зданих/протермінованих робіт,
 *              останні 5 отриманих оцінок та поточний стрік (активність поспіль).
 * @access      Тільки авторизовані користувачі (Учні)
 *
 * @returns {Object} JSON з аналітичними показниками та інформацією про стрік
 * @status  200 OK — статистику успішно зібрано
 * @status  401 Unauthorized — користувач не авторизований
 * @status  500 Internal Server Error — помилка розрахунку на сервері
 * ==============================================================================
 */
export async function GET() {
    try {
        // 1. Перевірка сесії авторизації користувача
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Неавторизований" }, { status: 401 });
        }

        const studentId = session.user.id;

        // 2. Отримуємо клас, до якого прикріплений учень
        const student = await prisma.user.findUnique({
            where: { id: studentId },
            select: { classId: true },
        });

        // Якщо учень не прив'язаний до жодного класу — повертаємо нульову статистику
        if (!student || !student.classId) {
            return NextResponse.json({
                completionRate: 0,
                totalAssignments: 0,
                onTimeCount: 0,
                totalSubmitted: 0,
                overdueCount: 0,
                recentGrades: [],
                streak: 0,
            });
        }

        // 3. Отримуємо всі колонки електронного журналу для даного класу
        const rawJournalColumns = await prisma.journalColumn.findMany({
            where: { classId: student.classId },
            select: {
                id: true,
                title: true,
                deadline: true,
                materialId: true,
                subjectId: true,
            },
        });

        // 4. Отримуємо всі АКТИВНІ призначення (Assignment) класу
        const activeAssignments = await prisma.assignment.findMany({
            where: { classId: student.classId },
            select: {
                id: true,
                materialId: true,
            },
        });

        // Створюємо Set з ID матеріалів для швидкого O(1) пошуку
        const activeMaterialIds = new Set(
            activeAssignments
                .map((a) => a.materialId)
                .filter((id): id is string => Boolean(id))
        );

        // Залишаємо тільки ті колонки журналу, які прив'язані до активних призначень
        const journalColumns = rawJournalColumns.filter((col) => {
            return col.materialId ? activeMaterialIds.has(col.materialId) : false;
        });

        const columnIds = journalColumns.map((c) => c.id);

        // 5. Отримуємо виставлені оцінки/записи учня для відфільтрованих колонок
        const grades = await prisma.grade.findMany({
            where: {
                studentId,
                columnId: { in: columnIds },
            },
        });

        // 6. Отримуємо список переглянутих/виконаних уроків з прогресу
        const lessonProgresses = await prisma.lessonProgress.findMany({
            where: { userId: studentId, isDone: true },
            select: { lessonId: true },
        });
        const completedLessonIds = new Set(lessonProgresses.map((lp) => lp.lessonId));

        // Створюємо Map оцінок за columnId для швидкої вибірки
        const gradeMap = new Map<string, (typeof grades)[0]>();
        grades.forEach((g) => gradeMap.set(g.columnId, g));

        const now = new Date();
        const totalAssignments = journalColumns.length;
        let onTimeCount = 0;
        let totalSubmitted = 0;
        let overdueCount = 0;

        // 7. Аналіз стану виконання кожного завдання
        journalColumns.forEach((col) => {
            const grade = gradeMap.get(col.id);
            const isLessonDone = col.materialId ? completedLessonIds.has(col.materialId) : false;

            // Завдання вважається виконаним, якщо є відповідний статус, оцінка або пройдений урок
            const isCompleted =
                grade?.status === StudentTaskStatus.COMPLETED ||
                grade?.value != null ||
                isLessonDone;

            const deadline = col.deadline ? new Date(col.deadline) : null;
            const completedAt = grade?.updatedAt ? new Date(grade.updatedAt) : now;

            if (isCompleted) {
                totalSubmitted++;
                // Перевіряємо, чи здано роботу до настання дедлайну
                if (!deadline || completedAt <= deadline) {
                    onTimeCount++;
                }
            } else if (deadline && deadline < now) {
                // Завдання не виконане і дедлайн вже минув
                overdueCount++;
            }
        });

        // Розрахунок відсотка вчасно виконаних завдань
        const completionRate = totalAssignments > 0
            ? Math.min(100, Math.round((onTimeCount / totalAssignments) * 100))
            : 0;

        // 8. Отримання 5 останніх отриманих оцінок учня
        const recentGradesRaw = await prisma.grade.findMany({
            where: {
                studentId,
                value: { not: null },
            },
            include: {
                column: {
                    include: {
                        subject: { select: { title: true } },
                    },
                },
            },
            orderBy: { updatedAt: "desc" },
            take: 5,
        });

        const recentGrades = recentGradesRaw.map((g) => ({
            id: g.id,
            title: g.column.title,
            subjectName: g.column.subject?.title || "Предмет",
            grade12: g.value ?? 0,
            submittedAt: g.updatedAt.toISOString(),
        }));

        // 9. Оновлення та розрахунок днів активності учня (Streak)
        const streakData = await updateAndGetStreak(studentId);

        return NextResponse.json({
            completionRate,
            totalAssignments,
            onTimeCount,
            totalSubmitted,
            overdueCount,
            recentGrades,
            streak: streakData.currentStreak,
        });
    } catch (error:any) {
        // Зберігаємо помилку у базі даних
        await logError({
            message: error.message || "Помилка отримання статистики та аналітики для головного дашборду учня",
            stack: error.stack,
            source: "API /api/student/dashboard-stats [GET]",
        });
        return NextResponse.json({ error: "Внутрішня помилка сервера" }, { status: 500 });
    }
}

/**
 * Вспомогательная функция для расчета и обновления серии дней непрерывной активности (Streak).
 * @param userId - ID пользователя
 */
async function updateAndGetStreak(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let streak = await prisma.userStreak.findUnique({
        where: { userId },
    });

    // Если записи нет — создаем с начальным значением 1
    if (!streak) {
        streak = await prisma.userStreak.create({
            data: {
                userId,
                currentStreak: 1,
                lastActiveDate: today,
            },
        });
        return streak;
    }

    const lastActive = new Date(streak.lastActiveDate);
    lastActive.setHours(0, 0, 0, 0);

    // Разница в днях между текущим заходом и предыдущим
    const diffInDays = Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 3600 * 24));

    if (diffInDays === 1) {
        // Увеличение серии при ежедневном входе
        streak = await prisma.userStreak.update({
            where: { userId },
            data: {
                currentStreak: streak.currentStreak + 1,
                lastActiveDate: today,
            },
        });
    } else if (diffInDays > 1) {
        // Сброс серии, если пропущен хотя бы один день
        streak = await prisma.userStreak.update({
            where: { userId },
            data: {
                currentStreak: 1,
                lastActiveDate: today,
            },
        });
    }

    return streak;
}