import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/logger";

/**
 * ==============================================================================
 * ROUTE: GET /api/teacher/my-data
 * ==============================================================================
 * @description Отримання персональної навчальної нагрузки авторизованого вчителя:
 *              список прив'язаних класів, предметів та їх комбінацій (loads)
 *              на основі таблиці `TeacherSubjectClass`.
 *
 * @access      Тільки авторизовані вчителі (`TEACHER`) або адміністратори (`ADMIN`)
 *
 * @returns {Object} JSON об'єкт з полями:
 *          - `classes`: Array<{ id: string, name: string }> — Унікальні класи вчителя
 *          - `subjects`: Array<{ id: string, title: string }> — Унікальні предмети вчителя
 *          - `loads`: Array<{ classId: string, subjectId: string }> — Параметри навчального навантаження
 *
 * @status  200 OK — дані успішно сформовано
 * @status  403 Forbidden — відсутня авторизація або недостатньо прав
 * @status  500 Internal Server Error — помилка зчитування з бази даних
 * ==============================================================================
 */


export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== "TEACHER" && session.user.role !== "ADMIN")) {
        return NextResponse.json({ error: "Немає доступу" }, { status: 403 });
    }

    try {
        const teacherId = session.user.id;

        // 1. Отримуємо вчителя з потрібними полями ім'я
        const user = await prisma.user.findUnique({
            where: { id: teacherId },
            select: {
                id: true,
                fullName: true,
                lastName: true,
            },
        });

        // 2. Отримання навчального навантаження
        const teacherLoads = await prisma.teacherSubjectClass.findMany({
            where: { teacherId: teacherId },
            include: {
                class: { select: { id: true, name: true } },
                subject: { select: { id: true, title: true } },
            },
        });

        // 3. Агрегація класів та предметів
        const classMap = new Map<string, { id: string; name: string }>();
        const subjectMap = new Map<string, { id: string; title: string }>();

        teacherLoads.forEach((load) => {
            if (load.class) classMap.set(load.class.id, load.class);
            if (load.subject) subjectMap.set(load.subject.id, load.subject);
        });

        return NextResponse.json({
            user, // 👈 Повертаємо об'єкт з fullName
            classes: Array.from(classMap.values()),
            subjects: Array.from(subjectMap.values()),
            loads: teacherLoads.map((l) => ({
                classId: l.classId,
                subjectId: l.subjectId,
            })),
        });
    } catch (error: any) {
        await logError({
            message: error.message || "Помилка при отриманні даних вчителя",
            stack: error.stack,
            source: "API /api/teacher/my-data [GET]",
        });
        return NextResponse.json(
            { error: "Помилка при отриманні даних вчителя" },
            { status: 500 }
        );
    }
}