import * as XLSX from "xlsx";
import { User } from "@/types/user";
import { getUserClasses } from "@/utils/userUtils";

/**
 * ==============================================================================
 * SERVICE: User Management & Data Export Service
 * ==============================================================================
 * @description Сервісний модуль для роботи з користувачами системи.
 *              Містить функціонал генерації та експорту повного реєстру користувачів
 *              (учнів, вчителів, адміністраторів) у форматі Excel (.xlsx).
 * ==============================================================================
 */

/**
 * @description Експортує масив користувачів у файл Excel із локалізованими ролями,
 *              прив'язаними классами та навчальними предметами.
 *
 * @param {User[]} users — Масив об'єктів користувачів із бази даних або стану UI
 *
 * @details
 * - Транслює системні ролі (`STUDENT`, `TEACHER`, `ADMIN`) у зрозумілі назви українською.
 * - Для кожного користувача автоматично підтягує списки класів (через `getUserClasses`)
 *   та викладацьких предметів.
 * - Налаштовує оптимальну ширину колонок для зручного перегляду в MS Excel / Google Таблицях.
 */
export const exportUsersToExcel = (users: User[]) => {
    // 1. Перевірка на наявність даних для експорту
    if (users.length === 0) return;

    // 2. Трансформація об'єктів користувачів у плоску структуру для таблиці
    const excelData = users.map((u, index) => {
        // Локалізація текстової мітки ролі
        const roleLabel =
            u.role === "STUDENT" ? "Учень" : u.role === "TEACHER" ? "Вчитель" : "Адміністратор";

        // Форматування переліку класів у єдиний рядок
        const userClasses = getUserClasses(u)
            .map((c) => `Клас ${c.name}`)
            .join(", ") || "—";

        return {
            "№": index + 1,
            "ПІБ": u.fullName || u.lastName,
            "Логін (Email)": u.email,
            "Роль": roleLabel,
            "Класи": userClasses,
            "Предмети": u.subjects?.map((s) => s.title).join(", ") || "—",
        };
    });

    // 3. Перетворення масиву об'єктів у робочий аркуш XLSX
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // 4. Налаштування ширини колонок у символах (wch — width in characters)
    worksheet["!cols"] = [
        { wch: 5 },  // №
        { wch: 30 }, // ПІБ
        { wch: 28 }, // Логін (Email)
        { wch: 15 }, // Роль
        { wch: 20 }, // Класи
        { wch: 35 }, // Предмети
    ];

    // 5. Створення книги, додавання аркуша та ініціалізація завантаження файлу
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Користувачі");
    XLSX.writeFile(
        workbook,
        `Список_користувачів_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
};