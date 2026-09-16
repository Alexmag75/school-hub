/**
 * ==============================================================================
 * ГОЛОВНА СТОРІНКА ДАШБОРДУ СТУДЕНТА (`src/app/student/dashboard/page.tsx`)
 * ==============================================================================
 * @description Серверний компонент для завантаження профілю учня, його класу
 *              та списку доступних підручників.
 *
 * @tech_stack Next.js App Router (RSC), Prisma ORM, NextAuth.js.
 * ==============================================================================
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import StudentDashboardClient from "@/components/student/StudentDashboardClient";

export default async function StudentDashboardPage() {
    // 1. Перевірка авторизації
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        redirect("/login");
    }

    // 2. Отримання користувача
    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: {
            fullName: true,
            classId: true,
        },
    });

    if (!user) {
        redirect("/login");
    }

    // 3. Отримання назви класу за classId
    let className = "не призначено";
    if (user.classId) {
        const studentClass = await prisma.class.findUnique({
            where: { id: user.classId },
            select: { name: true },
        });
        if (studentClass?.name) {
            className = studentClass.name;
        }
    }

    // 4. Отримання підручників для класу або загальних
    const textbooks = await prisma.textbook.findMany({
        where: {
            OR: [
                { classId: user.classId },
                { classId: null },
            ],
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    // 5. Отримання назв предметів за subjectId
    const subjectIds = Array.from(new Set(textbooks.map((b) => b.subjectId)));
    const subjects = await prisma.subject.findMany({
        where: { id: { in: subjectIds } },
        select: { id: true, title: true },
    });

    const subjectMap = new Map(subjects.map((s) => [s.id, s.title]));

    // 6. Форматування даних для клієнтського компонента
    const formattedBooks = textbooks.map((book) => ({
        id: book.id,
        title: book.title,
        subject: subjectMap.get(book.subjectId) || "Загальний матеріал",
        fileUrl: book.fileUrl,
    }));

    const studentProfile = {
        name: user.fullName,
        className,
    };

    return (
        <StudentDashboardClient
            studentProfile={studentProfile}
            books={formattedBooks}
        />
    );
}