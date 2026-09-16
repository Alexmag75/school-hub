import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {logError} from "@/lib/logger";

/**
 * ==============================================================================
 * ROUTE: GET /api/student/materials/[id]
 * ==============================================================================
 * @description Отримання даних тесту (Quiz) для проходження або перегляду результатів учнем.
 *              Містить важливу безпекову логіку: якщо дедлайн ще НЕ настав, правильні
 *              відповіді (`isCorrect`, `correctAnswer`, `correctAnswers`) СТРОГО
 *              вирізаються з відповіді API для запобігання списуванню.
 *
 * @access      Тільки авторизовані користувачі (Учні)
 * @param       {Params} context.params.id — ID призначення (Assignment) або ID матеріалу (Material)
 *
 * @returns {Object} JSON з інформацією про тест, питаннями, статусом дедлайну та результатом учня
 * @status  200 OK — дані тесту успішно отримано
 * @status  400 Bad Request — ID не надано
 * @status  401 Unauthorized — користувач не авторизований
 * @status  404 Not Found — тест або матеріал не знайдено
 * @status  500 Internal Server Error — помилка обробки запиту
 * ==============================================================================
 */
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // 1. Перевірка авторизації та сесії користувача
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Неавторизований" }, { status: 401 });
        }

        const studentId = session.user.id;

        // Unwrap params для сумісності з Next.js 15+ (асинхронне розпакування параметрів)
        const resolvedParams = await params;
        const targetId = resolvedParams.id;

        if (!targetId) {
            return NextResponse.json({ error: "ID не вказано" }, { status: 400 });
        }

        // 2. Пошук призначення (Assignment).
        // ID може бути як безпосередньо Assignment.id, так і Material.id
        const assignment = await prisma.assignment.findFirst({
            where: {
                OR: [
                    { id: targetId },
                    { materialId: targetId }
                ]
            },
            include: {
                material: {
                    include: {
                        subject: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        // 3. Отримання об'єкта Material
        let rawMaterial = assignment?.material || null;

        // Якщо за наданим ID не було знайдено Assignment, шукаємо матеріал напряму
        if (!rawMaterial) {
            rawMaterial = await prisma.material.findUnique({
                where: { id: targetId },
                include: { subject: true },
            });
        }

        if (!rawMaterial) {
            return NextResponse.json({ error: "Матеріал не знайдено" }, { status: 404 });
        }

        const material = rawMaterial;

        // 4. Отримання результатів вже сданного тесту з QuizSubmission
        const quizSubmission = await prisma.quizSubmission.findFirst({
            where: {
                quizId: material.id,
                studentId: studentId,
            },
            orderBy: { submittedAt: "desc" },
        });

        // 5. Отримання збережених відповідей з загальної таблиці Submission (за наявності)
        let rawAnswersContent: any = null;
        if (assignment) {
            const generalSubmission = await prisma.submission.findFirst({
                where: {
                    assignmentId: assignment.id,
                    studentId: studentId,
                },
            });
            if (generalSubmission?.content) {
                try {
                    rawAnswersContent = typeof generalSubmission.content === "string"
                        ? JSON.parse(generalSubmission.content)
                        : generalSubmission.content;
                } catch (e) {
                    console.error("Помилка парсингу відповідей з Submission:", e);
                }
            }
        }

        // 6. Строга перевірка проходження дедлайну по часовій мітці
        const deadline = assignment?.deadline || null;
        const isPastDeadline = deadline ? new Date() > new Date(deadline) : false;

        // 7. Парсинг контенту матеріалу (питання та варіанти відповідей)
        let parsedContent: any = {};
        try {
            parsedContent = typeof material.content === "string"
                ? JSON.parse(material.content)
                : material.content;
        } catch (e) {
            console.error("Помилка парсингу контенту:", e);
        }

        let questions = parsedContent?.questions || (Array.isArray(parsedContent) ? parsedContent : []);

        // 🔒 8. КЛЮЧОВА БЕЗПЕКА: Якщо дедлайн ще НЕ пройшов — повністю видаляємо підказки та правильні відповіді
        // Правильні відповіді стануть доступні клієнту тільки після настання дедлайну
        if (!isPastDeadline) {
            questions = questions.map((q: any) => ({
                ...q,
                correctAnswer: undefined,
                correctAnswers: undefined,
                options: Array.isArray(q.options)
                    ? q.options.map((opt: any) => {
                        if (typeof opt === "object" && opt !== null) {
                            const { isCorrect, ...rest } = opt;
                            return rest;
                        }
                        return opt;
                    })
                    : q.options,
            }));
        }

        // 9. Формування та повернення підготовлених даних тесту
        return NextResponse.json({
            id: material.id,
            title: material.title,
            subjectName: material.subject?.title || "Предмет",
            questions,
            isPastDeadline, // Прапорець перевірки дедлайну
            userResult: quizSubmission
                ? {
                    score: quizSubmission.score,
                    maxScore: quizSubmission.maxScore,
                    grade12: quizSubmission.grade12,
                    answers: rawAnswersContent || {},
                }
                : null,
        });
    } catch (error:any) {
        // Зберігаємо помилку у базі даних
        await logError({
            message: error.message || "Помилка завантаження тесту",
            stack: error.stack,
            source: "API /api/student/materials/[id] [GET]",
        });
        console.error("Помилка завантаження тесту:", error);
        return NextResponse.json({ error: "Внутрішня помилка сервера" }, { status: 500 });
    }
}