/**
 * ==============================================================================
 * СЕРВЕРНА СТОРІНКА БІБЛІОТЕКИ УЧИТЕЛЯ (`src/app/teacher/library/page.tsx`)
 * ==============================================================================
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import TeacherLibraryClient from "@/app/teacher/library/_components/TeacherLibraryClient";

export default async function TeacherLibraryPage() {
    // 1. Отримуємо поточну сесію користувача через NextAuth
    const session = await getServerSession(authOptions);

    // Якщо користувач не авторизований — перенаправляємо на сторінку входу
    if (!session?.user?.email) {
        redirect("/login");
    }

    // 2. Отримуємо дані користувача з БД за його email
    const teacher = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: {
            id: true,
            role: true,
            teachingSubjects: { select: { id: true, title: true } },
        },
    });

    // Строга перевірка: якщо користувач не знайдений у БД або не має належної ролі — виходимо
    if (!teacher) {
        redirect("/login");
    }

    if (teacher.role !== "TEACHER" && teacher.role !== "ADMIN") {
        redirect("/");
    }

    let subjects: { id: string; title: string }[] = [];
    let classes: { id: string; name: string }[] = [];

    // 3. Формуємо списки доступних предметів та класів відповідно до ролі
    if (teacher.role === "ADMIN") {
        // Адміністратор бачить абсолютно всі предмети та класи в системі
        subjects = await prisma.subject.findMany({ select: { id: true, title: true }, orderBy: { title: "asc" } });
        classes = await prisma.class.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });
    } else {
        // Учитель бачить предмети та класи зі свого навчального навантаження
        const teacherLoads = await prisma.teacherSubjectClass.findMany({
            where: { teacherId: teacher.id },
            select: {
                subject: { select: { id: true, title: true } },
                class: { select: { id: true, name: true } },
            },
        });

        const subjectMap = new Map();
        const classMap = new Map();

        if (teacher.teachingSubjects) {
            teacher.teachingSubjects.forEach((sub) => subjectMap.set(sub.id, sub));
        }

        teacherLoads.forEach((load) => {
            if (load.subject) subjectMap.set(load.subject.id, load.subject);
            if (load.class) classMap.set(load.class.id, load.class);
        });

        subjects = Array.from(subjectMap.values()).sort((a, b) => a.title.localeCompare(b.title));
        classes = Array.from(classMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    }

    // 4. Отримуємо ID всіх доступних предметів
    const subjectIds = subjects.map((s) => s.id);

    // Завантажуємо бібліотечні матеріали
    const textbooks = subjectIds.length > 0
        ? await prisma.textbook.findMany({
            where: { subjectId: { in: subjectIds } },
            orderBy: { createdAt: "desc" },
        })
        : [];

    // 5. Передаємо готові дані у клієнтський компонент
    return (
        <TeacherLibraryClient
            subjects={subjects}
            classes={classes}
            initialTextbooks={textbooks}
        />
    );
}