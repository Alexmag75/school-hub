import { Question, QuizPayload, QuizType } from "@/types/quiz";

/**
 * ==============================================================================
 * SERVICE: Teacher Quiz & Assessment Service (`quizService`)
 * ==============================================================================
 * @description Сервісний модуль для роботи з конструктором тестів та самостійних/контрольних робіт.
 *              Забезпечує клієнтську валідацію форми, підготовку JSON-пакета (Payload)
 *              для бази даних, а також інтеграцію з API створення, редагування
 *              та завантаження навчальних тем і навантаження вчителя.
 * ==============================================================================
 */
export const quizService = {
    /**
     * @description Проводить комплексну клієнтську перевірку (валідацію) форми тесту перед відправкою.
     *
     * @param {string} title — Назва роботи
     * @param {string} subjectId — Обраний ID предмета
     * @param {Question[]} questions — Масив створених запитань із варіантами відповідей
     *
     * @returns {string | null} Текст помилки для відображення у користувацькому інтерфейсі або `null`, якщо валідація успішна
     */
    validateQuiz(title: string, subjectId: string, questions: Question[]): string | null {
        // 1. Перевірка заповнення базових полів теми та предмета
        if (!title.trim()) return "Будь ласка, введіть назву роботи";
        if (!subjectId) return "Виберіть предмет";

        // 2. Поелементна валідація кожної картки питання
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];

            // Наявність формулювання питання
            if (!q.questionText.trim()) {
                return `Заповніть текст питання №${i + 1}`;
            }

            // Валідація для питань із довільною текстовою відповіддю
            if (q.type === "TEXT_INPUT" && !q.correctAnswerText?.trim()) {
                return `Вкажіть правильну відповідь для питання №${i + 1}`;
            }

            // Валідація для тестових питань (вибір одного або кількох варіантів)
            if (q.type !== "TEXT_INPUT") {
                const hasCorrect = q.options.some((o) => o.isCorrect);
                if (!hasCorrect) {
                    return `Оберіть принаймні один правильний варіант у питанні №${i + 1}`;
                }
            }
        }

        return null; // Валідація пройшла успішно
    },

    /**
     * @description Нормалізує та перетворює стан форми конструктора у валідну структуру `QuizPayload`
     *              для відправки на сервер. Серіалізує питання та обмеження за часом у JSON-рядок `content`.
     *
     * @param data — Поля теми, прив'язки до класів/тем, таймера та масив питань
     * @returns {QuizPayload} Сформований об'єкт запиту
     */
    buildPayload(data: {
        title: string;
        subjectId: string;
        classId: string;
        topicId: string;
        type: QuizType;
        timeLimitMinutes: number | "";
        deadline: string;
        questions: Question[];
    }): QuizPayload {
        // Конвертація порожнього значення таймера у null або число
        const parsedTime = data.timeLimitMinutes ? Number(data.timeLimitMinutes) : null;

        return {
            title: data.title,
            subjectId: data.subjectId,
            classId: data.classId || null,
            topicId: data.topicId || null,
            type: data.type,
            timeLimitMinutes: parsedTime,
            deadline: data.deadline || null,
            // Серіалізація питань та параметрів виконання для гнучкого збереження в БД
            content: JSON.stringify({
                timeLimitMinutes: parsedTime,
                questions: data.questions,
            }),
        };
    },

    /**
     * @description Відправляє POST-запит на створення нового контрольного/тестового матеріалу.
     *
     * @param {QuizPayload} payload — Підготовлений об'єкт тесту
     * @returns {Promise<boolean>} Статус успішності операції (true/false)
     */
    async createQuiz(payload: QuizPayload): Promise<boolean> {
        const res = await fetch("/api/teacher/materials", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        return res.ok;
    },

    /**
     * @description Відправляє PUT-запит на оновлення існуючого тесту за його ID.
     *
     * @param {string} id — Унікальний ідентифікатор матеріалу
     * @param {QuizPayload} payload — Оновлений пакет даних
     * @returns {Promise<boolean>} Статус успішності операції (true/false)
     */
    async updateQuiz(id: string, payload: QuizPayload): Promise<boolean> {
        const res = await fetch(`/api/teacher/materials/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        return res.ok;
    },

    /**
     * @description Завантажує дані авторизованого вчителя (список закріплених предметів, класів та навантаження).
     *
     * @returns {Promise<any>} Об'єкт із профілем вчителя та його навчальними прив'язками
     */
    async fetchTeacherData() {
        const res = await fetch("/api/teacher/my-data");
        if (!res.ok) throw new Error("Failed to load teacher data");
        return res.json();
    },

    /**
     * @description Отримує список календарно-тематичних розділів (Topic) для обраного предмета.
     *
     * @param {string} subjectId — ID предмета
     * @returns {Promise<Array>} Масив тем предмета
     */
    async fetchTopics(subjectId: string) {
        const res = await fetch(`/api/teacher/topics?subjectId=${subjectId}`);
        if (!res.ok) return [];
        return res.json();
    },
};