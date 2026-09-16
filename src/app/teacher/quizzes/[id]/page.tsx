/**
 * ==============================================================================
 * СТОРІНКА ПЕРЕГЛЯДУ ТЕСТУ (`src/app/teacher/quizzes/[id]/page.tsx`)
 * ==============================================================================
 * @description Клієнтський компонент для попереднього перегляду створеного або
 *              відредагованого тесту/контрольної роботи. Забезпечує:
 *              1. Асинхронне завантаження інформації про тест та його контенту за ID.
 *              2. Парсинг збереженої JSON-структури з питаннями, балами та лімітом часу.
 *              3. Відображення метаданих тесту (предмет, тема, кількість балів, дедлайн).
 *              4. Детальний рендеринг усіх типів питань (один вибір, кілька, введення тексту).
 *              5. Підтримку медіаконтенту (зображення до питань/варіантів та YouTube-відео).
 * ==============================================================================
 */

"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getEmbedUrl } from "@/utils/embed";

// Інтерфейс для варіанта відповіді на питання
interface QuestionOption {
    id: string;
    text: string;
    imageUrl?: string;
    isCorrect: boolean;
}

// Інтерфейс для структури окремого питання
interface Question {
    id: string;
    type: "SINGLE" | "MULTIPLE" | "TEXT_INPUT" | "TEXT";
    questionText: string;
    questionImage?: string;
    questionVideo?: string;
    points: number;
    options?: QuestionOption[];
    correctAnswerText?: string;
}

// Інтерфейс для загальних даних тесту
interface QuizData {
    id: string;
    title: string;
    type: string;
    createdAt: string;
    subject?: { id: string; title: string };
    topic?: { id: string; title: string };
    content: string;
}

