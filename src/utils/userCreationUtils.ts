import * as XLSX from "xlsx";
import { CreatedUser } from "@/types/userCreate";

/**
 * ==============================================================================
 * UTILITY: User Credentials Generator & Excel Exporter
 * ==============================================================================
 * @description Набір утиліт для генерації тимчасових облікових даних (логінів/паролів)
 *              та автоматичного експорту списку створених користувачів у файл
 *              Excel (.xlsx) для зручної видачі доступів учням та вчителям.
 * ==============================================================================
 */

/**
 * @description Генерує випадковий 8-значний тимчасовий пароль.
 * @returns {string} Буквено-цифровий рядок з 8 символів
 */
export const generatePass = (): string => Math.random().toString(36).slice(-8);

/**
 * @description Генерує системний email/логін на основі ролі користувача та 4-значного числа.
 * @param {string} role — Роль користувача (наприклад, "STUDENT", "TEACHER")
 * @returns {string} Шаблонний email вигляду `student_1234@school.local`
 */
export const generateLogin = (role: string): string => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `${role.toLowerCase()}_${randomNum}@school.best`;
};

/**
 * @description Експортує список створених облікових записів у файл Excel (.xlsx)
 *              із вирівнюванням колонок та штампом дати у назві файлу.
 *
 * @param {CreatedUser[]} usersList — Масив згенерованих користувачів
 * @param {string} titleSuffix — Суфікс для імені файлу (наприклад: "9-В_клас" або "Вчителі")
 */
export const exportUsersToExcel = (usersList: CreatedUser[], titleSuffix: string) => {
    // 1. Перевірка на наявність даних для експорту
    if (usersList.length === 0) return;

    // 2. Мапінг даних у зручну для таблиці структуру з українськими заголовками
    const excelData = usersList.map((u, index) => ({
        "№": index + 1,
        "ПІБ": u.fullName,
        "Логін (Email)": u.email,
        "Пароль": u.password || u.pass || "",
    }));

    // 3. Перетворення масиву об'єктів у робочий аркуш XLSX
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // 4. Задання ширини колонок у символах (wch — width in characters)
    worksheet["!cols"] = [
        { wch: 5 },  // Порядковий номер №
        { wch: 30 }, // Повне ім'я (ПІБ)
        { wch: 25 }, // Email / Логін
        { wch: 15 }, // Пароль
    ];

    // 5. Створення книги, додавання аркуша та ініціалізація завантаження файлу
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Доступи");
    XLSX.writeFile(
        workbook,
        `Логіни_Паролі_${titleSuffix}_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
};