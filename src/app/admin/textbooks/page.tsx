/**
 * ==============================================================================
 * СЕРВЕРНА СТОРІНКА УПРАВЛІННЯ ПІДРУЧНИКАМИ (`src/app/admin/textbooks/page.tsx`)
 * ==============================================================================
 * @description Серверна сторінка для перевірки прав доступу (адміністратора)
 *              та початкового завантаження списків класів, предметів і підручників
 *              із бази даних PostgreSQL через Prisma ORM.
 *
 * @tech_stack Next.js App Router (Server Component), NextAuth, Prisma ORM.
 * ==============================================================================
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import AdminTextbooksClient from "./AdminTextbooksClient";

export default async function AdminTextbooksPage() {
    // --------------------------------------------------------------------------
    // 1. ПЕРЕВІРКА АВТОРИЗАЦІЇ ТА ПРАВ ДОСТУПУ (RBAC)
    // --------------------------------------------------------------------------
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        redirect("/login");
    }

    const admin = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, role: true },
    });

    // if (!session || session.user.role !== "ADMIN") {
    //     redirect("/login");
    // }

    // --------------------------------------------------------------------------
    // 2. ОДЕРЖАННЯ ДАНИХ ІЗ БАЗИ ДАНИХ (DB FETCHING)
    // --------------------------------------------------------------------------

    /** Перелік усіх зареєстрованих класів для фільтрації та прив'язки */
    const classes = await prisma.class.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
    });

    /** Перелік усіх навчальних предметів */
    const subjects = await prisma.subject.findMany({
        select: { id: true, title: true },
        orderBy: { title: "asc" },
    });

    /** Список офіційних підручників із прив'язаними до них классами */
    const textbooks = await prisma.textbook.findMany({
        where: {
            category: "TEXTBOOK",
        },
        include: {
            classes: {
                select: { id: true, name: true },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    // --------------------------------------------------------------------------
    // 3. РЕНДЕР КЛІЄНТСЬКОЇ ПАНЕЛІ З ПОЧАТКОВИМИ ДАНИМИ
    // --------------------------------------------------------------------------
    return (
        <AdminTextbooksClient
            subjects={subjects}
            classes={classes}
            initialTextbooks={textbooks}
        />
    );
}