export default function ViewQuizPage({ params }: { params: Promise<{ id: string }> }) {
    // Розпаковуємо динамічні параметри роута (ID тесту) за допомогою React.use()
    const { id } = use(params);
    const router = useRouter();

    // Стани для зберігання даних тесту, питань, часу та індикатора завантаження
    const [quiz, setQuiz] = useState<QuizData | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [timeLimit, setTimeLimit] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    /**
     * Ефект: завантаження даних тесту при монтуванні сторінки
     */
    useEffect(() => {
        async function fetchQuiz() {
            try {
                setLoading(true);
                // Отримуємо повні дані матеріалу/тесту за ID через API
                const res = await fetch(`/api/teacher/materials/${id}`);
                if (res.ok) {
                    const data: QuizData = await res.json();
                    setQuiz(data);

                    // Якщо є заповнений контент, парсимо його з JSON-формату
                    if (data.content) {
                        try {
                            const parsed = JSON.parse(data.content);
                            setQuestions(parsed.questions || []);
                            setTimeLimit(parsed.timeLimitMinutes || null);
                        } catch (e) {
                            console.error("Помилка парсингу JSON тесту:", e);
                        }
                    }
                } else {
                    alert("Тест не знайдено");
                    router.push("/teacher");
                }
            } catch (err) {
                console.error("Помилка завантаження тесту:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchQuiz();
    }, [id, router]);

    // Відображення індикатора завантаження
    if (loading) {
        return (
            <div className="min-h-screen flex flex-col bg-slate-50">
                <div className="flex-grow flex items-center justify-center text-slate-500 font-medium">
                    Завантаження інформації про тест...
                </div>
            </div>
        );
    }

    if (!quiz) return null;

    // Обчислення загальної кількості балів за всі питання тесту
    const totalPoints = questions.reduce((acc, q) => acc + (q.points || 1), 0);

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">

            <main className="flex-grow max-w-5xl w-full mx-auto px-4 py-8 space-y-6">

                {/* Навігаційна панель та кнопка переходу до редагування */}
                <div className="bg-white p-4 md:px-6 md:py-4 rounded-2xl md:rounded-3xl shadow-sm border border-slate-200/80 flex items-center justify-between gap-4">
                    <Link
                        href="/teacher?tab=quizzes"
                        className="text-slate-600 hover:text-blue-600 text-sm md:text-base font-medium transition flex items-center gap-1.5"
                    >
                        <span>←</span>
                        <span>До списку тестів</span>
                    </Link>

                    <Link
                        href={`/teacher/quizzes/${quiz.id}/edit`}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs md:text-sm px-5 py-2.5 rounded-full transition shadow-sm flex items-center gap-2"
                    >
                        <span>✏️</span>
                        <span>Редагувати тест</span>
                    </Link>
                </div>

                {/* Основний інформаційний блок тесту */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <div className="border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="font-bold px-2.5 py-0.5 text-xs rounded-md bg-emerald-100 text-emerald-800">
                                📝 Тестова перевірка
                            </span>
                            {quiz.subject && (
                                <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-0.5 rounded-md">
                                    {quiz.subject.title}
                                </span>
                            )}
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900">{quiz.title}</h1>
                    </div>

                    {/* Блок мета-параметрів (статистика тесту) */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <span className="block text-xs font-medium text-slate-400">Кількість питань</span>
                            <span className="text-base font-bold text-slate-800">{questions.length}</span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <span className="block text-xs font-medium text-slate-400">Максимальний бал</span>
                            <span className="text-base font-bold text-slate-800">{totalPoints}</span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <span className="block text-xs font-medium text-slate-400">Обмеження за часом</span>
                            <span className="text-base font-bold text-slate-800">
                                {timeLimit ? `${timeLimit} хв.` : "Без обмежень"}
                            </span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <span className="block text-xs font-medium text-slate-400">Розділ теми</span>
                            <span className="text-base font-bold text-slate-800">
                                {quiz.topic ? quiz.topic.title : "—"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Блок перегляду списку питань */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                    <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
                        Запитання тесту ({questions.length})
                    </h2>

                    {questions.length === 0 ? (
                        <p className="text-slate-400 text-sm italic">У цьому тесті поки немає збережених питань.</p>
                    ) : (
                        <div className="space-y-6">
                            {questions.map((q, idx) => {
                                // Отримуємо коректне посилання для вбудовування відео (YouTube / Drive)
                                const videoEmbedUrl = q.questionVideo ? getEmbedUrl("video", q.questionVideo) : null;

                                return (
                                    <div key={q.id || idx} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4">
                                        {/* Заголовок окремого питання та бали */}
                                        <div className="flex justify-between items-start gap-3">
                                            <h3 className="font-bold text-slate-900 text-base">
                                                {idx + 1}. {q.questionText}
                                            </h3>
                                            <span className="text-xs font-bold bg-amber-50 text-amber-800 px-2.5 py-1 rounded-lg border border-amber-200 shrink-0">
                                                {q.points || 1} б.
                                            </span>
                                        </div>

                                        {/* Медіаконтент питання: Зображення та Відео */}
                                        {(q.questionImage || videoEmbedUrl) && (
                                            <div className="space-y-3 pt-1">
                                                {q.questionImage && (
                                                    <div>
                                                        <img
                                                            src={q.questionImage}
                                                            alt={`Малюнок до питання ${idx + 1}`}
                                                            className="max-h-64 rounded-xl border border-slate-200 bg-white p-1 object-contain"
                                                        />
                                                    </div>
                                                )}

                                                {videoEmbedUrl && (
                                                    <div className="relative aspect-video w-full max-w-lg rounded-xl overflow-hidden border border-slate-200 bg-black">
                                                        <iframe
                                                            src={videoEmbedUrl}
                                                            className="w-full h-full border-0"
                                                            allowFullScreen
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Відображення варіантів відповідей або еталонного текстового поля */}
                                        {(q.type === "TEXT_INPUT" || q.type === "TEXT") ? (
                                            <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200">
                                                <span className="text-xs font-bold text-emerald-900 block mb-1">
                                                    Еталонна правильна відповідь:
                                                </span>
                                                <span className="text-sm font-extrabold text-emerald-800">
                                                    {q.correctAnswerText || "—"}
                                                </span>
                                            </div>
                                        ) : (
                                            q.options && q.options.length > 0 && (
                                                <div className="space-y-2 pt-1">
                                                    {q.options.map((opt) => (
                                                        <div
                                                            key={opt.id}
                                                            className={`p-3 rounded-xl text-xs md:text-sm font-medium border space-y-2 ${
                                                                opt.isCorrect
                                                                    ? "bg-emerald-50/80 border-emerald-300 text-emerald-950"
                                                                    : "bg-white border-slate-200 text-slate-700"
                                                            }`}
                                                        >
                                                            <div className="flex items-center justify-between gap-2">
                                                                <span>{opt.text}</span>
                                                                {opt.isCorrect && (
                                                                    <span className="text-emerald-700 font-bold text-xs shrink-0 flex items-center gap-1">
                                                                        ✓ Правильна відповідь
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {/* Зображення для конкретного варіанта відповіді */}
                                                            {opt.imageUrl && (
                                                                <div className="pt-1">
                                                                    <img
                                                                        src={opt.imageUrl}
                                                                        alt="Малюнок варіанту"
                                                                        className="h-20 w-20 object-cover rounded-lg border border-slate-200 bg-white"
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}