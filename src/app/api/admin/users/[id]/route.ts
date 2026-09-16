import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { logError } from "@/lib/logger";

/**
 * ==============================================================================
 * ROUTE: GET /api/admin/users/[id]
 * ==============================================================================
 * @description Отримання детальної інформації про користувача за його ID.
 *              Автоматично агрегує та форматує предметно-класову нагрузку для вчителів.
 * @access      Тільки АДМІНІСТРАТОР (ADMIN)
 * ==============================================================================
 */
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Немає доступу" }, { status: 403 });
    }

    try {
        const { id } = await params;
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                fullName: true,
                lastName: true,
                email: true,
                role: true,
                className: { select: { id: true, name: true } },
                studentSubgroups: {
                    select: {
                        id: true,
                        name: true,
                        subjectId: true,
                        subject: { select: { id: true, title: true } },
                    },
                },
                teachingSubjects: { select: { id: true, title: true } },
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

        if (!user) {
            return NextResponse.json({ error: "Користувача не знайдено" }, { status: 404 });
        }

        const teacherLoads = user.teacherLoads || [];

        const teacherAssignments = teacherLoads.map((tl: any) => ({
            id: tl.id,
            subjectId: tl.subjectId,
            classId: tl.classId,
            subgroupId: tl.subgroupId ?? null,
            subject: tl.subject,
            class: tl.class,
            subgroup: tl.subgroup ?? null,
        }));

        const classMap = new Map<string, { id: string; name: string }>();
        const subjectMap = new Map<string, { id: string; title: string }>();

        teacherLoads.forEach((tl: any) => {
            if (tl.class) classMap.set(tl.class.id, tl.class);
            if (tl.subject) subjectMap.set(tl.subject.id, tl.subject);
        });

        (user.teachingSubjects || []).forEach((s: { id: string; title: string }) => subjectMap.set(s.id, s));

        const teacherClasses = Array.from(classMap.values());
        const teacherSubjects = Array.from(subjectMap.values());
        const teacherClassIds = Array.from(classMap.keys());

        return NextResponse.json({
            ...user,
            subjects: teacherSubjects,
            teachingSubjects: teacherSubjects,
            classes: teacherClasses,
            teacherClasses,
            teacherClassIds,
            teacherAssignments,
        });
    } catch (error: any) {
        await logError({
            message: error.message || "Помилка завантаження користувача",
            stack: error.stack,
            source: "API /api/admin/users/[id] [GET]",
        });
        return NextResponse.json({ error: "Помилка завантаження користувача" }, { status: 500 });
    }
}

/**
 * ==============================================================================
 * ROUTE: PATCH /api/admin/users/[id]
 * ==============================================================================
 * @description Комплексне оновлення профілю користувача, його ролі та педагогічного
 *              навантаження (TeacherSubjectClass) у межах єдиної транзакції БД.
 * @access      Тільки АДМІНІСТРАТОР (ADMIN)
 * ==============================================================================
 */
