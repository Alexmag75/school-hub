/**
 * ==============================================================================
 * API ROUTE: Статистика конкретного вчителя (`/api/admin/teachers/[id]/activity`)
 * ==============================================================================
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {logError} from "@/lib/logger";

export async function GET(
    request: Request,
    props: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        // Розпаковка params для сумісності з Next.js 14 та Next.js 15
        const resolvedParams = await props.params;
        const teacherId = resolvedParams.id;

        const teacherData = await prisma.user.findUnique({
            where: { id: teacherId },
            select: {
                _count: {
                    select: {
                        materials: true,          // Створені матеріали / уроки
                        teacherAssignments: true, // Завдання та тести
                        createdTextbooks: true,   // Підручники
                        teacherGrades: true,      // Виставлені оцінки
                    },
                },
            },
        });

        if (!teacherData) {
            return NextResponse.json(
                { error: "Вчителя не знайдено" },
                { status: 404 }
            );
        }

        const lessonsCount = teacherData._count.materials || 0;
        const testsCount = teacherData._count.teacherAssignments || 0;
        const controlWorksCount = teacherData._count.createdTextbooks || 0;
        const totalMaterials = lessonsCount + testsCount + controlWorksCount;

        return NextResponse.json({
            lessonsCount,
            testsCount,
            controlWorksCount,
            totalMaterials,
            gradesCount: teacherData._count.teacherGrades || 0,
        });
    } catch (error:any) {
        // Зберігаємо помилку у базі даних
        await logError({
            message: error.message || "Помилка підрахунку статистики вчителя",
            stack: error.stack,
            source: "API /api/admin/teachers/[id]/activity [GET]",
        });
        return NextResponse.json(
            { error: "Помилка при отриманні даних активності" },
            { status: 500 }
        );
    }
}