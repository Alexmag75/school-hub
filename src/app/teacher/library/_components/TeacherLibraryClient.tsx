"use client";

/**
 * ==============================================================================
 * КЛІЄНТСЬКИЙ КОМПОНЕНТ БІБЛІОТЕКИ УЧИТЕЛЯ (`TeacherLibraryClient.tsx`)
 * ==============================================================================
 * @description Дозволяє вчителю переглядати, фільтрувати за предметом, додавати
 *              нові матеріали (задачники, довідники, олімпіади) та видаляти їх.
 * ==============================================================================
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Subject {
    id: string;
    title: string;
}

interface ClassItem {
    id: string;
    name: string;
}

interface Textbook {
    id: string;
    title: string;
    author: string | null;
    category: string;
    fileUrl: string;
    subjectId: string;
    classId?: string | null;
    createdAt: Date;
}

interface Props {
    subjects: Subject[];
    classes: ClassItem[];
    initialTextbooks: Textbook[];
}

const TEACHER_CATEGORY_LABELS: Record<string, string> = {
    PROBLEM_BOOK: "📙 Збірник задач / Вправи",
    DICTIONARY: "📕 Словник / Довідник",
    OLYMPIAD: "🏆 Підготовка до олімпіад",
    PUZZLE: "🧩 Цікава задача (на головну)",
    OTHER: "📁 Допоміжний матеріал",
};

const ALL_CATEGORY_LABELS: Record<string, string> = {
    TEXTBOOK: "📘 Офіційний підручник",
    ...TEACHER_CATEGORY_LABELS,
};

export default function TeacherLibraryClient({ subjects, classes = [], initialTextbooks }: Props) {
    const router = useRouter();
    const [textbooks, setTextbooks] = useState<Textbook[]>(initialTextbooks);

    // Глобальний вибір предмета для фільтрації у верхній панелі
    const [selectedSubject, setSelectedSubject] = useState<string>(subjects[0]?.id || "");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Поля форми додавання матеріалу
    const [title, setTitle] = useState("");
    const [author, setAuthor] = useState("");
    const [category, setCategory] = useState("PROBLEM_BOOK");
    const [fileUrl, setFileUrl] = useState("");
    const [description, setDescription] = useState("");
    const [selectedClassId, setSelectedClassId] = useState<string>(""); // "" означає "Для всіх"

    // Предмет конкретно для форми додавання (щоб можна було додати в інший предмет, ніж у фільтрі)
    const [formSubjectId, setFormSubjectId] = useState<string>(subjects[0]?.id || "");

    /**
     * Обробник відправки форми створення нового матеріалу
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);

        const targetSubject = formSubjectId || selectedSubject;

        if (!targetSubject) {
            setErrorMessage("Будь ласка, оберіть предмет.");
            return;
        }

        if (!title.trim() || !fileUrl.trim()) {
            setErrorMessage("Заповніть назву та посилання на файл.");
            return;
        }

        let formattedUrl = fileUrl.trim();
        if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
            formattedUrl = `https://${formattedUrl}`;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/teacher/textbooks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    author,
                    category,
                    fileUrl: formattedUrl,
                    description,
                    subjectId: targetSubject,
                    classId: selectedClassId || null,
                }),
            });

            if (res.ok) {
                const newBook = await res.json();
                setTextbooks((prev) => [newBook, ...prev]);

                // Очищення полів форми після успішного створення
                setTitle("");
                setAuthor("");
                setFileUrl("");
                setDescription("");
                setSelectedClassId("");

                router.refresh();
            } else {
                const errData = await res.json();
                setErrorMessage(errData.error || "Помилка при збереженні файлу");
            }
        } catch (err) {
            console.error(err);
            setErrorMessage("Мережева помилка. Перевірте з'єднання.");
        } finally {
            setIsSubmitting(false);
        }
    };

    /**
     * Обробник видалення матеріалу
     */
    const handleDelete = async (id: string) => {
        if (!confirm("Ви впевнені, що хочете видалити цей матеріал?")) return;

        try {
            const res = await fetch(`/api/teacher/textbooks/${id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                setTextbooks((prev) => prev.filter((item) => item.id !== id));
                router.refresh();
            } else {
                alert("Помилка при видаленні матеріалу");
            }
        } catch (err) {
            console.error(err);
            alert("Помилка мережі при видаленні");
        }
    };

    // Фільтрація матеріалів для відображення в залежності від обраного предмета у шапці
    const filteredTextbooks = textbooks.filter((b) => b.subjectId === selectedSubject);

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8">
            {/* Шапка сторінки та вибір предмету для фільтрації */}
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <Link
                        href="/teacher"
                        className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-slate-800 transition gap-1 mb-1"
                    >
                        ← Назад до панелі
                    </Link>
                    <h1 className="text-2xl font-black text-slate-900">📚 Допоміжні матеріали та задачі</h1>
                    <p className="text-sm text-slate-500">Додавання задачників, довідників, матеріалів до олімпіад та цікавих задач</p>
                </div>

                <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="px-4 py-2.5 rounded-2xl border border-slate-200 bg-white font-bold text-slate-800 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    {subjects.length === 0 ? (
                        <option value="">Немає доступних предметів</option>
                    ) : (
                        subjects.map((sub) => (
                            <option key={sub.id} value={sub.id}>
                                {sub.title}
                            </option>
                        ))
                    )}
                </select>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Форма додавання нового матеріалу */}
                <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4 lg:col-span-1">
                    <h2 className="text-lg font-bold text-slate-900 border-b pb-3">Додати матеріал</h2>

                    {errorMessage && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                            ⚠️ {errorMessage}
                        </div>
                    )}

                    {/* Вибір предмета безпосередньо у формі */}
                    <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Предмет *</label>
                        <select
                            value={formSubjectId || selectedSubject}
                            onChange={(e) => setFormSubjectId(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-800"
                        >
                            {subjects.map((sub) => (
                                <option key={sub.id} value={sub.id}>
                                    {sub.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Назва матеріалу *</label>
                        <input
                            type="text"
                            required
                            placeholder="напр. Збірник задач з фізики 9 клас"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Цільовий клас</label>
                        <select
                            value={selectedClassId}
                            onChange={(e) => setSelectedClassId(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
                        >
                            <option value="">🌐 Для всіх класів</option>
                            {classes.map((cls) => (
                                <option key={cls.id} value={cls.id}>
                                    🏫 {cls.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Категорія *</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {Object.entries(TEACHER_CATEGORY_LABELS).map(([key, label]) => (
                                <option key={key} value={key}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Автор (необов'язково)</label>
                        <input
                            type="text"
                            placeholder="напр. Ненашев І. Ю."
                            value={author}
                            onChange={(e) => setAuthor(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Посилання на файл/PDF *</label>
                        <input
                            type="text"
                            required
                            placeholder="https://drive.google.com/..."
                            value={fileUrl}
                            onChange={(e) => setFileUrl(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Опис / Умова (для задач)</label>
                        <textarea
                            rows={3}
                            placeholder="Короткий опис або умови цікавої задачі..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm transition disabled:opacity-50"
                    >
                        {isSubmitting ? "Збереження..." : "Зберегти матеріал"}
                    </button>

                    <p className="text-[11px] text-slate-400 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        ℹ️ Базові підручники з навчальної програми централізовано додаються адміністратором системи.
                    </p>
                </form>

                {/* Список матеріалів за обраним предметом */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm lg:col-span-2 space-y-4">
                    <h2 className="text-lg font-bold text-slate-900 border-b pb-3">Матеріали з предмета</h2>

                    {filteredTextbooks.length === 0 ? (
                        <p className="text-slate-400 text-sm italic py-8 text-center">В цьому предметі поки немає завантажених матеріалів.</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredTextbooks.map((item) => {
                                const targetClass = classes.find((c) => c.id === item.classId);

                                return (
                                    <div key={item.id} className="p-4 rounded-2xl border border-slate-200 hover:border-blue-300 transition space-y-2 bg-slate-50/50 flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase ${
                                                    item.category === "TEXTBOOK"
                                                        ? "bg-purple-100 text-purple-700"
                                                        : "bg-blue-100 text-blue-700"
                                                }`}>
                                                    {ALL_CATEGORY_LABELS[item.category] || item.category}
                                                </span>

                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">
                                                    {targetClass ? `🏫 ${targetClass.name}` : "🌐 Для всіх"}
                                                </span>
                                            </div>

                                            <h3 className="font-bold text-slate-900 text-base mt-2">{item.title}</h3>
                                            {item.author && <p className="text-xs text-slate-500 font-medium">Автор: {item.author}</p>}
                                        </div>

                                        <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                                            <a
                                                href={item.fileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs font-bold text-blue-600 hover:text-blue-800 transition flex items-center gap-1"
                                            >
                                                🔗 Відкрити файл
                                            </a>

                                            {/* Кнопка видалення матеріалу */}
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(item.id)}
                                                className="text-xs font-bold text-red-500 hover:text-red-700 transition"
                                            >
                                                🗑️ Видалити
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}