"use client";

/**
 * ==============================================================================
 * КЛІЄНТСЬКИЙ КОМПОНЕНТ УПРАВЛІННЯ ПІДРУЧНИКАМИ (`AdminTextbooksClient.tsx`)
 * ==============================================================================
 * @description Інтерфейс адміністратора для додавання, фільтрації та видалення
 *              підручників з підтримкою прив'язки до предметів, окремих класів
 *              або цілих паралелей.
 *
 * @tech_stack Next.js App Router, React (useState, useMemo), Tailwind CSS.
 * ==============================================================================
 */

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// --------------------------------------------------------------------------
// ТИПІЗАЦІЯ ДАНИХ (INTERFACES)
// --------------------------------------------------------------------------

/** Модель навчального предмета */
interface Subject {
    id: string;
    title: string;
}

/** Модель навчального класу */
interface ClassItem {
    id: string;
    name: string;
}

/** Модель підручника */
interface Textbook {
    id: string;
    title: string;
    author: string | null;
    category: string;
    fileUrl: string;
    subjectId: string;
    classes?: ClassItem[];
    createdAt: Date;
}

/** Вхідні пропси клієнтського компонента */
interface Props {
    subjects: Subject[];
    classes: ClassItem[];
    initialTextbooks: Textbook[];
}

