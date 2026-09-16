import { User } from "@/types/user";

/**
 * ==============================================================================
 * UTILITY: User Data Extractors (`getUserClasses`, `getUserSubjects`)
 * ==============================================================================
 * @description Набір допоміжних функцій для витягування та нормалізації списків
 *              класів та предметів, пов'язаних з конкретним користувачем (учнем або вчителем).
 * ==============================================================================
 */

/**
 * @description Отримує список унікальних класів, прив'язаних до користувача.
 *
 * @details
 * - Для **учня (STUDENT)**: повертає його єдиний закріплений клас `className`.
 * - Для **вчителя (TEACHER)**: збирає унікальний список усіх класів з навантаження (`teacherAssignments`),
 *   використовуючи `Map` для фільтрації дублікатів (якщо вчитель веде кілька предметів у одному класі).
 *
 * @param {User} user — Об'єкт користувача з профілю або сесії
 * @returns {{ id: string; name: string }[]} Масив об'єктів класів у форматі `{ id, name }`
 */
export function getUserClasses(user: User): { id: string; name: string }[] {
    // 1. Якщо користувач — учень, повертаємо його закріплений клас
    if (user.role === "STUDENT" && user.className) {
        return [{ id: user.className.id || "", name: user.className.name }];
    }

    // 2. Якщо користувач — вчитель, формуємо список класів із його педагогічного навантаження
    if (user.role === "TEACHER" && Array.isArray(user.teacherAssignments)) {
        const uniqueClasses = new Map<string, string>();

        user.teacherAssignments.forEach((item: any) => {
            const cls = item.class;
            if (cls?.name) {
                // Використовуємо Map для запобігання дублюванню класів
                uniqueClasses.set(cls.id || cls.name, cls.name);
            }
        });

        // Перетворюємо записи Map у масив стандартного вигляду { id, name }
        return Array.from(uniqueClasses.entries()).map(([id, name]) => ({ id, name }));
    }

    // 3. Для інших ролей (або за відсутності даних) повертаємо порожній масив
    return [];
}

/**
 * @description Отримує список унікальних навчальних предметів, які викладає вчитель.
 *
 * @details
 * - Перевіряє, чи є користувач вчителем (`TEACHER`).
 * - Пріоритетно збирає предмети з розподілу навантаження (`teacherAssignments`) через `Map`.
 * - Якщо навантаження відсутнє, повертає прямо прив'язаний масив предметів (`user.subjects`).
 *
 * @param {User} user — Об'єкт користувача
 * @returns {{ id: string; title: string }[]} Масив об'єктів предметів у форматі `{ id, title }`
 */
export function getUserSubjects(user: User): { id: string; title: string }[] {
    // Предмети актуальні тільки для ролі вчителя
    if (user.role !== "TEACHER") return [];

    // 1. Спроба витягти предмети з педагогічного навантаження teacherAssignments
    if (Array.isArray(user.teacherAssignments)) {
        const uniqueSubjects = new Map<string, string>();

        user.teacherAssignments.forEach((item: any) => {
            const subj = item.subject;
            if (subj?.title) {
                // Фільтрація повторюваних предметів
                uniqueSubjects.set(subj.id || subj.title, subj.title);
            }
        });

        return Array.from(uniqueSubjects.entries()).map(([id, title]) => ({ id, title }));
    }

    // 2. Резервний варіант: повертаємо безпосередньо прив'язаний масив subjects
    if (Array.isArray(user.subjects)) {
        return user.subjects;
    }

    return [];
}