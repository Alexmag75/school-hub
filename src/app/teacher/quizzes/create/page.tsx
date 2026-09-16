"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getEmbedUrl } from "@/utils/embed";
import { readAsBase64 } from "@/utils/file";
import { quizService } from "@/services/quizService";
import { useQuizQuestions } from "@/hooks/useQuizQuestions";
import { ClassItem, SubjectItem, TopicItem, QuizType, QuestionType, MatchingPair } from "@/types/quiz";

export default function CreateQuizPage() {
    const router = useRouter();

    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [subjects, setSubjects] = useState<SubjectItem[]>([]);
    const [topics, setTopics] = useState<TopicItem[]>([]);

    const [title, setTitle] = useState("");
    const [subjectId, setSubjectId] = useState("");
    const [classId, setClassId] = useState("");
    const [topicId, setTopicId] = useState("");
    const [quizType, setQuizType] = useState<QuizType>("QUIZ");
    const [timeLimitMinutes, setTimeLimitMinutes] = useState<number | "">(45);
    const [deadline, setDeadline] = useState("");

    const optionFileInputRef = useRef<HTMLInputElement | null>(null);
    const questionFileInputRef = useRef<HTMLInputElement | null>(null);

    const [activeOptionTarget, setActiveOptionTarget] = useState<{ qId: string; optId: string } | null>(null);
    const [activeQuestionTarget, setActiveQuestionTarget] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        questions,
        addQuestion,
        removeQuestion,
        updateQuestion,
        changeQuestionType,
        addOption,
        removeOption,
        updateOption,
        totalPoints,
    } = useQuizQuestions();

    useEffect(() => {
        async function initData() {
            try {
                const data = await quizService.fetchTeacherData();
                setClasses(data.classes || []);
                setSubjects(data.subjects || []);
                if (data.subjects?.length > 0) setSubjectId(data.subjects[0].id);
                if (data.classes?.length > 0) setClassId(data.classes[0].id);
            } catch (err) {
                console.error("Помилка завантаження даних:", err);
            }
        }
        initData();
    }, []);

    useEffect(() => {
        if (!subjectId) return;
        quizService.fetchTopics(subjectId).then(setTopics);
    }, [subjectId]);

    const triggerOptionFileUpload = (qId: string, optId: string) => {
        setActiveOptionTarget({ qId, optId });
        if (optionFileInputRef.current) {
            optionFileInputRef.current.value = "";
            optionFileInputRef.current.click();
        }
    };

    const handleOptionFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !activeOptionTarget) return;
        const base64Url = await readAsBase64(file);
        updateOption(activeOptionTarget.qId, activeOptionTarget.optId, "imageUrl", base64Url);
        setActiveOptionTarget(null);
    };

    const triggerQuestionFileUpload = (qId: string) => {
        setActiveQuestionTarget(qId);
        if (questionFileInputRef.current) {
            questionFileInputRef.current.value = "";
            questionFileInputRef.current.click();
        }
    };

    const handleQuestionFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !activeQuestionTarget) return;
        const base64Url = await readAsBase64(file);
        updateQuestion(activeQuestionTarget, "questionImage", base64Url);
        setActiveQuestionTarget(null);
    };

    /* Хелпери для роботи з відповідностями (MATCHING) */
    const handleAddMatchingPair = (qId: string) => {
        const question = questions.find((q) => q.id === qId);
        if (!question) return;
        const pairs = question.matchingPairs || [];
        const newPair: MatchingPair = {
            id: Date.now().toString(),
            leftText: "",
            rightText: "",
        };
        updateQuestion(qId, "matchingPairs", [...pairs, newPair]);
    };

    const handleUpdateMatchingPair = (qId: string, pairId: string, field: keyof MatchingPair, value: string) => {
        const question = questions.find((q) => q.id === qId);
        if (!question || !question.matchingPairs) return;
        const updatedPairs = question.matchingPairs.map((p) =>
            p.id === pairId ? { ...p, [field]: value } : p
        );
        updateQuestion(qId, "matchingPairs", updatedPairs);
    };

    const handleRemoveMatchingPair = (qId: string, pairId: string) => {
        const question = questions.find((q) => q.id === qId);
        if (!question || !question.matchingPairs) return;
        const updatedPairs = question.matchingPairs.filter((p) => p.id !== pairId);
        updateQuestion(qId, "matchingPairs", updatedPairs);
    };

    /* Хелпери для заповнення пропусків (FILL_IN_BLANKS) */
    const handleFillInBlanksTextChange = (qId: string, text: string) => {
        updateQuestion(qId, "questionText", text);
        // Знаходимо всі фрагменти у квадратних дужках: [слово]
        const matches = text.match(/\[(.*?)\]/g);
        if (matches) {
            const extractedBlanks = matches.map((m) => m.replace(/\[|\]/g, "").trim());
            updateQuestion(qId, "blanks", extractedBlanks);
        } else {
            updateQuestion(qId, "blanks", []);
        }
    };

    const handleUpdateBlankAnswer = (qId: string, index: number, value: string) => {
        const question = questions.find((q) => q.id === qId);
        if (!question || !question.blanks) return;
        const updatedBlanks = [...question.blanks];
        updatedBlanks[index] = value;
        updateQuestion(qId, "blanks", updatedBlanks);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const errorMsg = quizService.validateQuiz(title, subjectId, questions);
        if (errorMsg) return alert(errorMsg);

        setIsSubmitting(true);
        const payload = quizService.buildPayload({
            title,
            subjectId,
            classId,
            topicId,
            type: quizType,
            timeLimitMinutes,
            deadline,
            questions,
        });

        try {
            const ok = await quizService.createQuiz(payload);
            if (ok) {
                router.push("/teacher");
            } else {
                alert("Помилка збереження тесту");
            }
        } catch (err) {
            console.error("Помилка при збереженні:", err);
            alert("Мережева помилка");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
            <input type="file" ref={optionFileInputRef} onChange={handleOptionFileSelected} accept="image/*" className="hidden" />
            <input type="file" ref={questionFileInputRef} onChange={handleQuestionFileSelected} accept="image/*" className="hidden" />

            <main className="flex-grow max-w-5xl w-full mx-auto px-4 py-8 space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <span>📝</span> Конструктор тесту / контрольної
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">Створюйте інтерактивні тестування з автоперевіркою</p>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl text-emerald-800 text-xs font-semibold">
                        Всього балів за тест: <span className="text-base font-extrabold">{totalPoints}</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Параметри */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                        <h2 className="font-bold text-slate-800 text-base border-b pb-3 border-slate-100 flex items-center gap-2">
                            <span>⚙️</span> Основні параметри роботи
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="md:col-span-2 lg:col-span-3">
                                <label className="block text-xs font-bold text-slate-700 mb-1">Назва теми тесту / контрольної *</label>
                                <input
                                    type="text"
                                    placeholder="Наприклад: Самостійна робота з теми 'Закони Ньютона'"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-sm outline-none focus:ring-2 focus:ring-primary font-medium"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Предмет *</label>
                                <select
                                    value={subjectId}
                                    onChange={(e) => setSubjectId(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-primary font-medium"
                                    required
                                >
                                    {subjects.map((s) => (
                                        <option key={s.id} value={s.id}>{s.title}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Призначити для класу</label>
                                <select
                                    value={classId}
                                    onChange={(e) => setClassId(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-primary font-medium"
                                >
                                    <option value="">Для всіх моїх класів</option>
                                    {classes.map((c) => (
                                        <option key={c.id} value={c.id}>Клас {c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Розділ програмного матеріалу</label>
                                <select
                                    value={topicId}
                                    onChange={(e) => setTopicId(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-primary font-medium"
                                >
                                    <option value="">Без прив'язки до розділу</option>
                                    {topics.map((t) => (
                                        <option key={t.id} value={t.id}>{t.title}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Тип роботи</label>
                                <select
                                    value={quizType}
                                    onChange={(e: any) => setQuizType(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-primary font-semibold text-primary"
                                >
                                    <option value="QUIZ">📝 Поточний / Тренувальний тест</option>
                                    <option value="CONTROL_WORK">🏆 Контрольна робота</option>
                                    <option value="ATTESTATION">🎓 Атестаційна / Підсумкова робота</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">⏱️ Час на виконання (хвилини)</label>
                                <input
                                    type="number"
                                    placeholder="Наприклад: 45 (порожньо — без обмежень)"
                                    value={timeLimitMinutes}
                                    onChange={(e) => setTimeLimitMinutes(e.target.value ? Number(e.target.value) : "")}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-primary"
                                    min="1"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">📅 Кінцевий термін здачі (Дедлайн)</label>
                                <input
                                    type="datetime-local"
                                    value={deadline}
                                    onChange={(e) => setDeadline(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Питання */}
                    <div className="space-y-4">
                        <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                            <span>❓</span> Список питань ({questions.length})
                        </h2>

                        {questions.map((q, qIndex) => {
                            const videoEmbedUrl = q.questionVideo ? getEmbedUrl("video", q.questionVideo) : null;
                            return (
                                <div key={q.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4 relative">
                                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                                        <span className="font-bold text-slate-900 text-sm bg-slate-100 px-3 py-1 rounded-lg">
                                            Питання #{qIndex + 1}
                                        </span>
                                        <div className="flex items-center gap-3">
                                            <select
                                                value={q.type}
                                                onChange={(e) => changeQuestionType(q.id, e.target.value as QuestionType)}
                                                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none"
                                            >
                                                <option value="SINGLE">🔘 Одна правильна відповідь</option>
                                                <option value="MULTIPLE">☑️ Кілька правильних відповідей</option>
                                                <option value="TEXT_INPUT">✍️ Введення тексту / числа</option>
                                                <option value="MATCHING">🧩 На відповідність (Логічні пари)</option>
                                                <option value="FILL_IN_BLANKS">🔤 Заповнення пропусків у тексті</option>
                                            </select>
                                            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl text-xs">
                                                <span className="font-semibold text-amber-800">Бал:</span>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={q.points}
                                                    onChange={(e) => updateQuestion(q.id, "points", Number(e.target.value))}
                                                    className="w-12 bg-white border border-amber-300 rounded px-1 text-center font-bold text-slate-800"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeQuestion(q.id)}
                                                className="text-red-500 hover:text-red-700 p-1 transition"
                                                title="Видалити питання"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                                                {q.type === "FILL_IN_BLANKS"
                                                    ? "Текст із пропусками у квадратних дужках *"
                                                    : "Текст питання / інструкція *"}
                                            </label>
                                            <textarea
                                                rows={q.type === "FILL_IN_BLANKS" ? 4 : 2}
                                                placeholder={
                                                    q.type === "FILL_IN_BLANKS"
                                                        ? "Речення з пропуск[ом]. Використовуйте квадратні дужки для [слів] або [букв], які учень має вписати."
                                                        : "Введіть умови питання або завдання..."
                                                }
                                                value={q.questionText}
                                                onChange={(e) =>
                                                    q.type === "FILL_IN_BLANKS"
                                                        ? handleFillInBlanksTextChange(q.id, e.target.value)
                                                        : updateQuestion(q.id, "questionText", e.target.value)
                                                }
                                                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary font-mono"
                                            />
                                            {q.type === "FILL_IN_BLANKS" && (
                                                <p className="text-[11px] text-slate-500 mt-1">
                                                    💡 Порада: огортайте правильні слова у дужки, наприклад: <code className="bg-slate-200 px-1 rounded">Шевченко народився у [1814] році.</code>
                                                </p>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-500 mb-1">🖼️ Малюнок / схема до питання</label>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => triggerQuestionFileUpload(q.id)}
                                                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl transition border border-slate-300 flex items-center gap-1.5"
                                                    >
                                                        <span>📂</span> Обрати малюнок з папки
                                                    </button>
                                                    {q.questionImage && (
                                                        <button
                                                            type="button"
                                                            onClick={() => updateQuestion(q.id, "questionImage", "")}
                                                            className="text-xs text-red-600 font-semibold hover:underline"
                                                        >
                                                            Видалити
                                                        </button>
                                                    )}
                                                </div>
                                                {q.questionImage && (
                                                    <div className="mt-2">
                                                        <img src={q.questionImage} alt="Запитання" className="h-24 max-w-full object-contain rounded-lg border border-slate-200 bg-white p-1" />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-500 mb-1">🎥 Посилання на відео (YouTube / Google Drive)</label>
                                                <input
                                                    type="url"
                                                    placeholder="https://www.youtube.com/watch?v=..."
                                                    value={q.questionVideo || ""}
                                                    onChange={(e) => updateQuestion(q.id, "questionVideo", e.target.value)}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs outline-none"
                                                />
                                            </div>
                                        </div>
                                        {videoEmbedUrl && (
                                            <div className="mt-2 relative aspect-video w-full max-w-md rounded-xl overflow-hidden border border-slate-200 bg-black">
                                                <iframe src={videoEmbedUrl} className="w-full h-full border-0" allowFullScreen />
                                            </div>
                                        )}
                                    </div>

                                    {/* ВАРІАНТИ ВІДПОВІДЕЙ / ВІДПОВІДНОСТІ / ПРОПУСКИ */}
                                    <div className="space-y-3 pt-2">
                                        {/* 1. ВВЕДЕННЯ ТЕКСТУ */}
                                        {q.type === "TEXT_INPUT" && (
                                            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200 space-y-2">
                                                <label className="block text-xs font-semibold text-emerald-900">Еталонна правильна відповідь (система порівнюватиме з нею):</label>
                                                <input
                                                    type="text"
                                                    placeholder="Наприклад: 25 або 9.8"
                                                    value={q.correctAnswerText || ""}
                                                    onChange={(e) => updateQuestion(q.id, "correctAnswerText", e.target.value)}
                                                    className="w-full bg-white border border-emerald-300 rounded-xl p-2.5 text-sm font-bold text-emerald-900 outline-none focus:ring-2 focus:ring-emerald-500"
                                                />
                                            </div>
                                        )}

                                        {/* 2. НА ВІДПОВІДНІСТЬ (MATCHING) */}
                                        {q.type === "MATCHING" && (
                                            <div className="space-y-3">
                                                <label className="block text-xs font-bold text-slate-700">Пари відповідності (Ліва колонка ↔ Права колонка):</label>
                                                {(q.matchingPairs || []).map((pair, pIdx) => {
                                                    const leftLabel = String.fromCharCode(65 + pIdx); // А, Б, В, Г...
                                                    return (
                                                        <div key={pair.id} className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 relative">
                                                            <div className="space-y-1">
                                                                <span className="text-xs font-bold text-slate-500">{leftLabel}) Елемент ліворуч</span>
                                                                <input
                                                                    type="text"
                                                                    placeholder={`Текст або назва (${leftLabel})`}
                                                                    value={pair.leftText}
                                                                    onChange={(e) => handleUpdateMatchingPair(q.id, pair.id, "leftText", e.target.value)}
                                                                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs outline-none"
                                                                />
                                                            </div>
                                                            <div className="space-y-1 relative pr-8">
                                                                <span className="text-xs font-bold text-slate-500">{pIdx + 1}) Відповідність праворуч</span>
                                                                <input
                                                                    type="text"
                                                                    placeholder={`Текст або відповідник (${pIdx + 1})`}
                                                                    value={pair.rightText}
                                                                    onChange={(e) => handleUpdateMatchingPair(q.id, pair.id, "rightText", e.target.value)}
                                                                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs outline-none"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveMatchingPair(q.id, pair.id)}
                                                                    className="absolute right-0 top-6 text-slate-400 hover:text-red-500 p-1 font-bold text-sm"
                                                                    title="Видалити пару"
                                                                >
                                                                    ✕
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                <button
                                                    type="button"
                                                    onClick={() => handleAddMatchingPair(q.id)}
                                                    className="text-xs font-semibold text-primary hover:underline transition flex items-center gap-1 pt-1"
                                                >
                                                    <span>➕</span> Додати пару відповідностей
                                                </button>
                                            </div>
                                        )}

                                        {/* 3. ЗАПОВНЕННЯ ПРОПУСКІВ (FILL_IN_BLANKS) */}
                                        {q.type === "FILL_IN_BLANKS" && (
                                            <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-200 space-y-3">
                                                <label className="block text-xs font-bold text-indigo-900">
                                                    Розпізнані правильні відповіді для пропусків ({q.blanks?.length || 0}):
                                                </label>
                                                {q.blanks && q.blanks.length > 0 ? (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                                        {q.blanks.map((blank, bIdx) => (
                                                            <div key={bIdx} className="bg-white p-2 rounded-lg border border-indigo-200 flex items-center gap-2">
                                                                <span className="text-xs font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                                                                    #{bIdx + 1}
                                                                </span>
                                                                <input
                                                                    type="text"
                                                                    value={blank}
                                                                    onChange={(e) => handleUpdateBlankAnswer(q.id, bIdx, e.target.value)}
                                                                    className="w-full text-xs font-semibold text-slate-800 outline-none"
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-indigo-600 italic">
                                                        Додайте хоча б один пропуск у текст вище за допомогою квадратних дужок, наприклад: <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-indigo-200">[слово]</span>
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {/* 4. ОДНА ТА КІЛЬКА ПРАВИЛЬНИХ ВІДПОВІДЕЙ (SINGLE & MULTIPLE) */}
                                        {(q.type === "SINGLE" || q.type === "MULTIPLE") && (
                                            <div className="space-y-2.5">
                                                <label className="block text-xs font-bold text-slate-700">Варіанти відповідей:</label>
                                                {q.options.map((opt, optIndex) => (
                                                    <div key={opt.id} className="space-y-2">
                                                        <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                                                            <input
                                                                type={q.type === "SINGLE" ? "radio" : "checkbox"}
                                                                name={`correct-${q.id}`}
                                                                checked={opt.isCorrect}
                                                                onChange={(e) => updateOption(q.id, opt.id, "isCorrect", e.target.checked)}
                                                                className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer ml-1"
                                                            />
                                                            <input
                                                                type="text"
                                                                placeholder={`Варіант ${optIndex + 1}`}
                                                                value={opt.text}
                                                                onChange={(e) => updateOption(q.id, opt.id, "text", e.target.value)}
                                                                className="flex-grow bg-white border border-slate-300 rounded-lg p-2 text-xs outline-none focus:ring-2 focus:ring-primary"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => triggerOptionFileUpload(q.id, opt.id)}
                                                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border flex items-center gap-1.5 ${
                                                                    opt.imageUrl
                                                                        ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                                                        : "bg-white text-slate-600 border-slate-300 hover:bg-slate-100"
                                                                }`}
                                                            >
                                                                <span>🖼️</span>
                                                                <span>{opt.imageUrl ? "Фото додано" : "Обрати фото"}</span>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeOption(q.id, opt.id)}
                                                                className="text-slate-400 hover:text-red-500 px-1.5 transition text-sm font-bold"
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                        {opt.imageUrl && (
                                                            <div className="ml-7 p-2 bg-slate-100 rounded-xl border border-slate-200 inline-flex items-center gap-3">
                                                                <img src={opt.imageUrl} alt="Варіант відповіді" className="h-14 w-14 object-cover rounded-lg border bg-white" />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => updateOption(q.id, opt.id, "imageUrl", "")}
                                                                    className="text-xs text-red-600 font-bold hover:underline"
                                                                >
                                                                    Видалити фото
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                                <button
                                                    type="button"
                                                    onClick={() => addOption(q.id)}
                                                    className="text-xs font-semibold text-primary hover:underline transition flex items-center gap-1 pt-1"
                                                >
                                                    <span>➕</span> Додати варіант відповіді
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        <button
                            type="button"
                            onClick={addQuestion}
                            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 rounded-2xl border-2 border-dashed border-slate-300 transition flex items-center justify-center gap-2 text-sm"
                        >
                            <span>➕</span> Додати нове питання
                        </button>
                    </div>

                    {/* Збереження */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="text-xs text-slate-500">
                            Всього питань: <span className="font-bold text-slate-800">{questions.length}</span> | Загальний бал:{" "}
                            <span className="font-bold text-emerald-600">{totalPoints}</span>
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="w-full md:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-5 py-2.5 rounded-xl transition text-xs"
                            >
                                Скасувати
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl transition shadow-md text-xs flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? "Збереження..." : "💾 Зберегти та опублікувати тест"}
                            </button>
                        </div>
                    </div>
                </form>
            </main>
        </div>
    );
}