/**
 * ==============================================================================
 * SERVICE: Student Tasks Service (`studentService`)
 * ==============================================================================
 * @description Сервісний модуль для роботи із завданнями учня.
 *              Забезпечує завантаження списку домашніх робіт, тестів та навчальних
 *              матеріалів із підтримкою фільтрації за вкладками станів та предметами.
 * ==============================================================================
 */

import { TaskTab, StudentTask } from "@/types/student-task";

export const studentService = {
    /**
     * @description Отримує список завдань авторизованого учня з урахуванням обраної
     *              вкладки та опціонального фільтра за навчальним предметом.
     *
     * @usecase     Використовується на головній сторінці дашборду учня та в розділі "Завдання".
     *
     * @param {TaskTab} tab — Обрана користувачем вкладка фільтрації ("all" | "active" | "completed" | "requires_attention" | "expired")
     * @param {string} [subject] — Опціональний ідентифікатор або назва предмета для вибіркової фільтрації
     *
     * @returns {Promise<StudentTask[]>} Масив об'єктів завдань `StudentTask`
     * @throws {Error} Якщо відповідь API містить статус помилки (не 200 OK)
     */
    async fetchMyTasks(tab: TaskTab, subject?: string): Promise<StudentTask[]> {
        // 1. Мапінг вкладки UI на відповідну категорію API.
        // Для вкладки "Потребує уваги" (повторна перевірка/допрацювання) запитуємо категорію "completed"
        const backendTab = tab === "requires_attention" ? "completed" : tab;

        // 2. Формування URL-запиту з динамічними query-параметрами
        const response = await fetch(
            `/api/student/tasks?tab=${backendTab}${subject ? `&subject=${subject}` : ""}`
        );

        // 3. Перевірка статусу виконання запиту
        if (!response.ok) {
            throw new Error("Не вдалося завантажити завдання");
        }

        // 4. Парсинг та повернення масиву завдань
        return response.json();
    },
};