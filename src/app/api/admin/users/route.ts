import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { logError } from "@/lib/logger";

/**
 * ==============================================================================
 * ROUTE: GET & POST /api/admin/users
 * ==============================================================================
 * @description Управління користувачами платформи: отримати список всіх користувачів
 *              або створити нового користувача (учня, вчителя, адміна).
 * @access      Тільки АДМІНІСТРАТОР (ADMIN)
 * ==============================================================================
 */

/**
 * GET /api/admin/users
 * @description Отримання повного списку користувачів із прив'язаними підгрупами та класами
 */
export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Немає доступу" }, { status: 403 });
    }

    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                fullName: true,
                lastName: true,
                role: true,
                createdAt: true,
                className: {
                    select: {
                        id: true,
                        name: true,
                        year: true,
                    },
                },
                teachingSubjects: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
                teacherLoads: {
                    select: {
                        id: true,
                        subjectId: true,
                        classId: true,
                        subgroupId: true,
                        subject: {
                            select: { id: true, title: true },
                        },
                        class: {
                            select: { id: true, name: true },
                        },
                        subgroup: {
                            select: { id: true, name: true },
                        },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        const formattedUsers = users.map((user) => {
            if (user.role === "TEACHER") {
                const classMap = new Map<string, { id: string; name: string }>();
                const subjectMap = new Map<string, { id: string; title: string }>();

                user.teacherLoads.forEach((load) => {
                    if (load.class) classMap.set(load.class.id, load.class);
                    if (load.subject) subjectMap.set(load.subject.id, load.subject);
                });

                (user.teachingSubjects || []).forEach((s) => subjectMap.set(s.id, s));

                const uniqueClasses = Array.from(classMap.values());
                const uniqueSubjects = Array.from(subjectMap.values());

                const teacherAssignments = user.teacherLoads.map((load) => ({
                    id: load.id,
                    classId: load.class?.id,
                    subjectId: load.subject?.id,
                    subgroupId: load.subgroupId || null,
                    class: load.class,
                    subject: load.subject,
                    subgroup: load.subgroup || null,
                }));

                return {
                    ...user,
                    subjects: uniqueSubjects,
                    teachingSubjects: uniqueSubjects,
                    classes: uniqueClasses,
                    teacherClasses: uniqueClasses,
                    teacherAssignments,
                };
            }

            // Для учня повертаємо масив з його класом у полі `classes`, щоб helper у таблиці його бачив
            const studentClasses = user.className ? [user.className] : [];

            return {
                ...user,
                subjects: [],
                teachingSubjects: [],
                classes: studentClasses,
                teacherClasses: [],
                teacherAssignments: [],
            };
        });

        return NextResponse.json(formattedUsers);
    } catch (error: any) {
        await logError({
            message: error.message || "Помилка при отриманні списку користувачів",
            stack: error.stack,
            source: "API /api/admin/users [GET]",
        });
        return NextResponse.json(
            { error: "Помилка при отриманні списку користувачів" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/users
 * @description Створення нового користувача вручну через адмін-панель
 */
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Немає доступу" }, { status: 403 });
    }

    try {
        const {
            email,
            password,
            fullName,
            lastName,
            role,
            className,
            subjectIds,
            classIds,
            teacherAssignments,
        } = await req.json();

        const userFullName = fullName || lastName;

        if (!password || !userFullName || !role) {
            return NextResponse.json({ error: "Заповніть усі обов'язкові поля" }, { status: 400 });
        }

        let userEmail = email?.trim();
        if (!userEmail) {
            const prefix = (role as string).toLowerCase();
            let isUnique = false;

            while (!isUnique) {
                const randomNum = Math.floor(1000 + Math.random() * 9000);
                const candidateEmail = `${prefix}_${randomNum}@school.local`;

                const existing = await prisma.user.findUnique({ where: { email: candidateEmail } });
                if (!existing) {
                    userEmail = candidateEmail;
                    isUnique = true;
                }
            }
        } else {
            const existingUser = await prisma.user.findUnique({ where: { email: userEmail } });
            if (existingUser) {
                return NextResponse.json({ error: "Користувач з таким email вже існує" }, { status: 400 });
            }
        }

        let targetClassId: string | null = null;
        if (role === "STUDENT" && className && typeof className === "string" && className.trim()) {
            const currentYear = new Date().getFullYear();
            const trimmedClassName = className.trim();

            let targetClass = await prisma.class.findFirst({
                where: { name: trimmedClassName, year: currentYear },
            });

            if (!targetClass) {
                targetClass = await prisma.class.create({
                    data: {
                        name: trimmedClassName,
                        year: currentYear,
                    },
                });
            }

            targetClassId = targetClass.id;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        let allSubjectIds: string[] = [];
        if (role === "TEACHER") {
            if (Array.isArray(teacherAssignments) && teacherAssignments.length > 0) {
                allSubjectIds = Array.from(
                    new Set(teacherAssignments.map((a: { subjectId: string }) => a.subjectId))
                );
            } else if (Array.isArray(subjectIds)) {
                allSubjectIds = subjectIds;
            }
        }

        const newUser = await prisma.user.create({
            data: {
                email: userEmail,
                password: hashedPassword,
                fullName: userFullName,
                lastName: lastName || userFullName,
                role: role as Role,
                classId: targetClassId,
                teachingSubjects:
                    allSubjectIds.length > 0
                        ? { connect: allSubjectIds.map((sId) => ({ id: sId })) }
                        : undefined,
            },
        });

        if (role === "TEACHER") {
            const loadData: { teacherId: string; subjectId: string; classId: string; subgroupId?: string | null }[] = [];

            if (Array.isArray(teacherAssignments) && teacherAssignments.length > 0) {
                teacherAssignments.forEach((a: { classId: string; subjectId: string; subgroupId?: string | null }) => {
                    if (a.classId && a.subjectId) {
                        loadData.push({
                            teacherId: newUser.id,
                            classId: a.classId,
                            subjectId: a.subjectId,
                            subgroupId: a.subgroupId || null,
                        });
                    }
                });
            } else if (Array.isArray(subjectIds) && Array.isArray(classIds)) {
                for (const subjectId of subjectIds) {
                    for (const classId of classIds) {
                        loadData.push({
                            teacherId: newUser.id,
                            subjectId,
                            classId,
                            subgroupId: null,
                        });
                    }
                }
            }

            if (loadData.length > 0) {
                await prisma.teacherSubjectClass.createMany({
                    data: loadData,
                    skipDuplicates: true,
                });
            }
        }

        // Повертаємо створеного користувача у тому ж форматованому вигляді, що й GET
        const createdUserFull = await prisma.user.findUnique({
            where: { id: newUser.id },
            select: {
                id: true,
                email: true,
                fullName: true,
                lastName: true,
                role: true,
                createdAt: true,
                className: {
                    select: { id: true, name: true, year: true },
                },
                teachingSubjects: {
                    select: { id: true, title: true },
                },
                teacherLoads: {
                    select: {
                        id: true,
                        subjectId: true,
                        classId: true,
                        subgroupId: true,
                        subject: { select: { id: true, title: true } },
                        class: { select: { id: true, name: true } },
                        subgroup: { select: { id: true, name: true } },
                    },
                },
            },
        });

        return NextResponse.json(createdUserFull, { status: 201 });
    } catch (error: any) {
        await logError({
            message: error.message || "Помилка при створенні користувача",
            stack: error.stack,
            source: "API /api/admin/users [POST]",
        });
        return NextResponse.json({ error: "Помилка при створенні користувача" }, { status: 500 });
    }
}