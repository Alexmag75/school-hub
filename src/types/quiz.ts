/**
 * ==============================================================================
 * TYPE DEFINITIONS: Quiz & Assessment System (`types/quiz.ts`)
 * ==============================================================================
 * @description Визначає структури даних для конструктора тестування, самостійних,
 *              контрольних та атестаційних робіт. Містить інтерфейси запитань,
 *              варіантів відповідей та підготовленого пакета (Payload) для серверного API.
 * ==============================================================================
 */

/**
 * @description Категорія навчальної контрольно-оцінювальної роботи.
 *
 * @type {"QUIZ"}         — Звичайний поточний тест або експрес-перевірка
 * @type {"CONTROL_WORK"} — Тематична контрольна робота
 * @type {"ATTESTATION"}  — Підсумкова або семестрова атестація
 */
export type QuizType = "QUIZ" | "CONTROL_WORK" | "ATTESTATION";

/**
 * @description Тип механіки відповіді у питанні.
 *
 * @type {"SINGLE"}         — Вибір одного правильного варіанта (Radio)
 * @type {"MULTIPLE"}       — Вибір кількох правильних варіантів (Checkbox)
 * @type {"TEXT_INPUT"}     — Введення відкритої текстової відповіді
 * @type {"MATCHING"}       — На відповідність (Логічні пари)
 * @type {"FILL_IN_BLANKS"} — Заповнення пропусків у тексті
 */
export type QuestionType = "SINGLE" | "MULTIPLE" | "TEXT_INPUT" | "MATCHING" | "FILL_IN_BLANKS";

/**
 * @description Елемент навчального класу у випадаючих списках конструктора.
 */
export interface ClassItem {
    /** Унікальний ідентифікатор класу */
    id: string;
    /** Назва класу (наприклад: "9-В") */
    name: string;
}

/**
 * @description Елемент навчального предмета у селекторах.
 */
export interface SubjectItem {
    /** Унікальний ідентифікатор предмета */
    id: string;
    /** Назва предмета (наприклад: "Фізика") */
    title: string;
}

/**
 * @description Елемент календарно-тематичного розділу/теми.
 */
export interface TopicItem {
    /** Унікальний ідентифікатор теми */
    id: string;
    /** Назва теми програми */
    title: string;
}

/**
 * @description Інтерфейс варіанта відповіді на питання (для SINGLE та MULTIPLE).
 */
export interface AnswerOption {
    /** Унікальний ідентифікатор варіанта */
    id: string;
    /** Текст варіанта відповіді */
    text: string;
    /** Опціональне зображення до варіанта */
    imageUrl?: string;
    /** Прапорець, чи є даний варіант правильним */
    isCorrect: boolean;
}

/**
 * @description Інтерфейс лівої та правої пари для завдань на відповідність (MATCHING).
 */
export interface MatchingPair {
    /** Унікальний ідентифікатор пари */
    id: string;
    /** Текст елемента ліворуч (А, Б, В...) */
    leftText: string;
    /** Опціональне зображення елемента ліворуч */
    leftImageUrl?: string;
    /** Текст відповідного елемента праворуч (1, 2, 3...) */
    rightText: string;
    /** Опціональне зображення елемента праворуч */
    rightImageUrl?: string;
}

/**
 * @description Інтерфейс картки окремого запитання в тесті.
 */
export interface Question {
    /** Унікальний ідентифікатор запитання */
    id: string;
    /** Тип механіки відповіді */
    type: QuestionType;
    /** Формулювання / текст запитання */
    questionText: string;
    /** Опціональне ілюстративне зображення до питання */
    questionImage?: string;
    /** Опціональне відео-пояснення або медіа-матеріал */
    questionVideo?: string;
    /** Кількість балів за правильне виконання питання */
    points: number;
    /** Масив варіантів відповідей (для типів SINGLE та MULTIPLE) */
    options: AnswerOption[];
    /** Правильна відповідь для текстових питань типу TEXT_INPUT */
    correctAnswerText?: string;
    /** Пари відповідей для типу MATCHING */
    matchingPairs?: MatchingPair[];
    /** Масив правильних відповідей для кожного пропуску в типі FILL_IN_BLANKS */
    blanks?: string[];
}

/**
 * @description Пакет даних тесту для відправки на API створення/редагування.
 */
export interface QuizPayload {
    /** Назва тестової роботи */
    title: string;
    /** ID навчального предмета */
    subjectId: string;
    /** ID класу або null, якщо робота загальна */
    classId: string | null;
    /** ID теми програми або null */
    topicId: string | null;
    /** Категорія контролю */
    type: QuizType;
    /** Часовий ліміт у хвилинах або null (без обмеження) */
    timeLimitMinutes: number | null;
    /** Кінцевий термін здачі (ISO date string) або null */
    deadline: string | null;
    /** Серіалізована JSON-строка з масивом запитань Question[] та налаштуваннями */
    content: string;
}