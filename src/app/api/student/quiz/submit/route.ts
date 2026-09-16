import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StudentTaskStatus } from "@prisma/client";
import {logError} from "@/lib/logger";

/**
 * ==============================================================================
 * ROUTE: POST /api/student/quiz/submit
 * ==============================================================================
 * @description Обробка та автоматична перевірка відповідей онлайн-тесту.
 *              Розраховує набрані бали (score), переводить їх у 12-бальну шкалу (grade12),
 *              фіксує спробу в `QuizSubmission`, синхронізує із загальною таблицею
 *              `Submission` та автоматично виставляє оцінку зі статусом `COMPLETED`
 *              в електронний журнал (`Grade`).
 *
 * @access      Тільки авторизовані користувачі (Учні)
 *
 * @bodyParams  {string} quizId — ID матеріалу тесту або ID призначення (Assignment)
 * @bodyParams  {Object} answers — Словник відповідей у форматі `{ [questionId]: answer }`
 * @bodyParams  {number} timeSpentSeconds — Час, витрачений на проходження тесту (у секундах)
 *
 * @returns {Object} JSON з деталізованими результатами перевірки та оцінкою
 * @status  200 OK — відповіді успішно перевірені та збережені
 * @status  400 Bad Request — відсутній ID тесту або відповіді
 * @status  401 Unauthorized — користувач не авторизований
 * @status  403 Forbidden — термін виконання тесту (дедлайн) минув
 * @status  404 Not Found — тест або матеріал не знайдено
 * @status  500 Internal Server Error — помилка обробки на сервері
 * ==============================================================================
 */
