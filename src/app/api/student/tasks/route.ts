import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {logError} from "@/lib/logger";

// ⚠️ Директиви Next.js App Router для відключення кэшування
// Гарантують отримання найактуальніших даних з БД при кожному зверненні
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * ==============================================================================
 * ROUTE: GET /api/student/tasks
 * ==============================================================================
 * @description Отримання списку завдань учня з можливістю фільтрації за вкладками
 *              (`pending` — очікують виконання, `completed` — виконані, `expired` — протерміновані)
 *              та за предметом (`subjectId`). Автоматично мапить внутрішні типи матеріалів
 *              у спрощені типи для фронтенду (`LESSON`, `CONTROL_WORK`, `QUIZ`).
 *
 * @access      Тільки авторизовані користувачі (Учні)
 *
 * @queryParams {string} [tab="pending"] — Категорія завдань ("pending" | "completed" | "expired")
 * @queryParams {string} [subjectId]     — ID предмета для фільтрації
 *
 * @returns {Array<Object>} JSON-масив з деталізованими завданнями та їхніми статусами
 * @status  200 OK — список завдань успішно сформовано
 * @status  401 Unauthorized — користувач не авторизований
 * @status  500 Internal Server Error — помилка обробки запиту
 * ==============================================================================
 */
export async function GET(request: Request) {
    try {
        // 1. Перевірка авторизації та сесії користувача
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: "Неавторизований" }, { status: 401 });
        }

        const studentId = session.user.id;

        // 2. Отримання classId учня
        const student = await prisma.user.findUnique({
            where: { id: studentId },
            select: { classId: true },
        });

        // Якщо учень не прикріплений до класу — повертаємо порожній масив завдань
        if (!student?.classId) {
            return NextResponse.json([]);
        }

        // Парсинг параметрів URL-запиту
        const { searchParams } = new URL(request.url);
        const tab = searchParams.get("tab") || "pending";
        const subjectId = searchParams.get("subjectId");

        // 3. Запит усіх призначень (Assignment) для класу учня
        const assignments = await prisma.assignment.findMany({
            where: {
                classId: student.classId,
                ...(subjectId
                    ? {
                        material: {
                            subjectId: subjectId,
                        },
                    }
                    : {}),
            },
            include: {
                material: {
                    include: {
                        subject: { select: { id: true, title: true } },
                        author: { select: { fullName: true, lastName: true } },
                        // Перевірка перегляду уроку конкретним учнем
                        lessonProgresses: {
                            where: { userId: studentId },
                        },
                        // Отримання найбільш свіжої спроби складання тесту
                        quizSubmissions: {
                            where: { studentId: studentId },
                            orderBy: { submittedAt: "desc" },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        const now = new Date();

        // 4. Форматування даних та обчислення поточного статусу кожного завдання
        const tasks = assignments.map((assignment) => {
            const material = assignment.material;
            const progress = material.lessonProgresses[0];
            const submission = material.quizSubmissions[0];

            let status: "PENDING" | "COMPLETED" | "EXPIRED" = "PENDING";
            let score: number | null = null;
            let maxScore: number | null = null;
            let grade12: number | null = null;

            // Визначення факту виконання (вивчено урок АБО є зданий тест)
            const isCompleted = progress?.isDone || Boolean(submission);

            if (isCompleted) {
                status = "COMPLETED";
                if (submission) {
                    score = submission.score;
                    maxScore = submission.maxScore;
                    grade12 = submission.grade12;
                }
            } else if (assignment.deadline && new Date(assignment.deadline) < now) {
                status = "EXPIRED";
            }

            // 🚀 МАПІНГ ТИПУ МАТЕРІАЛУ ДЛЯ ФРОНТЕНДУ
            const rawType = String(material.type);
            let mappedType: "LESSON" | "CONTROL_WORK" | "QUIZ" = "QUIZ";

            if (rawType === "THEORY" || rawType === "PRACTICE" || rawType === "LECTURE" || rawType === "LESSON") {
                mappedType = "LESSON";
            } else if (rawType === "CONTROL_WORK" || rawType === "ATTESTATION") {
                mappedType = "CONTROL_WORK";
            } else {
                mappedType = "QUIZ";
            }

            return {
                id: assignment.id,
                assignmentId: assignment.id,
                materialId: assignment.materialId,
                title: material.title,
                type: mappedType, // Скоригований тип для UI ("LESSON", "CONTROL_WORK", "QUIZ")
                rawType: material.type, // Оригінальний тип із бази даних
                subjectName: material.subject?.title || "Без предмета",
                deadline: assignment.deadline ? assignment.deadline.toISOString() : null,
                timeLimitMinutes: assignment.timeLimitMinutes,
                status,
                score,
                maxScore,
                grade12,
            };
        });

        // 5. Фільтрація завдань відповідно до обраної вкладки (tab)
        const filteredTasks = tasks.filter((task) => {
            if (tab === "pending") return task.status === "PENDING";
            if (tab === "completed") return task.status === "COMPLETED";
            if (tab === "expired") return task.status === "EXPIRED";
            return true;
        });

        // Повернення відповіді із суворими заголовками відключення кэшу
        return NextResponse.json(filteredTasks, {
            headers: {
                "Cache-Control": "no-store, max-age=0",
            },
        });
    } catch (error:any) {
        // Зберігаємо помилку у базі даних
        await logError({
            message: error.message || "Помилка отримання списку завдань учня",
            stack: error.stack,
            source: "API /api/student/tasks [GET]",
        });
        return NextResponse.json({ error: "Внутрішня помилка сервера" }, { status: 500 });
    }
}