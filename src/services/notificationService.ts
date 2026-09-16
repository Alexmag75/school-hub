import { StudentNotification } from "@/types/notification";

/**
 * ==============================================================================
 * SERVICE: Student Notification Service
 * ==============================================================================
 * @description Клієнтський сервіс для взаємодії з REST API сповіщень учня.
 *              Забезпечує завантаження активних повідомлень, а також оновлення
 *              їх статусу прочитання (поштучно або масово).
 * ==============================================================================
 */
export const notificationService = {
    /**
     * @description Отримує актуальний список усіх сповіщень авторизованого учня.
     *
     * @usecase     Використовується в шапці сайту (Header/Navbar) та на сторінці сповіщень.
     * @returns     {Promise<StudentNotification[]>} Масив сповіщень учня
     * @throws      {Error} Якщо відповідь сервера відмінна від status 200 OK
     */
    async fetchMyNotifications(): Promise<StudentNotification[]> {
        const response = await fetch("/api/student/notifications", {
            headers: {
                "Content-Type": "application/json",
            },
            // Заборонний кеш гарантує отримання найсвіжіших сповіщень при кожному запиті
            cache: "no-store",
        });

        if (!response.ok) {
            throw new Error("Не вдалося завантажити сповіщення");
        }

        return response.json();
    },

    /**
     * @description Позначає одне конкретне сповіщення як прочитане.
     *
     * @param {string} notificationId — Унікальний ідентифікатор сповіщення
     */
    async markAsRead(notificationId: string): Promise<void> {
        const response = await fetch(`/api/student/notifications/${notificationId}/read`, {
            method: "PATCH",
        });

        if (!response.ok) {
            console.error(`Не вдалося позначити сповіщення ${notificationId} як прочитане`);
        }
    },

    /**
     * @description Масово позначає всі наявні сповіщення учня як прочитані.
     *
     * @usecase Використовується при натисканні кнопки "Прочитати все" у шторці сповіщень.
     */
    async markAllAsRead(): Promise<void> {
        const response = await fetch("/api/student/notifications/read-all", {
            method: "PATCH",
        });

        if (!response.ok) {
            console.error("Не вдалося позначити всі сповіщення як прочитані");
        }
    },
};