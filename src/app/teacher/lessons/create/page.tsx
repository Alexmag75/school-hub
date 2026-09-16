"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { AddBlockToolbar } from "@/components/lessons/AddBlockToolbar";
import { getEmbedUrl } from "@/utils/embed";
import {BlockType, LessonBlock} from "@/types/lesson";

interface ClassItem { id: string; name: string; }
interface SubjectItem { id: string; title: string; }
interface TopicItem { id: string; title: string; }

export default function LessonBuilderPage() {
    const router = useRouter();

    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [subjects, setSubjects] = useState<SubjectItem[]>([]);
    const [topics, setTopics] = useState<TopicItem[]>([]);

    const [selectedClassId, setSelectedClassId] = useState("");
    const [selectedSubjectId, setSelectedSubjectId] = useState("");
    const [selectedTopicId, setSelectedTopicId] = useState("");
    const [newTopicTitle, setNewTopicTitle] = useState("");
    const [isAddingNewTopic, setIsAddingNewTopic] = useState(false);

    const [title, setTitle] = useState("");
    const [objectives, setObjectives] = useState("");
    const [homework, setHomework] = useState("");
    const [deadline, setDeadline] = useState("");

    const [blocks, setBlocks] = useState<LessonBlock[]>([
        { id: "1", type: "text", content: "" }
    ]);
    const [saving, setSaving] = useState(false);
    const [uploadingImage, setUploadingImage] = useState<string | null>(null);

    useEffect(() => {
        async function initData() {
            const res = await fetch("/api/teacher/my-data");
            if (res.ok) {
                const data = await res.json();
                setClasses(data.classes || []);
                setSubjects(data.subjects || []);
                if (data.classes?.length) setSelectedClassId(data.classes[0].id);
                if (data.subjects?.length) setSelectedSubjectId(data.subjects[0].id);
            }
        }
        initData();
    }, []);

    useEffect(() => {
        if (!selectedSubjectId) return;
        async function fetchTopics() {
            const res = await fetch(`/api/teacher/topics?subjectId=${selectedSubjectId}`);
            if (res.ok) {
                const data = await res.json();
                setTopics(data);
                if (data.length > 0) setSelectedTopicId(data[0].id);
                else setSelectedTopicId("");
            }
        }
        fetchTopics();
    }, [selectedSubjectId]);

    const handleCreateTopic = async () => {
        if (!newTopicTitle.trim()) return;
        const res = await fetch("/api/teacher/topics", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: newTopicTitle, subjectId: selectedSubjectId })
        });
        if (res.ok) {
            const created = await res.json();
            setTopics([...topics, created]);
            setSelectedTopicId(created.id);
            setNewTopicTitle("");
            setIsAddingNewTopic(false);
        }
    };

    const addBlockAtIndex = (index: number, type: BlockType) => {
        const newBlock: LessonBlock = { id: Date.now().toString(), type, content: "" };
        const updated = [...blocks];
        updated.splice(index + 1, 0, newBlock);
        setBlocks(updated);
    };

    const removeBlock = (id: string) => {
        setBlocks(blocks.filter(b => b.id !== id));
    };

    const updateBlock = (id: string, field: keyof LessonBlock, value: string) => {
        setBlocks(blocks.map(b => b.id === id ? { ...b, [field]: value } : b));
    };

    const handleImageUpload = async (blockId: string, file: File) => {
        if (file.size > 1 * 1024 * 1024) {
            alert("Файл занадто великий! Максимальний розмір — 1 МБ.");
            return;
        }
        setUploadingImage(blockId);
        const formData = new FormData();
        formData.append("file", file);
        try {
            const res = await fetch("/api/upload", { method: "POST", body: formData });
            const data = await res.json();
            if (res.ok) {
                updateBlock(blockId, "content", data.url);
            } else {
                alert(data.error || "Помилка завантаження фото");
            }
        } catch {
            alert("Не вдалося завантажити зображення");
        } finally {
            setUploadingImage(null);
        }
    };

    const handleSaveLesson = async () => {
        if (!title.trim() || !selectedClassId || !selectedSubjectId) {
            alert("Будь ласка, заповніть тему уроку, клас та предмет!");
            return;
        }
        setSaving(true);
        const lessonPayload = {
            title,
            subjectId: selectedSubjectId,
            classId: selectedClassId,
            topicId: selectedTopicId || null,
            type: "THEORY",
            deadline: deadline || null,
            content: JSON.stringify({ objectives, blocks, homework })
        };
        try {
            const res = await fetch("/api/teacher/materials", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(lessonPayload)
            });
            if (res.ok) {
                router.push("/teacher");
            } else {
                alert("Помилка при збереженні уроку");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
            <main className="flex-grow max-w-5xl w-full mx-auto px-4 py-8 space-y-6">
                <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">🛠️ Конструктор уроку</h1>
                        <p className="text-slate-500 text-sm">Складіть урок із текстом, зображеннями, відео, презентаціями та вправами</p>
                    </div>
                    <button
                        onClick={handleSaveLesson}
                        disabled={saving}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-md transition disabled:opacity-50"
                    >
                        {saving ? "Збереження..." : "Зберегти урок"}
                    </button>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <h2 className="font-bold text-slate-800 text-lg">1. Загальна інформація</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Предмет</label>
                            <select
                                value={selectedSubjectId}
                                onChange={e => setSelectedSubjectId(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {subjects.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Клас</label>
                            <select
                                value={selectedClassId}
                                onChange={e => setSelectedClassId(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {classes.map(c => <option key={c.id} value={c.id}>Клас {c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Тип уроку</label>
                            <div className="w-full bg-blue-50 border border-blue-200 text-blue-800 rounded-xl p-2.5 font-bold text-xs">
                                📖 Навчальний урок (Теорія)
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Розділ курсу</label>
                        {!isAddingNewTopic ? (
                            <div className="flex gap-2">
                                <select
                                    value={selectedTopicId}
                                    onChange={e => setSelectedTopicId(e.target.value)}
                                    className="flex-grow bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium outline-none"
                                >
                                    <option value="">-- Без розділу --</option>
                                    {topics.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                                </select>
                                <button
                                    type="button"
                                    onClick={() => setIsAddingNewTopic(true)}
                                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 rounded-xl text-xs"
                                >
                                    + Новий розділ
                                </button>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Введіть назву нового розділу"
                                    value={newTopicTitle}
                                    onChange={e => setNewTopicTitle(e.target.value)}
                                    className="flex-grow border border-slate-300 rounded-xl p-2.5 outline-none text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={handleCreateTopic}
                                    className="bg-blue-600 text-white font-semibold px-4 rounded-xl text-xs"
                                >
                                    Зберегти
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsAddingNewTopic(false)}
                                    className="bg-slate-200 text-slate-600 px-3 rounded-xl text-xs"
                                >
                                    Скасувати
                                </button>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Тема уроку *</label>
                        <input
                            type="text"
                            required
                            placeholder="Наприклад: Другий закон Ньютона..."
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full border border-slate-300 rounded-xl p-3 font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Цілі та задачі уроку</label>
                        <textarea
                            rows={2}
                            placeholder="Сформулюйте, що учні мають дізнатися..."
                            value={objectives}
                            onChange={e => setObjectives(e.target.value)}
                            className="w-full border border-slate-300 rounded-xl p-2.5 text-sm outline-none"
                        />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <h2 className="font-bold text-slate-800 text-lg">2. Зміст уроку (Блоки)</h2>
                    <div className="space-y-2">
                        <AddBlockToolbar insertIndex={-1} onAddBlock={addBlockAtIndex} />
                        {blocks.map((block, index) => {
                            const embedUrl = getEmbedUrl(block.type, block.content);
                            return (
                                <div key={block.id} className="space-y-2">
                                    <div className="p-4 border border-slate-200 rounded-2xl bg-slate-50/60 space-y-3 relative group">
                                        <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            <span>
                                                {block.type === "text" && "📝 Текстовий блок"}
                                                {block.type === "image" && "🖼️ Зображення"}
                                                {block.type === "video" && "🎥 Відео (YouTube / Google Drive)"}
                                                {block.type === "presentation" && "📊 Презентація (Google Slides / PowerPoint)"}
                                                {block.type === "interactive" && "🧩 Інтерактив (Scratch / LearningApps / Vascak)"}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => removeBlock(block.id)}
                                                className="text-red-500 hover:text-red-700 font-bold"
                                            >
                                                Видалити блок ✕
                                            </button>
                                        </div>

                                        {block.type === "text" && (
                                            <textarea
                                                rows={4}
                                                placeholder="Введіть текст конспекту..."
                                                value={block.content}
                                                onChange={e => updateBlock(block.id, "content", e.target.value)}
                                                className="w-full border border-slate-300 rounded-xl p-3 text-sm outline-none bg-white focus:ring-2 focus:ring-blue-500"
                                            />
                                        )}

                                        {block.type === "image" && (
                                            <div className="space-y-2">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={e => e.target.files?.[0] && handleImageUpload(block.id, e.target.files[0])}
                                                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                                />
                                                <input
                                                    type="text"
                                                    placeholder="Або вставте посилання на зображення (URL)..."
                                                    value={block.content}
                                                    onChange={e => updateBlock(block.id, "content", e.target.value)}
                                                    className="w-full border border-slate-300 rounded-xl p-2.5 text-xs font-mono outline-none bg-white"
                                                />
                                                {uploadingImage === block.id && <p className="text-xs text-blue-600">Завантаження зображення...</p>}
                                            </div>
                                        )}

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
                                                onChange={(e) => updateBlock(block.id, "content", e.target.value)}
                                                className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
                                            />
                                        )}

                                        {block.content.trim() !== "" && block.type !== "text" && (
                                            <div className="mt-2 pt-2 border-t border-slate-200">
                                                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">Прев'ю:</span>
                                                {block.type === "image" && (
                                                    <div className="relative max-h-64 rounded-xl overflow-hidden border border-slate-200 bg-white flex justify-center">
                                                        <img
                                                            src={block.content}
                                                            alt="Прев'ю"
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
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <h2 className="font-bold text-slate-800 text-lg">3. Домашнє завдання та дедлайн</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Завдання для учнів</label>
                            <textarea
                                rows={3}
                                placeholder="Опишіть завдання, які учні мають виконати дома..."
                                value={homework}
                                onChange={e => setHomework(e.target.value)}
                                className="w-full border border-slate-300 rounded-xl p-2.5 text-sm outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Кінцевий термін (Дедлайн)</label>
                            <input
                                type="date"
                                value={deadline}
                                onChange={e => setDeadline(e.target.value)}
                                className="w-full border border-slate-300 rounded-xl p-2.5 text-sm outline-none"
                            />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}