export default function AdminTextbooksClient({
                                                 subjects = [],
                                                 classes = [],
                                                 initialTextbooks = [],
                                             }: Props) {
    const router = useRouter();

    // --------------------------------------------------------------------------
    // ЛОКАЛЬНИЙ СТАН (LOCAL STATE)
    // --------------------------------------------------------------------------

    /** Список підручників у пам'яті клієнта */
    const [textbooks, setTextbooks] = useState<Textbook[]>(initialTextbooks);

    /** Прапорець процесів відправки форми */
    const [isSubmitting, setIsSubmitting] = useState(false);

    /** Повідомлення про помилки дій */
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Поля форми створення
    const [title, setTitle] = useState("");
    const [author, setAuthor] = useState("");
    const [fileUrl, setFileUrl] = useState("");
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || "");
    const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);

    // Стан фільтрів списку
    const [searchQuery, setSearchQuery] = useState("");
    const [filterSubjectId, setFilterSubjectId] = useState<string>("ALL");
    const [filterClassId, setFilterClassId] = useState<string>("ALL");

    // --------------------------------------------------------------------------
    // ДОПОМІЖНІ МЕТОДИ ВИБОРУ КЛАСІВ
    // --------------------------------------------------------------------------

    /**
     * Інверсія вибору одного конкретного класу
     */
    const toggleClass = (id: string) => {
        setSelectedClassIds((prev) =>
            prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
        );
    };

    /**
     * Масовий вибір/скидання класів для цілої паралелі (наприклад, усіх 9-х класів)
     */
    const toggleGrade = (gradeNum: string) => {
        const gradeClassIds = classes
            .filter((c) => c.name.startsWith(gradeNum))
            .map((c) => c.id);

        const allSelected = gradeClassIds.every((id) => selectedClassIds.includes(id));

        if (allSelected) {
            setSelectedClassIds((prev) => prev.filter((id) => !gradeClassIds.includes(id)));
        } else {
            setSelectedClassIds((prev) => Array.from(new Set([...prev, ...gradeClassIds])));
        }
    };

    /**
     * Список унікальних номерів паралелей (5, 6, ..., 11), відсортований за зростанням
     */
    const grades = useMemo(() => {
        const nums = classes.map((c) => c.name.replace(/[^0-9]/g, "")).filter(Boolean);
        return Array.from(new Set(nums)).sort((a, b) => Number(a) - Number(b));
    }, [classes]);

    // --------------------------------------------------------------------------
    // ОБРОБНИКИ ПОДІЙ (HANDLERS)
    // --------------------------------------------------------------------------

    /**
     * Відправка форми додавання нового підручника
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);

        if (!selectedSubjectId) {
            setErrorMessage("Оберіть предмет.");
            return;
        }

        if (!title.trim() || !fileUrl.trim()) {
            setErrorMessage("Заповніть назву та посилання.");
            return;
        }

        // Автоматичне додавання протоколу https:// при відсутності
        let formattedUrl = fileUrl.trim();
        if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
            formattedUrl = `https://${formattedUrl}`;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/admin/textbooks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    author,
                    category: "TEXTBOOK",
                    fileUrl: formattedUrl,
                    subjectId: selectedSubjectId,
                    classIds: selectedClassIds,
                }),
            });

            if (res.ok) {
                const newBook = await res.json();
                setTextbooks((prev) => [newBook, ...prev]);

                // Очищення полів форми
                setTitle("");
                setAuthor("");
                setFileUrl("");
                setSelectedClassIds([]);
                router.refresh();
            } else {
                const errData = await res.json();
                setErrorMessage(errData.error || "Помилка збереження");
            }
        } catch (err) {
            console.error(err);
            setErrorMessage("Мережева помилка");
        } finally {
            setIsSubmitting(false);
        }
    };

    /**
     * Видалення підручника за його ідентифікатором
     */
    const handleDelete = async (id: string) => {
        if (!confirm("Видалити підручник?")) return;
        try {
            const res = await fetch(`/api/admin/textbooks/${id}`, { method: "DELETE" });
            if (res.ok) {
                setTextbooks((prev) => prev.filter((b) => b.id !== id));
                router.refresh();
            }
        } catch (err) {
            console.error(err);
        }
    };

    // --------------------------------------------------------------------------
    // КЕШОВАНІ ОБЧИСЛЕННЯ (MEMOIZED COMPUTATIONS)
    // --------------------------------------------------------------------------

    /**
     * Відфільтрований список підручників відповідно до обраних критеріїв
     */
    const filteredTextbooks = useMemo(() => {
        return textbooks.filter((book) => {
            // Фільтрація за пошуковим запитом (назва / автор)
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                if (!book.title.toLowerCase().includes(q) && !book.author?.toLowerCase().includes(q)) {
                    return false;
                }
            }

            // Фільтрація за предметом
            if (filterSubjectId !== "ALL" && book.subjectId !== filterSubjectId) {
                return false;
            }

            // Фільтрація за класом або паралеллю
            if (filterClassId !== "ALL") {
                if (filterClassId.startsWith("GRADE_")) {
                    const targetGrade = filterClassId.replace("GRADE_", "");
                    const hasGradeClass = book.classes?.some(
                        (c) => c.name.replace(/[^0-9]/g, "") === targetGrade
                    );
                    if (!hasGradeClass) return false;
                } else {
                    const hasExactClass = book.classes?.some((c) => c.id === filterClassId);
                    if (!hasExactClass) return false;
                }
            }

            return true;
        });
    }, [textbooks, searchQuery, filterSubjectId, filterClassId]);

    /** Словник підставлення назв предметів за їх ID */
    const subjectMap = useMemo(() => new Map(subjects.map((s) => [s.id, s.title])), [subjects]);

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-8">
            {/* ШАПКА ТА НАВІГАЦІЯ */}
            <header>
                <Link href="/admin" className="text-xs font-bold text-slate-500 hover:text-slate-800 transition">
                    ← Повернутися до адмін-панелі
                </Link>
                <h1 className="text-2xl font-black text-slate-900 mt-1">📚 Управління підручниками</h1>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* ФОРМА ДОДАВАННЯ ПІДРУЧНИКА */}
                <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4 lg:col-span-1 h-fit">
                    <h2 className="text-lg font-bold text-slate-900 border-b pb-3">Додати новий підручник</h2>

                    {errorMessage && (
                        <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl" role="alert">
                            {errorMessage}
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Назва підручника *</label>
                        <input
                            type="text"
                            required
                            placeholder="напр. Інформатика 9 клас"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Предмет *</label>
                        <select
                            value={selectedSubjectId}
                            onChange={(e) => setSelectedSubjectId(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
                        >
                            {subjects.map((sub) => (
                                <option key={sub.id} value={sub.id}>
                                    📖 {sub.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* ВИБІР ЦІЛЬОВИХ КЛАСІВ/ПАРАЛЕЛЕЙ */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="block text-xs font-bold text-slate-600 uppercase">Цільові класи</label>
                            {selectedClassIds.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setSelectedClassIds([])}
                                    className="text-[10px] text-rose-500 font-bold hover:underline"
                                >
                                    Скинути вибір
                                </button>
                            )}
                        </div>

                        {/* Швидкі кнопки вибору паралелей */}
                        <div className="flex flex-wrap gap-1 mb-2">
                            {grades.map((g) => (
                                <button
                                    key={g}
                                    type="button"
                                    onClick={() => toggleGrade(g)}
                                    className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-purple-100 hover:text-purple-700 text-slate-600 transition"
                                >
                                    Усі {g}-ті
                                </button>
                            ))}
                        </div>

                        {/* Список чекбоксів конкретних класів */}
                        <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50/50 space-y-1">
                            {classes.length === 0 ? (
                                <p className="text-xs text-slate-400">Класи відсутні</p>
                            ) : (
                                classes.map((cls) => (
                                    <label
                                        key={cls.id}
                                        className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white text-xs font-medium text-slate-700 cursor-pointer transition"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedClassIds.includes(cls.id)}
                                            onChange={() => toggleClass(cls.id)}
                                            className="rounded text-purple-600 focus:ring-purple-500"
                                        />
                                        <span>🏫 {cls.name}</span>
                                    </label>
                                ))
                            )}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                            {selectedClassIds.length === 0
                                ? "🌐 Якщо нічого не обрано — підручник для всіх класів"
                                : `Обрано класів: ${selectedClassIds.length}`}
                        </p>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Автор(и)</label>
                        <input
                            type="text"
                            placeholder="напр. Морзе Н. В."
                            value={author}
                            onChange={(e) => setAuthor(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Посилання на файл (PDF) *</label>
                        <input
                            type="text"
                            required
                            placeholder="https://drive.google.com/..."
                            value={fileUrl}
                            onChange={(e) => setFileUrl(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-sm transition disabled:opacity-50"
                    >
                        {isSubmitting ? "Збереження..." : "Додати підручник"}
                    </button>
                </form>

                {/* ПРАВА ПАНЕЛЬ СТИЛЬОВАНОГО СПИСКУ ТА ФІЛЬТРИ */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm lg:col-span-2 space-y-5">
                    <div className="flex items-center justify-between border-b pb-4">
                        <h2 className="text-lg font-bold text-slate-900">Список підручників</h2>
                        <span className="text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-xl">
                            Знайдено: {filteredTextbooks.length}
                        </span>
                    </div>

                    {/* Блок фільтрів */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <input
                            type="text"
                            placeholder="🔍 Пошук..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />

                        <select
                            value={filterSubjectId}
                            onChange={(e) => setFilterSubjectId(e.target.value)}
                            className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-medium text-slate-700 focus:outline-none"
                        >
                            <option value="ALL">📖 Усі предмети</option>
                            {subjects.map((sub) => (
                                <option key={sub.id} value={sub.id}>
                                    {sub.title}
                                </option>
                            ))}
                        </select>

                        <select
                            value={filterClassId}
                            onChange={(e) => setFilterClassId(e.target.value)}
                            className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-medium text-slate-700 focus:outline-none"
                        >
                            <option value="ALL">🏫 Усі класи</option>
                            {grades.map((g) => (
                                <option key={`GRADE_${g}`} value={`GRADE_${g}`}>
                                    📚 Усі {g}-ті класи
                                </option>
                            ))}

                            <option disabled className="bg-slate-100 font-bold">──────────</option>

                            {classes.map((cls) => (
                                <option key={cls.id} value={cls.id}>
                                    🏫 {cls.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Картки підручників */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredTextbooks.map((item) => {
                            const subjectName = subjectMap.get(item.subjectId) || "Предмет";

                            return (
                                <div
                                    key={item.id}
                                    className="p-4 rounded-2xl border border-slate-200 hover:border-purple-300 transition bg-slate-50/50 flex flex-col justify-between space-y-3"
                                >
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase bg-purple-100 text-purple-700">
                                                📘 {subjectName}
                                            </span>

                                            {!item.classes || item.classes.length === 0 ? (
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">
                                                    🌐 Для всіх
                                                </span>
                                            ) : (
                                                item.classes.map((c) => (
                                                    <span
                                                        key={c.id}
                                                        className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800"
                                                    >
                                                        🏫 {c.name}
                                                    </span>
                                                ))
                                            )}
                                        </div>

                                        <h3 className="font-bold text-slate-900 text-base leading-snug">{item.title}</h3>
                                        {item.author && <p className="text-xs text-slate-500 font-medium">Автор: {item.author}</p>}
                                    </div>

                                    {/* Кнопки перегляду та видалення */}
                                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                                        <a
                                            href={item.fileUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs font-bold text-purple-600 hover:text-purple-800 transition flex items-center gap-1"
                                        >
                                            🔗 Відкрити файл
                                        </a>

                                        <button
                                            type="button"
                                            onClick={() => handleDelete(item.id)}
                                            className="text-xs font-bold text-rose-500 hover:text-rose-700 transition flex items-center gap-1"
                                        >
                                            🗑️ Видалити
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>
        </div>
    );
}