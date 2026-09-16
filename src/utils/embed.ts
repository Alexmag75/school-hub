import { BlockType } from "@/types/lesson";

/**
 * ==============================================================================
 * UTILITY: Embed URL Transformer (`getEmbedUrl`)
 * ==============================================================================
 * @description Трансформує звичайні публічні посилання з різних освітніх
 *              та медіа-платформ (YouTube, Google Slides, Google Drive, Canva,
 *              Prezi, Scratch, LearningApps) у спеціальні URL-адреси, придатні
 *              для вбудовування через `<iframe>` у блочному редакторі уроків.
 *
 * @param {BlockType} type — Тип блоку уроку ("image" | "text" | "video" | "presentation" | "interactive" | "embed")
 * @param {string} url — Оригінальне посилання, введене вчителем
 *
 * @returns {string | null} Готове посилання для <iframe> або null, якщо посилання порожнє
 * ==============================================================================
 */
export const getEmbedUrl = (type: BlockType, url: string): string | null => {
    // 1. Перевірка на наявність посилання
    if (!url) return null;
    const cleanUrl = url.trim();

    // 2. Звичайні зображення та текстові блоки повертаємо без змін
    if (type === "image" || type === "text") return cleanUrl;

    // --------------------------------------------------------------------------
    // 3. ВІДЕОКОНТЕНТ (YouTube, Google Drive Video)
    // --------------------------------------------------------------------------
    if (type === "video") {
        // Стандартне посилання YouTube: https://www.youtube.com/watch?v=ID -> /embed/ID
        if (cleanUrl.includes("youtube.com/watch?v=")) {
            return cleanUrl.replace("watch?v=", "embed/");
        }
        // Скорочене посилання YouTube: https://youtu.be/ID -> https://www.youtube.com/embed/ID
        if (cleanUrl.includes("youtu.be/")) {
            const id = cleanUrl.split("youtu.be/")[1]?.split("?")[0];
            return `https://www.youtube.com/embed/${id}`;
        }
        // Відео з Google Drive: /view -> /preview для підтримки плеєра
        if (cleanUrl.includes("drive.google.com/file/d/")) {
            return cleanUrl.replace("/view", "/preview");
        }
        return cleanUrl;
    }

    // --------------------------------------------------------------------------
    // 4. ПРЕЗЕНТАЦІЇ (Google Slides, Google Drive, Canva, Prezi)
    // --------------------------------------------------------------------------
    if (type === "presentation") {
        // Google Презентації: адаптація посилання редагування в режим вбудованого перегляду
        if (cleanUrl.includes("docs.google.com/presentation/d/")) {
            if (cleanUrl.includes("/embed")) return cleanUrl;
            return cleanUrl.replace(/\/edit.*$/, "/embed?start=false&loop=false&delayms=3000");
        }
        // Презентації/файли з Google Drive
        if (cleanUrl.includes("drive.google.com/file/d/")) {
            return cleanUrl.replace("/view", "/preview");
        }
        // Презентації Canva
        if (cleanUrl.includes("canva.com/design/")) {
            if (cleanUrl.includes("/view")) return cleanUrl.replace("/view", "/view?embed");
            if (!cleanUrl.includes("embed")) return `${cleanUrl}/view?embed`;
        }
        // Презентації Prezi
        if (cleanUrl.includes("prezi.com/p/") || cleanUrl.includes("prezi.com/v/")) {
            if (cleanUrl.includes("/embed")) return cleanUrl;
            return cleanUrl.replace(/\/$/, "") + "/embed";
        }
        return cleanUrl;
    }

    // --------------------------------------------------------------------------
    // 5. ІНТЕРАКТИВНІ ВПРАВИ ТА ВБУДОВАНІ МОДУЛІ (Scratch, LearningApps)
    // --------------------------------------------------------------------------
    if (type === "interactive" || type === "embed") {
        // Проєкти Scratch: https://scratch.mit.edu/projects/ID/ -> /embed
        if (cleanUrl.includes("scratch.mit.edu/projects/")) {
            const projectId = cleanUrl.split("projects/")[1]?.split("/")[0];
            return `https://scratch.mit.edu/projects/${projectId}/embed`;
        }
        // Інтерактивні вправи LearningApps: підготовка frame.php
        if (cleanUrl.includes("learningapps.org/")) {
            if (cleanUrl.includes("/watch?v=")) return cleanUrl.replace("/watch?v=", "/frame.php?v=");
            if (cleanUrl.includes("/display?v=")) return cleanUrl.replace("/display?v=", "/frame.php?v=");
            if (cleanUrl.includes("frame.php")) return cleanUrl;
        }
        return cleanUrl;
    }

    return cleanUrl;
};