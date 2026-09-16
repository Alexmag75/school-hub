import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import {logError} from "@/lib/logger";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== "TEACHER" && session.user.role !== "ADMIN")) {
        return NextResponse.json({ error: "Немає доступу" }, { status: 403 });
    }

    try {
        const formData = await req.formData();

        // Збираємо ВСІ файли з ключів "files" ТА "file"
        const filesFromFilesKey = formData.getAll("files") as File[];
        const filesFromFileKey = formData.getAll("file") as File[];

        // Об'єднуємо їх у єдиний масив
        const files = [...filesFromFilesKey, ...filesFromFileKey];

        if (files.length === 0) {
            return NextResponse.json({ error: "Файли не обрано" }, { status: 400 });
        }

        const MAX_SIZE = 10 * 1024 * 1024; // 10 МБ на файл
        const allowedMimeTypes = [
            "image/jpeg", "image/png", "image/webp", "image/gif",
            "application/pdf", "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation"
        ];

        const uploadedFiles: { url: string; originalName: string }[] = [];

        for (const file of files) {
            if (file.size > MAX_SIZE) {
                return NextResponse.json(
                    { error: `Файл ${file.name} перевищує 10 МБ.` },
                    { status: 400 }
                );
            }

            const isImage = file.type.startsWith("image/");
            const isAllowedDoc = allowedMimeTypes.includes(file.type);

            if (!isImage && !isAllowedDoc) {
                return NextResponse.json(
                    { error: `Формат файлу ${file.name} не підтримується.` },
                    { status: 400 }
                );
            }

            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            const subFolder = isImage ? "images" : "docs";
            const uploadDir = path.join(process.cwd(), "public", "uploads", subFolder);
            await mkdir(uploadDir, { recursive: true });

            const ext = file.name.split(".").pop() || (isImage ? "png" : "pdf");
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
            const filePath = path.join(uploadDir, fileName);

            await writeFile(filePath, buffer);

            uploadedFiles.push({
                url: `/uploads/${subFolder}/${fileName}`,
                originalName: file.name
            });
        }

        return NextResponse.json({ files: uploadedFiles });

    } catch (error:any) {
        // Зберігаємо помилку у базі даних
        await logError({
            message: error.message || "Помилка завантаження файлів",
            stack: error.stack,
            source: "API /api/upload [POST]",
        });
        return NextResponse.json(
            { error: "Не вдалося зберегти файли" },
            { status: 500 }
        );
    }
}