export async function POST(request: Request) {
    try {
        // 1. Перевірка авторизації та сесії користувача
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ error: "Неавторизований" }, { status: 401 });
        }

        const studentId = session.user.id;
        const body = await request.json();

        const { quizId, answers, timeSpentSeconds } = body;

        if (!quizId || !answers) {
            return NextResponse.json(
                { error: "Необхідно вказати ID тесту та відповіді" },
                { status: 400 }
            );
        }

        // 2. Отримання об'єкта Material або пошук пов'язаного Assignment
        let quizMaterial = await prisma.material.findUnique({
            where: { id: quizId },
        });

        let assignment = null;

        if (!quizMaterial) {
            // Якщо передано ID від Assignment замість Material
            assignment = await prisma.assignment.findUnique({
                where: { id: quizId },
                include: { material: true },
            });
            if (assignment?.material) {
                quizMaterial = assignment.material;
            }
        } else {
            // Пошук призначення, прив'язаного до даного матеріалу та класу учня
            const student = await prisma.user.findUnique({
                where: { id: studentId },
                select: { classId: true },
            });

            assignment = await prisma.assignment.findFirst({
                where: {
                    materialId: quizMaterial.id,
                    ...(student?.classId ? { classId: student.classId } : {}),
                },
            });
        }

        if (!quizMaterial) {
            return NextResponse.json({ error: "Тест не знайдено" }, { status: 404 });
        }

        // 🔒 3. ПЕРЕВІРКА ДЕДЛАЙНУ: якщо дедлайн встановлено і він прострочений — блокуємо прийом відповідей
        if (assignment?.deadline && new Date(assignment.deadline) < new Date()) {
            return NextResponse.json(
                { error: "Термін виконання цього тесту минув. Відповіді не зараховано." },
                { status: 403 }
            );
        }

        const targetMaterialId = quizMaterial.id;

        // 4. Парсинг питань з JSON-контенту матеріалу
        let questions: any[] = [];
        try {
            const parsed = typeof quizMaterial.content === "string"
                ? JSON.parse(quizMaterial.content)
                : quizMaterial.content;

            if (parsed && Array.isArray(parsed.questions)) {
                questions = parsed.questions;
            } else if (Array.isArray(parsed)) {
                questions = parsed;
            }
        } catch (error:any) {
            // Зберігаємо помилку у базі даних
            await logError({
                message: error.message || "Ошибка парсинга JSON контента теста",
                stack: error.stack,
                source: "API /api/student/submit/quiz [POST]",
            });
        }

        let totalScore = 0;
        let maxScore = 0;

        const dbAnswersToCreate: Array<{
            questionId: string;
            selectedOpts: string;
            textAnswer: string | null;
        }> = [];

        // 5. Алгоритм автоматичної перевірки відповідей за типами питань
        if (Array.isArray(questions)) {
            questions.forEach((q) => {
                const qPoints = Number(q.points) || 1;
                maxScore += qPoints;

                const studentAnswer = answers[q.id] ?? answers[String(q.id)];

                let isCorrect = false;
                let selectedOptsArr: any[] = [];
                let textAnswerVal: string | null = null;

                // Допоміжна функція для витягування всіх правильних відповідей з об'єкта питання
                const getCorrectValues = (question: any): string[] => {
                    const correctVals: string[] = [];

                    if (question.correctAnswer) correctVals.push(String(question.correctAnswer));
                    if (Array.isArray(question.correctAnswers)) {
                        question.correctAnswers.forEach((ca: any) => correctVals.push(String(ca)));
                    }

                    if (Array.isArray(question.options)) {
                        question.options.forEach((opt: any) => {
                            if (opt.isCorrect) {
                                if (opt.id) correctVals.push(String(opt.id));
                                if (opt.text) correctVals.push(String(opt.text));
                            }
                        });
                    }

                    return correctVals;
                };

                const correctValues = getCorrectValues(q);

                // Одновибіркові питання (SINGLE)
                if (q.type === "SINGLE") {
                    if (studentAnswer !== undefined && studentAnswer !== null) {
                        selectedOptsArr = [studentAnswer];
                    }
                    if (studentAnswer && correctValues.map(v => v.trim().toLowerCase()).includes(String(studentAnswer).trim().toLowerCase())) {
                        isCorrect = true;
                    }
                }
                // Множинний вибір (MULTIPLE) — вимагає точного збігу всього набору варіантів
                else if (q.type === "MULTIPLE") {
                    const studentArr = Array.isArray(studentAnswer) ? studentAnswer.map(String) : [];
                    selectedOptsArr = studentArr;

                    const normalizedCorrect = Array.from(new Set(correctValues.map(v => v.trim().toLowerCase())));
                    const normalizedStudent = studentArr.map(s => s.trim().toLowerCase());

                    const hasAllCorrect = normalizedStudent.every(val => normalizedCorrect.includes(val));
                    const matchesCount = normalizedStudent.length > 0 && normalizedStudent.length === (q.options?.filter((o: any) => o.isCorrect)?.length || normalizedCorrect.length);

                    if (hasAllCorrect && matchesCount) {
                        isCorrect = true;
                    }
                }
                // Текстове введення (TEXT_INPUT) — регістронезалежне порівняння рядків
                else if (q.type === "TEXT_INPUT") {
                    textAnswerVal = studentAnswer ? String(studentAnswer) : null;
                    if (textAnswerVal && correctValues.some(val => val.trim().toLowerCase() === textAnswerVal!.trim().toLowerCase())) {
                        isCorrect = true;
                    }
                }

                if (isCorrect) {
                    totalScore += qPoints;
                }

                dbAnswersToCreate.push({
                    questionId: String(q.id),
                    selectedOpts: JSON.stringify(selectedOptsArr),
                    textAnswer: textAnswerVal,
                });
            });
        }

        // 6. Конвертація результату у 12-бальну систему оцінювання
        const grade12 = maxScore > 0 ? Math.round((totalScore / maxScore) * 12) : 0;

        // 7. Збереження результатів у деталізовану таблицю QuizSubmission
        const submission = await prisma.quizSubmission.create({
            data: {
                score: totalScore,
                maxScore,
                grade12,
                timeSpentSeconds: Number(timeSpentSeconds) || 0,
                quiz: {
                    connect: { id: targetMaterialId },
                },
                student: {
                    connect: { id: studentId },
                },
                answers: {
                    create: dbAnswersToCreate,
                },
            },
            include: {
                answers: true,
            },
        });

        // 8. Синхронізація зі спільною таблицею Submission для відображення стану завдання
        if (assignment) {
            const existingSubmission = await prisma.submission.findFirst({
                where: {
                    assignmentId: assignment.id,
                    studentId: studentId,
                },
            });

            if (existingSubmission) {
                await prisma.submission.update({
                    where: { id: existingSubmission.id },
                    data: {
                        score: grade12,
                        content: JSON.stringify(answers),
                        submittedAt: new Date(),
                    },
                });
            } else {
                await prisma.submission.create({
                    data: {
                        assignmentId: assignment.id,
                        studentId: studentId,
                        score: grade12,
                        content: JSON.stringify(answers),
                        submittedAt: new Date(),
                    },
                });
            }
        }

        // 9. Автоматична виставка оцінки в журнал (Grade) зі статусом COMPLETED
        const journalColumn = await prisma.journalColumn.findFirst({
            where: { materialId: quizId },
        });

        if (journalColumn) {
            await prisma.grade.upsert({
                where: {
                    columnId_studentId: {
                        columnId: journalColumn.id,
                        studentId: session.user.id,
                    },
                },
                update: {
                    value: grade12, // Зберігаємо 12-бальну оцінку
                    status: StudentTaskStatus.COMPLETED,
                },
                create: {
                    columnId: journalColumn.id,
                    studentId: session.user.id,
                    value: grade12,
                    status: StudentTaskStatus.COMPLETED,
                },
            });
        }

        return NextResponse.json({
            success: true,
            submission,
            score: totalScore,
            maxScore,
            grade12,
        });
    } catch (error:any) {
        // Зберігаємо помилку у базі даних
        await logError({
            message: error.message || "Ошибка сохранения результатов теста",
            stack: error.stack,
            source: "API /api/student/submit/quiz [POST]",
        });
        return NextResponse.json({ error: "Внутрішня помилка сервера" }, { status: 500 });
    }
}