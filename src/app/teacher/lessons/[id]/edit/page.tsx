"use client";

/**
 * ==============================================================================
 * СТОРІНКА РЕДАГУВАННЯ УРОКУ (`src/app/teacher/lessons/[id]/edit/page.tsx`)
 * ==============================================================================
 * @description Клієнтський компонент для редагування існуючого матеріалу/уроку:
 *              1. Завантажує поточні дані уроку з API за його `id`.
 *              2. Дозволяє змінювати предмет, клас, розділ, назву, цілі та дедлайн.
 *              3. Надає повноцінний конструктор блоків контенту (текст, картинки, відео, презентації, інтерактив).
 *              4. Підтримує завантаження файлів на сервер та попередній перегляд (плєєри, зображення).
 *              5. Зберігає оновлену структуровану інформацію у форматі JSON на бекенд.
 *
 * @tech_stack Next.js App Router (Client Component), Tailwind CSS.
 * ==============================================================================
 */

import { useState, useEffect, ChangeEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { AddBlockToolbar } from "@/components/lessons/AddBlockToolbar";
import { getEmbedUrl } from "@/utils/embed";
import { BlockType, LessonBlock } from "@/types/lesson";

/** Інтерфейси для випадаючих списків (предмети, класи, розділи) */
interface SubjectItem { id: string; title: string; }
interface ClassItem { id: string; name: string; }
interface TopicItem { id: string; title: string; }

export default function EditLessonPage() {
    // --------------------------------------------------------------------------
    // 1. РОУТИНГ ТА СТАНИ КОМПОНЕНТА
    // --------------------------------------------------------------------------
    const params = useParams();
    const router = useRouter();
    const lessonId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingId, setUploadingId] = useState<string | null>(null);

    // Списки для вибору
    const [subjects, setSubjects] = useState<SubjectItem[]>([]);
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [topics, setTopics] = useState<TopicItem[]>([]);

    // Поля форми уроку
    const [title, setTitle] = useState("");
    const [selectedSubject, setSelectedSubject] = useState("");
    const [selectedClass, setSelectedClass] = useState("");
    const [selectedTopic, setSelectedTopic] = useState("");
    const [objectives, setObjectives] = useState("");
    const [homework, setHomework] = useState("");
    const [deadline, setDeadline] = useState("");
    const [blocks, setBlocks] = useState<LessonBlock[]>([]);

    // Додавання нового розділу "на льоту"
    const [newTopicTitle, setNewTopicTitle] = useState("");
    const [showAddTopic, setShowAddTopic] = useState(false);

    // --------------------------------------------------------------------------
    // 2. ІНІЦІАЛІЗАЦІЯ ТА ЗАВАНТАЖЕННЯ ДАНИХ УРОКУ
    // --------------------------------------------------------------------------
    useEffect(() => {
        if (!lessonId) return;

        async function initData() {
            try {
                setLoading(true);

                // А. Завантажуємо доступні предмети та класи вчителя
                const myDataRes = await fetch("/api/teacher/my-data");
                if (myDataRes.ok) {
                    const myData = await myDataRes.json();
                    setSubjects(myData.subjects || []);
                    setClasses(myData.classes || []);
                }

                // Б. Завантажуємо дані самого уроку
                const lessonRes = await fetch(`/api/teacher/materials/${lessonId}`);
                if (lessonRes.ok) {
                    const material = await lessonRes.json();
                    setTitle(material.title || "");
                    setSelectedSubject(material.subjectId || "");
                    setSelectedTopic(material.topicId || "");

                    // Визначаємо клас та дедлайн із прив'язок (assignments)
                    if (material.assignments?.[0]) {
                        setSelectedClass(material.assignments[0].classId || material.assignments[0].class?.id || "");
                        if (material.assignments[0].deadline) {
                            setDeadline(new Date(material.assignments[0].deadline).toISOString().split("T")[0]);
                        }
                    }

                    // Безпечний парсинг вмісту контенту (JSON або звичайний текст)
                    try {
                        const parsed = JSON.parse(material.content || "{}");
                        setObjectives(parsed.objectives || "");
                        setHomework(parsed.homework || "");
                        setBlocks(parsed.blocks || []);
                    } catch {
                        // Якщо контент це legacy-текст
                        setBlocks([{ id: `${Date.now()}-fallback`, type: "text", content: material.content || "" }]);
                    }
                }
            } catch (err) {
                console.error("Помилка завантаження даних уроку:", err);
            } finally {
                setLoading(false);
            }
        }

        initData();
    }, [lessonId]);

    // --------------------------------------------------------------------------
    // 3. ОТРИМАННЯ РОЗДІЛІВ ПРИ ЗМІНІ ПРЕДМЕТА
    // --------------------------------------------------------------------------
    useEffect(() => {
        if (!selectedSubject) return;

        async function fetchTopics() {
            const res = await fetch(`/api/teacher/topics?subjectId=${selectedSubject}`);
            if (res.ok) {
                setTopics(await res.json());
            }
        }

        fetchTopics();
    }, [selectedSubject]);

    /** Обробник зміни предмета зі скиданням обраного розділу */
    const handleSubjectChange = (subjectId: string) => {
        setSelectedSubject(subjectId);
        setSelectedTopic(""); // Скидаємо вибір розділу, щоб не було невідповідності
    };

    // --------------------------------------------------------------------------
    // 4. УПРАВЛІННЯ РОЗДІЛАМИ (TOPICS)
    // --------------------------------------------------------------------------
    const handleCreateTopic = async () => {
        if (!newTopicTitle.trim() || !selectedSubject) return;

        try {
            const res = await fetch("/api/teacher/topics", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: newTopicTitle, subjectId: selectedSubject }),
            });

            if (res.ok) {
                const createdTopic = await res.json();
                setTopics((prev) => [...prev, createdTopic]);
                setSelectedTopic(createdTopic.id);
                setNewTopicTitle("");
                setShowAddTopic(false);
            }
        } catch (err) {
            console.error("Помилка створення розділу:", err);
        }
    };

    // --------------------------------------------------------------------------
    // 5. УПРАВЛІННЯ БЛОКАМИ КОНТЕНТУ УРОКУ
    // --------------------------------------------------------------------------
    /** Додає новий блок у вказану позицію з унікальним ID */
    const addBlockAtIndex = (index: number, type: BlockType) => {
        const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const newBlock: LessonBlock = { id: uniqueId, type, content: "" };
        const updated = [...blocks];
        updated.splice(index + 1, 0, newBlock);
        setBlocks(updated);
    };

    /** Оновлює вміст конкретного блоку за його ID */
    const updateBlockContent = (id: string, content: string) => {
        setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, content } : b)));
    };

    /** Видаляє блок із масиву */
    const removeBlock = (id: string) => {
        setBlocks((prev) => prev.filter((b) => b.id !== id));
    };

    /** Обробка завантаження файлу зображення для блоку */
    const handleFileUpload = async (blockId: string, e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploadingId(blockId);
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch("/api/upload", { method: "POST", body: formData });
            if (res.ok) {
                const data = await res.json();
                updateBlockContent(blockId, data.url);
            } else {
                // Фолбек на FileReader (Base64), якщо серверне завантаження недоступне
                const reader = new FileReader();
                reader.onloadend = () => {
                    if (typeof reader.result === "string") {
                        updateBlockContent(blockId, reader.result);
                    }
                };
                reader.readAsDataURL(file);
            }
        } catch (err) {
            console.error("Помилка завантаження файлу:", err);
        } finally {
            setUploadingId(null);
        }
    };

    // --------------------------------------------------------------------------
    // 6. ЗБЕРЕЖЕННЯ ЗМІН НА СЕРВЕР
    // --------------------------------------------------------------------------
    const handleSaveChanges = async () => {
        if (!title.trim() || !selectedSubject || !selectedClass) {
            alert("Будь ласка, заповніть обов'язкові поля: назву уроку, предмет та клас");
            return;
        }

        try {
            setSaving(true);
            // Пакуємо цілі, блоки та домашку в єдиний JSON-рядок
            const fullContentJson = JSON.stringify({ objectives, blocks, homework });

            const res = await fetch(`/api/teacher/materials/${lessonId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    subjectId: selectedSubject,
                    classId: selectedClass,
                    topicId: selectedTopic || null,
                    type: "THEORY",
                    content: fullContentJson,
                    deadline: deadline || null,
                }),
            });

            if (res.ok) {
                alert("Урок успішно оновлено!");
                router.push(`/teacher/lessons/${lessonId}`);
            } else {
                alert("Помилка збереження змін на сервері");
            }
        } catch (err) {
            console.error("Помилка оновлення уроку:", err);
            alert("Не вдалося оновити урок");
        } finally {
            setSaving(false);
        }
    };

    // --------------------------------------------------------------------------
    // 7. СТАНИ ЗАВАНТАЖЕННЯ ІНТЕРФЕЙСУ
    // --------------------------------------------------------------------------
    if (loading) {
        return (
            <div className="min-h-screen flex flex-col bg-slate-50">
                <Header />
                <div className="flex-grow flex items-center justify-center text-slate-500 font-medium">
                    Завантаження конструктора редагування...
                </div>
                <Footer />
            </div>
        );
    }

    // --------------------------------------------------------------------------
    // 8. ГОЛОВНИЙ РЕНДЕР ФОРМИ РЕДАГУВАННЯ
    // --------------------------------------------------------------------------
    return (
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
            <Header />
            <main className="flex-grow max-w-4xl w-full mx-auto px-4 py-8 space-y-6">

                {/* Навігаційна панель зверху */}
                <div className="flex items-center justify-between">
                    <Link
                        href={`/teacher/lessons/${lessonId}`}
                        className="text-slate-500 hover:text-slate-800 text-sm font-semibold"
                    >
                        ← Скасувати редагування
                    </Link>
                    <span className="text-xs font-bold text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
                        ✏️ Режим редагування
                    </span>
                </div>

                {/* Основний контейнер форми */}
                <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                    <h1 className="text-2xl font-bold text-slate-900">Редагування уроку</h1>

                    {/* Вибір Предмета, Класу, Розділу */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Предмет *</label>
                            <select
                                value={selectedSubject}
                                onChange={(e) => handleSubjectChange(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-sm outline-none"
                            >
                                <option value="">Оберіть предмет</option>
                                {subjects.map((s) => (
                                    <option key={s.id} value={s.id}>{s.title}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Клас *</label>
                            <select
                                value={selectedClass}
                                onChange={(e) => setSelectedClass(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-sm outline-none"
                            >
                                <option value="">Оберіть клас</option>
                                {classes.map((c) => (
                                    <option key={c.id} value={c.id}>Клас {c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-xs font-semibold text-slate-500">Розділ</label>
                                <button
                                    type="button"
                                    onClick={() => setShowAddTopic(!showAddTopic)}
                                    className="text-xs text-blue-600 font-bold hover:underline"
                                >
                                    + Створити
                                </button>
                            </div>
                            <select
                                value={selectedTopic}
                                onChange={(e) => setSelectedTopic(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-sm outline-none"
                            >
                                <option value="">Без розділу</option>
                                {topics.map((t) => (
                                    <option key={t.id} value={t.id}>{t.title}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Інпут створення нового розділу */}
                    {showAddTopic && (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex gap-2">
                            <input
                                type="text"
                                placeholder="Назва нового розділу..."
                                value={newTopicTitle}
                                onChange={(e) => setNewTopicTitle(e.target.value)}
                                className="flex-grow bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-sm outline-none"
                            />
                            <button
                                type="button"
                                onClick={handleCreateTopic}
                                className="bg-blue-600 text-white font-bold text-xs px-4 py-2 rounded-xl"
                            >
                                Зберегти
                            </button>
                        </div>
                    )}

                    {/* Назва уроку (Тема) */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Тема уроку *</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Цілі та задачі уроку */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">🎯 Цілі та задачі уроку</label>
                        <textarea
                            rows={2}
                            value={objectives}
                            onChange={(e) => setObjectives(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <hr className="border-slate-100" />

                    {/* Конструктор блоків контенту */}
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-slate-800 mb-2">📚 Контент уроку</label>

                        {/* Кнопка додавання на самий початок */}
                        <AddBlockToolbar insertIndex={-1} onAddBlock={addBlockAtIndex} />

                        {blocks.map((block, index) => {
                            const embedUrl = getEmbedUrl(block.type, block.content);
                            return (
                                <div key={block.id} className="space-y-2">
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 relative">

                                        {/* Заголовок блоку та кнопка видалення */}
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                                {block.type === "text" && "📝 Текстовий блок"}
                                                {block.type === "image" && "🖼️ Зображення"}
                                                {block.type === "video" && "🎬 Відео"}
                                                {block.type === "presentation" && "📊 Презентація"}
                                                {block.type === "interactive" && "🧩 Інтерактив (Scratch / LearningApps / Vascak)"}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => removeBlock(block.id)}
                                                className="text-xs text-red-500 font-bold hover:underline"
                                            >
                                                Видалити блок
                                            </button>
                                        </div>

                                        {/* 1. Поле для тексту */}
                                        {block.type === "text" && (
                                            <textarea
                                                rows={4}
                                                value={block.content}
                                                onChange={(e) => updateBlockContent(block.id, e.target.value)}
                                                className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="Введіть текст матеріалу..."
                                            />
                                        )}

                                        {/* 2. Поле для зображень (файл + URL) */}
                                        {block.type === "image" && (
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <label className="cursor-pointer bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold text-xs px-4 py-2.5 rounded-xl border border-blue-200 transition">
                                                        {uploadingId === block.id ? "Завантаження..." : "Виберіть файл"}
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="hidden"
                                                            onChange={(e) => handleFileUpload(block.id, e)}
                                                        />
                                                    </label>
                                                    <span className="text-xs text-slate-400">
                                                        {block.content && !block.content.startsWith("http") ? "Файл обрано" : "Файл не обрано"}
                                                    </span>
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="Або вставте посилання на зображення (URL)..."
                                                    value={block.content}
                                                    onChange={(e) => updateBlockContent(block.id, e.target.value)}
                                                    className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                                                />
                                            </div>
                                        )}

                                        {/* 3. Поле для медіа та інтерактиву (Video, Presentation, Interactive) */}
                                        {(block.type === "video" || block.type === "presentation" || block.type === "interactive") && (
                                            <input
                                                type="text"
                                                placeholder={
                                                    block.type === "video"
                                                        ? "Вставте посилання на YouTube або Google Drive..."
                                                        : block.type === "presentation"
                                                            ? "Вставте посилання (Google Slides, PowerPoint, Canva, Prezi)..."
                                                            : "Вставте посилання на Scratch / LearningApps / Vascak..."
                                                }
                                                value={block.content}
                                                onChange={(e) => updateBlockContent(block.id, e.target.value)}
                                                className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                                            />
                                        )}

                                        {/* Блок попереднього перегляду (Прев'ю) */}
                                        {block.content.trim() !== "" && block.type !== "text" && (
                                            <div className="mt-2 pt-2 border-t border-slate-200/60">
                                                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">Прев'ю:</span>
                                                {block.type === "image" && (
                                                    <div className="relative max-h-64 rounded-xl overflow-hidden border border-slate-200 bg-white flex justify-center">
                                                        <img
                                                            src={block.content}
                                                            alt="Прев'ю зображення"
                                                            className="object-contain max-h-64 w-auto rounded-lg"
                                                            onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                                                        />
                                                    </div>
                                                )}
                                                {(block.type === "video" || block.type === "presentation" || block.type === "interactive") && embedUrl && (
                                                    <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-slate-200 bg-black">
                                                        <iframe
                                                            src={embedUrl}
                                                            className="w-full h-full border-0"
                                                            allowFullScreen
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Панель додавання наступного блоку нижче */}
                                    <AddBlockToolbar insertIndex={index} onAddBlock={addBlockAtIndex} />
                                </div>
                            );
                        })}

                        {blocks.length === 0 && (
                            <div className="text-center py-8 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-2xl">
                                Урок поки що не містить блоків. Скористайтеся панеллю вище, щоб додати перший блок.
                            </div>
                        )}
                    </div>

                    <hr className="border-slate-100" />

                    {/* Домашнє завдання та дедлайн */}
                    <div className="space-y-3">
                        <label className="block text-sm font-bold text-slate-800">📝 Домашнє завдання</label>
                        <textarea
                            rows={3}
                            value={homework}
                            onChange={(e) => setHomework(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Дедлайн здачі</label>
                            <input
                                type="date"
                                value={deadline}
                                onChange={(e) => setDeadline(e.target.value)}
                                className="bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs outline-none"
                            />
                        </div>
                    </div>

                    {/* Кнопка збереження */}
                    <div className="pt-4 flex justify-end">
                        <button
                            type="button"
                            onClick={handleSaveChanges}
                            disabled={saving}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md transition disabled:opacity-50"
                        >
                            {saving ? "Збереження..." : "💾 Зберегти зміни"}
                        </button>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}