export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Немає доступу" }, { status: 403 });
    }

    try {
        const { id } = await params;
        const body = await req.json();
        const {
            fullName,
            email,
            role,
            newPassword,
            targetClassName,
            subgroupIds,
            subjectIds,
            teacherAssignments,
        } = body;

        const updateData: Record<string, any> = {};

        if (fullName !== undefined) {
            updateData.fullName = fullName;
            updateData.lastName = fullName;
        }
        if (email !== undefined) updateData.email = email;
        if (role !== undefined) updateData.role = role;
        if (newPassword) {
            updateData.password = await bcrypt.hash(newPassword, 10);
        }

        const updatedUser = await prisma.$transaction(async (tx: any) => {
            // --- СКИДАННЯ / ОНОВЛЕННЯ ДЛЯ УЧНЯ ---
            if (role === "STUDENT") {
                if (targetClassName) {
                    const foundClass = await tx.class.findFirst({
                        where: { name: targetClassName },
                    });
                    if (foundClass) {
                        updateData.className = { connect: { id: foundClass.id } };
                    } else {
                        updateData.className = { disconnect: true };
                    }
                } else {
                    updateData.className = { disconnect: true };
                }

                if (Array.isArray(subgroupIds)) {
                    updateData.studentSubgroups = {
                        set: subgroupIds.map((subId: string) => ({ id: subId })),
                    };
                }

                updateData.teachingSubjects = { set: [] };
                await tx.teacherSubjectClass.deleteMany({ where: { teacherId: id } });
            }

            // --- СКИДАННЯ ДЛЯ АДМІНІСТРАТОРА ---
            if (role === "ADMIN") {
                updateData.className = { disconnect: true };
                updateData.studentSubgroups = { set: [] };
                updateData.teachingSubjects = { set: [] };
                await tx.teacherSubjectClass.deleteMany({ where: { teacherId: id } });
            }

            // --- ОБРОБКА НАВАНТАЖЕННЯ ВИКЛАДАЧА ---
            if (role === "TEACHER") {
                updateData.className = { disconnect: true };
                updateData.studentSubgroups = { set: [] };

                let finalSubjectIds: string[] = [];
                if (Array.isArray(teacherAssignments) && teacherAssignments.length > 0) {
                    finalSubjectIds = Array.from(
                        new Set(
                            teacherAssignments
                                .map((a: { subjectId: string }) => a.subjectId)
                                .filter(Boolean)
                        )
                    );
                } else if (Array.isArray(subjectIds)) {
                    finalSubjectIds = subjectIds;
                }

                updateData.teachingSubjects = {
                    set: finalSubjectIds.map((sId: string) => ({ id: sId })),
                };

                await tx.teacherSubjectClass.deleteMany({
                    where: { teacherId: id },
                });

                const newLoads: { teacherId: string; subjectId: string; classId: string; subgroupId?: string | null }[] = [];
                if (Array.isArray(teacherAssignments) && teacherAssignments.length > 0) {
                    teacherAssignments.forEach((a: { subjectId: string; classId: string; subgroupId?: string | null }) => {
                        if (a.subjectId && a.classId) {
                            newLoads.push({
                                teacherId: id,
                                subjectId: a.subjectId,
                                classId: a.classId,
                                subgroupId: a.subgroupId || null,
                            });
                        }
                    });
                }

                if (newLoads.length > 0) {
                    await tx.teacherSubjectClass.createMany({
                        data: newLoads,
                        skipDuplicates: true,
                    });
                }
            }

            return await tx.user.update({
                where: { id },
                data: updateData,
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    role: true,
                    className: { select: { id: true, name: true } },
                    studentSubgroups: { select: { id: true, name: true, subjectId: true } },
                    teachingSubjects: { select: { id: true, title: true } },
                    teacherLoads: {
                        select: {
                            id: true,
                            subjectId: true,
                            classId: true,
                            subgroupId: true,
                            // 💡 ВИПРАВЛЕНО: Додано вибірку об'єктів предмету, класу та підгрупи
                            subject: { select: { id: true, title: true } },
                            class: { select: { id: true, name: true } },
                            subgroup: { select: { id: true, name: true } },
                        },
                    },
                },
            });
        });

        // Агрегуємо teacherAssignments перед відправкою у відповідь
        const teacherLoads = updatedUser.teacherLoads || [];
        const formattedTeacherAssignments = teacherLoads.map((tl: any) => ({
            id: tl.id,
            subjectId: tl.subjectId,
            classId: tl.classId,
            subgroupId: tl.subgroupId ?? null,
            subject: tl.subject,
            class: tl.class,
            subgroup: tl.subgroup ?? null,
        }));

        return NextResponse.json({
            ...updatedUser,
            teacherAssignments: formattedTeacherAssignments,
        });
    } catch (error: any) {
        await logError({
            message: error.message || "Помилка оновлення користувача",
            stack: error.stack,
            source: "API /api/admin/users/[id] [PATCH]",
        });

        if (error.code === "P2002") {
            return NextResponse.json(
                { error: "Користувач з таким Email вже існує" },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: "Помилка оновлення користувача" },
            { status: 500 }
        );
    }
}

/**
 * ==============================================================================
 * ROUTE: DELETE /api/admin/users/[id]
 * ==============================================================================
 * @description Безповоротне видалення користувача з системи
 * @access      Тільки АДМІНІСТРАТОР (ADMIN)
 * ==============================================================================
 */
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user?.role !== "ADMIN") {
            return NextResponse.json({ error: "Немає доступу" }, { status: 403 });
        }

        const resolvedParams = await params;
        const userId = resolvedParams.id;

        if (!userId) {
            return NextResponse.json({ error: "ID не вказано" }, { status: 400 });
        }

        await prisma.user.delete({
            where: { id: userId },
        });

        return NextResponse.json({ message: "Користувача видалено" });
    } catch (error: any) {
        await logError({
            message: error.message || "Не вдалося видалити користувача з бази даних",
            stack: error.stack,
            source: "API /api/admin/users/[id] [Delete]",
        });
        return NextResponse.json(
            { error: "Не вдалося видалити користувача з бази даних" },
            { status: 500 }
        );
    }
}