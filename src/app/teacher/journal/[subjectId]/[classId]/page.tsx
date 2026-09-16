/**
 * ==============================================================================
 * СТОРІНКА ЭЛЕКТРОННОГО ЖУРНАЛУ ВЧИТЕЛЯ (`page.tsx`)
 * ==============================================================================
 * @description Серверний компонент (RSC) для сторінки авто-моніторингу журналу.
 *              - Авторизує вчителя.
 *              - Паралельно завантажує предмет, клас, список учнів та колонки журналу.
 *              - Отримує виставлені оцінки та статус опрацювання уроків (`LessonProgress`).
 *              - Формує початковий масив `initialGrades` для передачі в клієнтський компонент.
 *
 * @tech_stack Next.js App Router (RSC), Prisma ORM, NextAuth.js.
 * ==============================================================================
 */

import { prisma } from "@/lib/prisma";
import JournalClient from "./JournalClient";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface PageProps {
    params: Promise<{
        subjectId: string;
        classId: string;
    }>;
}

export default async function JournalPage({ params }: PageProps) {
    // Next.js 15+: params є Promise, тому використовуємо await
    const { subjectId, classId } = await params;

    // 1. Перевіряємо сесію користувача
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        redirect("/login");
    }

    // 2. Паралельно завантажуємо базові дані: предмет, клас, учнів та колонки журналу
    const [subject, classItem, students, columns] = await Promise.all([
        prisma.subject.findUnique({ where: { id: subjectId } }),
        prisma.class.findUnique({ where: { id: classId } }),
        prisma.user.findMany({
            where: { classId, role: "STUDENT" },
            select: { id: true, fullName: true },
            orderBy: { fullName: "asc" },
        }),
        prisma.journalColumn.findMany({
            where: { subjectId, classId },
            orderBy: { createdAt: "asc" },
        }),
    ]);

    // Якщо предмет або клас не знайдено — повертаємо 404
    if (!subject || !classItem) {
        notFound();
    }

    const columnIds = columns.map((c) => c.id);
    const studentIds = students.map((s) => s.id);
    const materialIds = columns
        .map((c) => c.materialId)
        .filter((id): id is string => Boolean(id));

    // 3. Паралельно завантажуємо виставлені оцінки та логи проходження уроків
    const [rawGrades, lessonProgresses] = await Promise.all([
        prisma.grade.findMany({
            where: {
                columnId: { in: columnIds },
                studentId: { in: studentIds },
            },
        }),
        prisma.lessonProgress.findMany({
            where: {
                userId: { in: studentIds },
                lessonId: { in: materialIds },
                isDone: true,
            },
        }),
    ]);

    // 4. Формуємо єдиний масив початкових оцінок (initialGrades) з урахуванням проходження уроків
    const initialGrades = columns.flatMap((col) => {
        return students.map((student) => {
            const grade = rawGrades.find(
                (g) => g.columnId === col.id && g.studentId === student.id
            );

            // Перевіряємо факт опрацювання матеріалу в LessonProgress
            const isRead = col.materialId
                ? lessonProgresses.some(
                    (lp) => lp.userId === student.id && lp.lessonId === col.materialId
                )
                : false;

            const isCompleted = grade?.status === "COMPLETED" || isRead;

            return {
                id: grade?.id || `temp-${student.id}-${col.id}`,
                value: grade?.value ?? null,
                studentId: student.id,
                columnId: col.id,
                status: isCompleted ? ("COMPLETED" as const) : grade?.status || ("PENDING" as const),
            };
        });
    });

    return (
        <JournalClient
            subject={subject}
            classItem={classItem}
            students={students}
            initialColumns={columns}
            initialGrades={initialGrades}
            teacherId={session.user.id}
        />
    );
}