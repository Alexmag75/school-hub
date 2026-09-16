import { useState } from "react";
import { Question, QuestionType, AnswerOption } from "@/types/quiz";

/**
 * ==============================================================================
 * CUSTOM HOOK: Quiz Questions State Manager (`useQuizQuestions`)
 * ==============================================================================
 * @description Кастомний React-хук для керування повним станoм запитань та варіантів
 *              відповідей у конструкторі тестів/самостійних робіт.
 *
 * @features
 * - Динамічне додавання та видалення запитань (із захистом від видалення останнього).
 * - Додавання, оновлення та видалення варіантів відповідей (із збереженням мінімуму у 2 варіанти).
 * - Автоматична переключка радіо-поведінки (`SINGLE`): при виборі одного правильного варіанта
 *   інші автоматично стають неактивними (`isCorrect: false`).
 * - Автоматичний перерахунок сумарного бала за весь тест (`totalPoints`).
 *
 * @param {Question[]} [initialQuestions] — Початковий масив запитань (наприклад, при редагуванні існуючого тесту)
 * ==============================================================================
 */
export function useQuizQuestions(initialQuestions?: Question[]) {
    // --------------------------------------------------------------------------
    // 1. СТАН ЗАПИТАНЬ (STATE)
    // --------------------------------------------------------------------------
    const [questions, setQuestions] = useState<Question[]>(
        initialQuestions || [
            // Дефолтне перше запитання при створенні нового тесту з нуля
            {
                id: "q-1",
                type: "SINGLE",
                questionText: "",
                points: 1,
                options: [
                    { id: "opt-1", text: "", isCorrect: true },
                    { id: "opt-2", text: "", isCorrect: false },
                ],
            },
        ]
    );

    // --------------------------------------------------------------------------
    // 2. ОПЕРАЦІЇ З ДРУКОВАНИМИ КАРТКАМИ ЗАПИТАНЬ (QUESTION ACTIONS)
    // --------------------------------------------------------------------------

    /**
     * @description Додає нове порожнє запитання із типом SINGLE (вибір одного правильного)
     *              та двома дефолтними варіантами відповідей.
     */
    const addQuestion = () => {
        const newQ: Question = {
            id: `q-${Date.now()}`,
            type: "SINGLE",
            questionText: "",
            points: 1,
            options: [
                { id: `opt-${Date.now()}-1`, text: "", isCorrect: true },
                { id: `opt-${Date.now()}-2`, text: "", isCorrect: false },
            ],
        };
        setQuestions((prev) => [...prev, newQ]);
    };

    /**
     * @description Видаляє запитання за його ID.
     * @rule Забороняє видалення, якщо у тесті залишилося лише 1 запитання.
     */
    const removeQuestion = (qId: string) => {
        if (questions.length === 1) {
            alert("Тест повинен містити принаймні одне питання");
            return;
        }
        setQuestions((prev) => prev.filter((q) => q.id !== qId));
    };

    /**
     * @description Оновлює довільне поле у конкретному запитанні (наприклад, text або points).
     */
    const updateQuestion = (qId: string, field: keyof Question, value: any) => {
        setQuestions((prev) =>
            prev.map((q) => (q.id === qId ? { ...q, [field]: value } : q))
        );
    };

    /**
     * @description Змінює тип запитання (SINGLE, MULTIPLE, TEXT_INPUT).
     * @details Якщо обрано SINGLE, автоматично скидає всі варіанти, окрім першого, в `isCorrect: false`.
     */
    const changeQuestionType = (qId: string, newType: QuestionType) => {
        setQuestions((prev) =>
            prev.map((q) => {
                if (q.id === qId) {
                    return {
                        ...q,
                        type: newType,
                        options: q.options.map((opt, idx) => ({
                            ...opt,
                            // Для поодинокого вибору тільки перший варіант залишається правильним
                            isCorrect: newType === "SINGLE" ? idx === 0 : opt.isCorrect,
                        })),
                    };
                }
                return q;
            })
        );
    };

    // --------------------------------------------------------------------------
    // 3. ОПЕРАЦІЇ З ВАРІАНТАМИ ВІДПОВІДЕЙ (OPTION ACTIONS)
    // --------------------------------------------------------------------------

    /**
     * @description Додає новий варіант відповіді до вказаного запитання.
     */
    const addOption = (qId: string) => {
        setQuestions((prev) =>
            prev.map((q) => {
                if (q.id === qId) {
                    return {
                        ...q,
                        options: [
                            ...q.options,
                            { id: `opt-${Date.now()}`, text: "", isCorrect: false },
                        ],
                    };
                }
                return q;
            })
        );
    };

    /**
     * @description Видаляє варіант відповіді.
     * @rule Забороняє видалення, якщо у питанні залишилося 2 або менше варіантів.
     */
    const removeOption = (qId: string, optId: string) => {
        setQuestions((prev) =>
            prev.map((q) => {
                if (q.id === qId) {
                    if (q.options.length <= 2) {
                        alert("У питанні має бути хоча б 2 варіанти відповіді");
                        return q;
                    }
                    return {
                        ...q,
                        options: q.options.filter((o) => o.id !== optId),
                    };
                }
                return q;
            })
        );
    };

    /**
     * @description Оновлює властивості варіанта відповіді (текст або прапорець `isCorrect`).
     * @details Якщо тип запитання `SINGLE` і вибирається `isCorrect = true`,
     *          автоматично знімає відмітку з усіх інших варіантів.
     */
    const updateOption = (
        qId: string,
        optId: string,
        field: keyof AnswerOption,
        value: any
    ) => {
        setQuestions((prev) =>
            prev.map((q) => {
                if (q.id === qId) {
                    const isSingle = q.type === "SINGLE";
                    const newOptions = q.options.map((opt) => {
                        // Оновлюємо цільовий варіант
                        if (opt.id === optId) {
                            return { ...opt, [field]: value };
                        }
                        // Для SINGLE-запитань забезпечуємо поведінку Radio-кнопки
                        if (isSingle && field === "isCorrect" && value === true) {
                            return { ...opt, isCorrect: false };
                        }
                        return opt;
                    });
                    return { ...q, options: newOptions };
                }
                return q;
            })
        );
    };

    // --------------------------------------------------------------------------
    // 4. ОБЧИСЛЮВАНІ ЗНАЧЕННЯ (COMPUTED VALUES)
    // --------------------------------------------------------------------------

    /**
     * Динамічна сума балів за всі питання тесту
     */
    const totalPoints = questions.reduce((sum, q) => sum + Number(q.points || 0), 0);

    // --------------------------------------------------------------------------
    // 5. ПУБЛІЧНИЙ ІНТЕРФЕЙС ХУКА (PUBLIC API)
    // --------------------------------------------------------------------------
    return {
        questions,
        setQuestions,
        addQuestion,
        removeQuestion,
        updateQuestion,
        changeQuestionType,
        addOption,
        removeOption,
        updateOption,
        totalPoints,
    };
}