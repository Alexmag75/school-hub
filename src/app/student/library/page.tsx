/**
 * ==============================================================================
 * СТОРІНКА ШКІЛЬНОЇ БІБЛІОТЕКИ УЧНЯ (`src/app/student/library/page.tsx`)
 * ==============================================================================
 * @description Серверний компонент (Server Component), який виконує:
 *              1. Перевірку автентифікації користувача через NextAuth.js.
 *              2. Отримання ідентифікатора класу (`classId`), до якого прикріплений учень.
 *              3. Завантаження з БД підручників, доступних для конкретного класу або загальних (для всіх).
 *              4. Отримання та зіставлення пов'язаних предметів (`Subject`).
 *              5. Форматування даних та передачу їх у клієнтський компонент відображення.
 *
 * @tech_stack Next.js App Router (Server Components), NextAuth.js, Prisma ORM.
 * ==============================================================================
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import StudentLibraryClient from "./StudentLibraryClient";

export default async function StudentLibraryPage() {
    // --------------------------------------------------------------------------
    // 1. АВТОРИЗАЦІЯ ТА ПЕРЕВІРКА СЕСІЇ КОРИСТУВАЧА
    // --------------------------------------------------------------------------
    const session = await getServerSession(authOptions);

    // Якщо сесія відсутня або не містить пошти — перенаправляємо на сторінку входу
    if (!session?.user?.email) {
        redirect("/login");
    }

    // --------------------------------------------------------------------------
    // 2. ОТРИМАННЯ ДАНИХ ПРО УЧНЯ
    // --------------------------------------------------------------------------
    // Знаходимо користувача за email для отримання його classId
    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { classId: true },
    });

    // Якщо користувача не знайдено у БД
    if (!user) {
        redirect("/login");
    }

    // --------------------------------------------------------------------------
    // 3. ЗАВАНТАЖЕННЯ ПІДРУЧНИКІВ З БАЗИ ДАНИХ
    // --------------------------------------------------------------------------
    // Завантажуємо матеріали, які призначені або для класу даного учня,
    // або є загальнодоступними (classId === null)
    const textbooks = await prisma.textbook.findMany({
        where: {
            OR: [
                { classId: user.classId },
                { classId: null },
            ],
        },
        orderBy: {
            createdAt: "desc", // Сортування за датою додавання (новіші зверху)
        },
    });

    // --------------------------------------------------------------------------
    // 4. ПІДТЯГУВАННЯ НАЗВ ПРЕДМЕТІВ ДЛЯ КНИГ
    // --------------------------------------------------------------------------
    // Збираємо унікальні ID предметів з усіх знайдених книг
    const subjectIds = Array.from(new Set(textbooks.map((b) => b.subjectId)));

    // Отримуємо назви лише тих предметів, які фігурують у списку книг
    const subjects = await prisma.subject.findMany({
        where: { id: { in: subjectIds } },
        select: { id: true, title: true },
    });

    // Створюємо Map (id -> title) для швидкого пошуку назви предмета O(1)
    const subjectMap = new Map(subjects.map((s) => [s.id, s.title]));

    // --------------------------------------------------------------------------
    // 5. ФОРМУВАННЯ ПІДГОТОВЛЕНОГО СПИСКУ КНИГ ДЛЯ КЛІЄНТА
    // --------------------------------------------------------------------------
    const formattedBooks = textbooks.map((book) => ({
        id: book.id,
        title: book.title,
        author: book.author,
        category: book.category,
        fileUrl: book.fileUrl,
        description: book.description,
        subjectId: book.subjectId,
        subjectName: subjectMap.get(book.subjectId) || "Загальний матеріал",
    }));

    // Рендеримо клієнтську частину з передачею розрахованих даних
    return (
        <StudentLibraryClient
            books={formattedBooks}
            subjects={subjects}
        />
    );
}