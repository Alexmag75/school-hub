"use client";

/**
 * ==============================================================================
 * СТОРІНКА ПРОХОДЖЕННЯ ТА ПЕРЕГЛЯДУ ТЕСТУ (`src/app/student/quiz/[id]/page.tsx`)
 * ==============================================================================
 */

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, CheckCircle2, AlertCircle, ArrowLeft, ArrowRight, Lock, Home } from "lucide-react";

interface QuestionOption {
    id?: string;
    text: string;
    isCorrect?: boolean;
}

interface MatchingPair {
    id: string;
    leftText: string;
    leftImageUrl?: string;
    rightText: string;
    rightImageUrl?: string;
}

interface Question {
    id: string;
    questionText?: string;
    text?: string;
    type: "SINGLE" | "MULTIPLE" | "TEXT_INPUT" | "MATCHING" | "FILL_IN_BLANKS";
    options?: QuestionOption[] | string[];
    points?: number;
    questionImage?: string;
    matchingPairs?: MatchingPair[];
    blanks?: string[];
}

interface QuizData {
    id: string;
    title: string;
    subjectName?: string;
    questions: Question[];
}

export default function QuizPage() {
    const params = useParams();
    const router = useRouter();
    const quizId = params.id as string;

    const [quiz, setQuiz] = useState<QuizData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [userResult, setUserResult] = useState<any>(null);
    const [isPastDeadline, setIsPastDeadline] = useState(false);

    const isReadOnly = Boolean(userResult);

    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [currentIndex, setCurrentIndex] = useState(0);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState<{
        score: number;
        maxScore: number;
        grade12: number;
    } | null>(null);

    const answersRef = useRef(answers);
    useEffect(() => {
        answersRef.current = answers;
    }, [answers]);

    const isSubmittedRef = useRef(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // --------------------------------------------------------------------------
    // 1. ЗАВАНТАЖЕННЯ ДАНИХ ТЕСТУ
    // --------------------------------------------------------------------------
    useEffect(() => {
        async function fetchQuiz() {
            try {
                const res = await fetch(`/api/student/materials/${quizId}`);
                if (!res.ok) throw new Error("Не вдалося завантажити тест");
                const data = await res.json();

                let questions: Question[] = [];

                if (data.content) {
                    try {
                        let parsed = typeof data.content === "string" ? JSON.parse(data.content) : data.content;
                        if (typeof parsed === "string") parsed = JSON.parse(parsed);

                        if (parsed && Array.isArray(parsed.questions)) {
                            questions = parsed.questions;
                        } else if (Array.isArray(parsed)) {
                            questions = parsed;
                        }
                    } catch (e) {
                        console.error("Помилка парсингу питань:", e);
                    }
                } else if (Array.isArray(data.questions)) {
                    questions = data.questions;
                }

                setQuiz({
                    id: data.id,
                    title: data.title,
                    subjectName: data.subject?.title || data.subjectName,
                    questions,
                });

                if (data.userResult) {
                    setUserResult(data.userResult);
                    if (data.userResult.answers) {
                        try {
                            const savedAnswers = typeof data.userResult.answers === "string"
                                ? JSON.parse(data.userResult.answers)
                                : data.userResult.answers;
                            setAnswers(savedAnswers || {});
                        } catch (e) {
                            console.error("Помилка парсингу відповідей:", e);
                        }
                    }
                }

                setIsPastDeadline(Boolean(data.isPastDeadline));
            } catch (err: any) {
                setError(err.message || "Помилка завантаження");
            } finally {
                setLoading(false);
            }
        }

        if (quizId) fetchQuiz();
    }, [quizId]);

    // --------------------------------------------------------------------------
    // 2. ВІДПРАВКА ТЕСТУ (З СВІДОМИМ АБО ПРИМУСОВИМ ЗАВЕРШЕННЯМ)
    // --------------------------------------------------------------------------
    const submitQuiz = useCallback(async (isAutoSubmit = false) => {
        if (isReadOnly || isSubmitting || isSubmittedRef.current) return;

        if (!isAutoSubmit && !confirm("Ви впевнені, що хочете завершити тест?")) {
            return;
        }

        isSubmittedRef.current = true;
        setIsSubmitting(true);

        try {
            const res = await fetch("/api/student/quiz/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    quizId,
                    answers: answersRef.current,
                    isForced: isAutoSubmit
                }),
            });

            if (!res.ok) throw new Error("Помилка збереження відповідей");

            const data = await res.json();
            setResult({
                score: data.score,
                maxScore: data.maxScore,
                grade12: data.grade12,
            });
        } catch (err: any) {
            if (!isAutoSubmit) {
                alert(err.message || "Не вдалося відправити тест");
                isSubmittedRef.current = false;
            }
        } finally {
            setIsSubmitting(false);
        }
    }, [quizId, isReadOnly, isSubmitting]);

    // --------------------------------------------------------------------------
    // 3. БЛОКУВАННЯ НАВІГАЦІЇ ТА ПЕРЕХОПЛЕННЯ КЛІКІВ ПО МЕНЮ
    // --------------------------------------------------------------------------
    useEffect(() => {
        if (isReadOnly || result) return;

        // Блокуємо назад у браузері
        window.history.pushState(null, "", window.location.href);

        const handlePopState = () => {
            window.history.pushState(null, "", window.location.href);
            if (confirm("Завершити тест та відправити відповіді?")) {
                submitQuiz(true);
            }
        };

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (!isSubmittedRef.current) {
                e.preventDefault();
                e.returnValue = "";
            }
        };

        // Перехоплення кліків поза карткою тесту (наприклад, посилання в Меню, Сайдбарі, Шапці сайту)
        const handleGlobalClick = (e: MouseEvent) => {
            if (isSubmittedRef.current) return;

            const target = e.target as HTMLElement;
            const linkOrBtn = target.closest("a, button");

            if (linkOrBtn && containerRef.current && !containerRef.current.contains(linkOrBtn)) {
                e.preventDefault();
                e.stopPropagation();

                if (confirm("Ви намагаєтеся залишити сторінку тесту. Ваш тест буде завершено та оцінено за вже наданими відповідями. Продовжити?")) {
                    submitQuiz(true);
                }
            }
        };

        window.addEventListener("popstate", handlePopState);
        window.addEventListener("beforeunload", handleBeforeUnload);
        document.addEventListener("click", handleGlobalClick, true);

        return () => {
            window.removeEventListener("popstate", handlePopState);
            window.removeEventListener("beforeunload", handleBeforeUnload);
            document.removeEventListener("click", handleGlobalClick, true);
        };
    }, [isReadOnly, result, submitQuiz]);

    // --------------------------------------------------------------------------
    // ХЕНДЛЕРИ
    // --------------------------------------------------------------------------
    const currentQuestion = quiz?.questions[currentIndex];

    const getOptionDetails = (option: QuestionOption | string) => {
        if (typeof option === "object" && option !== null) {
            const val = option.id ?? option.text ?? "";
            return { val, label: option.text || "", isCorrect: Boolean(option.isCorrect) };
        }
        return { val: option, label: option, isCorrect: false };
    };

    const shuffledMatchingRights = useMemo(() => {
        if (!currentQuestion || currentQuestion.type !== "MATCHING" || !currentQuestion.matchingPairs) {
            return [];
        }
        return [...currentQuestion.matchingPairs].map(p => p.rightText).sort();
    }, [currentQuestion]);

    const handleSingleSelect = (questionId: string, value: string) => {
        if (isReadOnly) return;
        setAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    const handleMultipleSelect = (questionId: string, value: string) => {
        if (isReadOnly) return;
        setAnswers(prev => {
            const current = Array.isArray(prev[questionId]) ? prev[questionId] : [];
            const updated = current.includes(value)
                ? current.filter(item => item !== value)
                : [...current, value];
            return { ...prev, [questionId]: updated };
        });
    };

    const handleTextChange = (questionId: string, text: string) => {
        if (isReadOnly) return;
        setAnswers(prev => ({ ...prev, [questionId]: text }));
    };

    const handleMatchingSelect = (questionId: string, pairId: string, rightTextValue: string) => {
        if (isReadOnly) return;
        setAnswers(prev => {
            const currentObj = prev[questionId] && typeof prev[questionId] === "object" ? prev[questionId] : {};
            return {
                ...prev,
                [questionId]: { ...currentObj, [pairId]: rightTextValue },
            };
        });
    };

    const handleBlankChange = (questionId: string, blankIndex: number, textValue: string) => {
        if (isReadOnly) return;
        setAnswers(prev => {
            const currentObj = prev[questionId] && typeof prev[questionId] === "object" ? prev[questionId] : {};
            return {
                ...prev,
                [questionId]: { ...currentObj, [blankIndex]: textValue },
            };
        });
    };

    /**
     * РЕНДЕР ПРОПУСКІВ В ТЕКСТІ (`FILL_IN_BLANKS`)
     * Підтримує квадратні дужки: [], [ ], [слово], [blank], ___, {blank}
     */
    const renderBlanksText = (q: Question) => {
        const fullText = q.questionText || q.text || "";

        // Знаходить будь-які варіації дужок: [], [ ], [щось всередині] або ___
        const blankRegex = /(\[[^\]]*\]|___+|\{blank\}|%blank%)/gi;
        const parts = fullText.split(blankRegex);

        let blankCounter = 0;
        const currentAnswerObj = answers[q.id] || {};

        return (
            <div className="leading-relaxed text-gray-800 font-medium text-base sm:text-lg">
                {parts.map((part, index) => {
                    if (part.match(blankRegex)) {
                        const bIndex = blankCounter;
                        blankCounter++;
                        const userVal = currentAnswerObj[bIndex] || "";
                        const correctAnswer = q.blanks?.[bIndex] || "";

                        return (
                            <span key={index} className="inline-block mx-1 align-baseline">
                                <input
                                    type="text"
                                    disabled={isReadOnly}
                                    value={userVal}
                                    onChange={(e) => handleBlankChange(q.id, bIndex, e.target.value)}
                                    placeholder="___"
                                    className={`min-w-[60px] max-w-[150px] text-center rounded-md border px-2 py-1 text-sm font-semibold focus:outline-none transition ${
                                        isReadOnly && isPastDeadline
                                            ? userVal.trim().toLowerCase() === correctAnswer.trim().toLowerCase()
                                                ? "border-green-500 bg-green-50 text-green-900"
                                                : "border-red-500 bg-red-50 text-red-900"
                                            : "border-blue-400 focus:border-blue-600 bg-white shadow-sm"
                                    }`}
                                />
                                {isReadOnly && isPastDeadline && (
                                    <span className="ml-1 text-xs text-green-700 font-semibold bg-green-100 px-1.5 py-0.5 rounded">
                                        ({correctAnswer})
                                    </span>
                                )}
                            </span>
                        );
                    }
                    return <span key={index}>{part}</span>;
                })}
            </div>
        );
    };

    // --------------------------------------------------------------------------
    // УМОВНИЙ РЕНДЕР
    // --------------------------------------------------------------------------
    if (loading) {
        return (
            <div className="flex h-96 flex-col items-center justify-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="text-gray-500 font-medium">Завантаження тесту...</p>
            </div>
        );
    }

    if (error || !quiz) {
        return (
            <div className="mx-auto max-w-xl p-6 text-center">
                <AlertCircle className="mx-auto mb-3 h-12 w-12 text-red-500" />
                <h2 className="text-xl font-bold text-gray-800">Помилка</h2>
                <p className="mt-1 text-gray-600">{error || "Тест не знайдено"}</p>
                <button
                    onClick={() => router.back()}
                    className="mt-4 rounded-lg bg-gray-100 px-4 py-2 font-medium text-gray-700 hover:bg-gray-200 transition"
                >
                    Назад
                </button>
            </div>
        );
    }

    if (result) {
        return (
            <div className="mx-auto max-w-lg rounded-2xl border bg-white p-8 text-center shadow-sm my-8">
                <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-green-500" />
                <h1 className="text-2xl font-bold text-gray-900">Тест завершено!</h1>
                <p className="mt-1 text-gray-500">{quiz.title}</p>

                <div className="my-6 rounded-xl bg-gray-50 p-6">
                    <div className="text-sm font-medium text-gray-500">Ваша оцінка</div>
                    <div className="mt-2 text-5xl font-extrabold text-blue-600">
                        {result.grade12} <span className="text-xl font-normal text-gray-400">/ 12</span>
                    </div>
                    <div className="mt-3 text-sm text-gray-600">
                        Набрано балів: {result.score} з {result.maxScore}
                    </div>
                </div>

                <button
                    onClick={() => router.push("/student")}
                    className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 transition shadow-sm"
                >
                    Повернутися до кабінету
                </button>
            </div>
        );
    }

    const totalQuestions = quiz.questions.length;

    return (
        <div ref={containerRef} className="mx-auto max-w-2xl space-y-6 p-4">

            {/* ШАПКА ТЕСТУ */}
            <div className="flex items-center justify-between rounded-xl border bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                    {isReadOnly ? (
                        <button
                            onClick={() => router.push("/student")}
                            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 transition"
                            title="Повернутися в кабінет"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                    ) : (
                        <div className="rounded-lg p-2 text-gray-300 cursor-not-allowed">
                            <Lock className="h-5 w-5" />
                        </div>
                    )}
                    <div>
                        <span className="text-xs font-semibold uppercase text-blue-600">
                            {quiz.subjectName || "Тестування"}
                        </span>
                        <h1 className="text-lg font-bold text-gray-900">{quiz.title}</h1>
                    </div>
                </div>
                <div className="text-sm font-medium text-gray-500">
                    Питання {currentIndex + 1} з {totalQuestions}
                </div>
            </div>

            {/* РЕЖИМ ПЕРЕГЛЯДУ */}
            {isReadOnly && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
                    <div className="flex items-start sm:items-center gap-3">
                        <Lock className="h-5 w-5 shrink-0 text-amber-600 mt-0.5 sm:mt-0" />
                        <p className="text-sm">
                            {isPastDeadline
                                ? "Ви склали цей тест. Нижче наведено перегляд відповідей."
                                : "Ви вже склали цей тест. Правильні відповіді будуть доступні після завершення дедлайну."
                            }
                        </p>
                    </div>
                    <button
                        onClick={() => router.push("/student")}
                        className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 transition"
                    >
                        <Home className="h-4 w-4" />
                        До кабінету
                    </button>
                </div>
            )}

            {/* КАРТКА ПИТАННЯ */}
            {currentQuestion ? (
                <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">

                    {currentQuestion.type !== "FILL_IN_BLANKS" && (
                        <h2 className="text-lg font-medium text-gray-900">
                            {currentIndex + 1}. {currentQuestion.questionText || currentQuestion.text}
                        </h2>
                    )}

                    {currentQuestion.questionImage && (
                        <div className="my-3 overflow-hidden rounded-lg border max-h-80 flex justify-center bg-gray-50">
                            <img
                                src={currentQuestion.questionImage}
                                alt="Ілюстрація"
                                className="object-contain max-h-80"
                            />
                        </div>
                    )}

                    {/* 1. SINGLE */}
                    {currentQuestion.type === "SINGLE" && currentQuestion.options && (
                        <div className="mt-4 space-y-2">
                            {currentQuestion.options.map((option, idx) => {
                                const { val, label, isCorrect } = getOptionDetails(option);
                                const isSelected = answers[currentQuestion.id] === val;

                                let btnStyle = "border-gray-200 hover:bg-gray-50 text-gray-700";

                                if (isReadOnly) {
                                    if (isPastDeadline) {
                                        if (isCorrect) btnStyle = "border-green-500 bg-green-50 text-green-900 font-medium";
                                        else if (isSelected) btnStyle = "border-red-500 bg-red-50 text-red-900 line-through";
                                        else btnStyle = "border-gray-100 bg-gray-50 text-gray-400";
                                    } else {
                                        btnStyle = isSelected ? "border-blue-600 bg-blue-50 font-medium text-blue-900" : "border-gray-100 bg-gray-50 text-gray-400";
                                    }
                                } else if (isSelected) {
                                    btnStyle = "border-blue-600 bg-blue-50 font-medium text-blue-900";
                                }

                                return (
                                    <button
                                        key={idx}
                                        type="button"
                                        disabled={isReadOnly}
                                        onClick={() => handleSingleSelect(currentQuestion.id, val)}
                                        className={`w-full flex items-center justify-between rounded-lg border p-3 text-left transition ${btnStyle}`}
                                    >
                                        <span>{label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* 2. MULTIPLE */}
                    {currentQuestion.type === "MULTIPLE" && currentQuestion.options && (
                        <div className="mt-4 space-y-2">
                            {currentQuestion.options.map((option, idx) => {
                                const { val, label, isCorrect } = getOptionDetails(option);
                                const selectedArr = Array.isArray(answers[currentQuestion.id]) ? answers[currentQuestion.id] : [];
                                const isSelected = selectedArr.includes(val);

                                let btnStyle = "border-gray-200 hover:bg-gray-50 text-gray-700";

                                if (isReadOnly) {
                                    if (isPastDeadline) {
                                        if (isCorrect) btnStyle = "border-green-500 bg-green-50 text-green-900 font-medium";
                                        else if (isSelected) btnStyle = "border-red-500 bg-red-50 text-red-900 line-through";
                                        else btnStyle = "border-gray-100 bg-gray-50 text-gray-400";
                                    } else {
                                        btnStyle = isSelected ? "border-blue-600 bg-blue-50 font-medium text-blue-900" : "border-gray-100 bg-gray-50 text-gray-400";
                                    }
                                } else if (isSelected) {
                                    btnStyle = "border-blue-600 bg-blue-50 font-medium text-blue-900";
                                }

                                return (
                                    <button
                                        key={idx}
                                        type="button"
                                        disabled={isReadOnly}
                                        onClick={() => handleMultipleSelect(currentQuestion.id, val)}
                                        className={`w-full flex items-center justify-between rounded-lg border p-3 text-left transition ${btnStyle}`}
                                    >
                                        <div className="flex items-center">
                                            <input type="checkbox" checked={isSelected} readOnly className="mr-3 h-4 w-4 text-blue-600 pointer-events-none" />
                                            <span>{label}</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* 3. TEXT_INPUT */}
                    {currentQuestion.type === "TEXT_INPUT" && (
                        <div className="mt-4">
                            <input
                                type="text"
                                disabled={isReadOnly}
                                value={answers[currentQuestion.id] || ""}
                                onChange={(e) => handleTextChange(currentQuestion.id, e.target.value)}
                                placeholder="Введіть вашу відповідь..."
                                className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
                            />
                        </div>
                    )}

                    {/* 4. MATCHING */}
                    {currentQuestion.type === "MATCHING" && currentQuestion.matchingPairs && (
                        <div className="mt-4 space-y-3">
                            <p className="text-xs font-semibold uppercase text-gray-500">Установіть відповідність:</p>
                            {currentQuestion.matchingPairs.map((pair, pIdx) => {
                                const selectedVal = answers[currentQuestion.id]?.[pair.id] || "";
                                return (
                                    <div key={pair.id || pIdx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border p-3 bg-gray-50 border-gray-200">
                                        <div className="flex items-center gap-2 font-medium text-gray-800">
                                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                                                {pIdx + 1}
                                            </span>
                                            <span>{pair.leftText}</span>
                                        </div>
                                        <select
                                            disabled={isReadOnly}
                                            value={selectedVal}
                                            onChange={(e) => handleMatchingSelect(currentQuestion.id, pair.id, e.target.value)}
                                            className="w-full sm:w-64 rounded-md border border-gray-300 bg-white p-2 text-sm text-gray-800 focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
                                        >
                                            <option value="">-- Оберіть відповідність --</option>
                                            {shuffledMatchingRights.map((rText, rIdx) => (
                                                <option key={rIdx} value={rText}>{rText}</option>
                                            ))}
                                        </select>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* 5. FILL_IN_BLANKS */}
                    {currentQuestion.type === "FILL_IN_BLANKS" && (
                        <div className="mt-4 p-4 rounded-xl border border-blue-100 bg-blue-50/30">
                            <div className="flex items-start gap-2">
                                <span className="font-bold text-lg text-gray-900">{currentIndex + 1}.</span>
                                {renderBlanksText(currentQuestion)}
                            </div>
                        </div>
                    )}

                </div>
            ) : (
                <div className="rounded-xl border bg-white p-6 text-center text-gray-500">
                    У цьому тесті немає питань.
                </div>
            )}

            {/* НАВІГАЦІЯ */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => setCurrentIndex((prev) => Math.max(prev - 1, 0))}
                    disabled={currentIndex === 0}
                    className="flex items-center gap-1 rounded-lg border px-4 py-2 font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition"
                >
                    <ArrowLeft className="h-4 w-4" /> Назад
                </button>

                {currentIndex < totalQuestions - 1 ? (
                    <button
                        onClick={() => setCurrentIndex((prev) => Math.min(prev + 1, totalQuestions - 1))}
                        className="flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 transition"
                    >
                        Далі <ArrowRight className="h-4 w-4" />
                    </button>
                ) : isReadOnly ? (
                    <button
                        onClick={() => router.push("/student")}
                        className="flex items-center gap-2 rounded-lg bg-gray-800 px-5 py-2 font-medium text-white hover:bg-gray-900 transition"
                    >
                        <Home className="h-4 w-4" />
                        До кабінету
                    </button>
                ) : (
                    <button
                        onClick={() => submitQuiz(false)}
                        disabled={isSubmitting}
                        className="rounded-lg bg-green-600 px-6 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50 transition shadow-sm"
                    >
                        {isSubmitting ? "Надсилання..." : "Завершити тест"}
                    </button>
                )}
            </div>
        </div>
    );
}