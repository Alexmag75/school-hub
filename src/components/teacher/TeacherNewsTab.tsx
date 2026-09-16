"use client";

import { useState, useEffect, useRef } from "react";

interface NewsItem {
    id: string;
    title: string;
    content: string;
    imageUrl?: string | null;
    fileUrl?: string | null;
    fileName?: string | null;
    createdAt: string;
}

export default function TeacherNewsTab() {
    const [newsList, setNewsList] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Стан для завантаження
    const [uploadingImage, setUploadingImage] = useState(false);
    const [uploadingFile, setUploadingFile] = useState(false);

    // Поля форми
    const [editingId, setEditingId] = useState<string | null>(null);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");

    // Масиви для завантажених картинок та документів
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [fileUrls, setFileUrls] = useState<{ url: string; name: string }[]>([]);

    // Ref для точної вставки зображень у текст
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        fetchNews();
    }, []);

    const fetchNews = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/teacher-news");
            if (res.ok) {
                const data = await res.json();
                setNewsList(data);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResetForm = () => {
        setEditingId(null);
        setTitle("");
        setContent("");
        setImageUrls([]);
        setFileUrls([]);
    };

    const handleEdit = (item: NewsItem) => {
        setEditingId(item.id);
        setTitle(item.title);
        setContent(item.content);
        setImageUrls(item.imageUrl ? item.imageUrl.split(",") : []);
        setFileUrls(item.fileUrl ? [{ url: item.fileUrl, name: item.fileName || "Документ" }] : []);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Ви дійсно бажаєте видалити цю новину?")) return;

        const res = await fetch(`/api/teacher-news/${id}`, { method: "DELETE" });
        if (res.ok) {
            setNewsList((prev) => prev.filter((item) => item.id !== id));
        } else {
            alert("Не вдалося видалити новину");
        }
    };

    // Вставка Markdown-картинки в ту позицію, де стоїть курсор
    const insertImageToContent = (url: string) => {
        const markdownImage = `\n![зображення](${url})\n`;
        if (textareaRef.current) {
            const start = textareaRef.current.selectionStart;
            const end = textareaRef.current.selectionEnd;
            const newText = content.substring(0, start) + markdownImage + content.substring(end);
            setContent(newText);
        } else {
            setContent((prev) => prev + markdownImage);
        }
    };

    // Завантаження КІЛЬКОХ зображень
    const handleMultipleImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = e.target.files;
        if (!selectedFiles || selectedFiles.length === 0) return;

        setUploadingImage(true);
        const formData = new FormData();

        Array.from(selectedFiles).forEach((file) => {
            formData.append("files", file);
        });

        try {
            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                const newUrls = data.files.map((f: { url: string }) => f.url);
                setImageUrls((prev) => [...prev, ...newUrls]);
            } else {
                alert("Помилка при завантаженні зображень");
            }
        } catch {
            alert("Не вдалося завантажити зображення");
        } finally {
            setUploadingImage(false);
        }
    };

    // Завантаження КІЛЬКОХ документів
    const handleMultipleFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = e.target.files;
        if (!selectedFiles || selectedFiles.length === 0) return;

        setUploadingFile(true);
        const formData = new FormData();
        Array.from(selectedFiles).forEach((file) => {
            formData.append("files", file);
        });

        try {
            const res = await fetch("/api/upload", { method: "POST", body: formData });
            if (res.ok) {
                const data = await res.json();
                const newDocs = data.files.map((f: { url: string; originalName: string }) => ({
                    url: f.url,
                    name: f.originalName,
                }));
                setFileUrls((prev) => [...prev, ...newDocs]);
            } else {
                alert("Помилка при завантаженні документів");
            }
        } catch {
            alert("Не вдалося завантажити документи");
        } finally {
            setUploadingFile(false);
        }
    };

    const removeImage = (index: number) => {
        setImageUrls((prev) => prev.filter((_, i) => i !== index));
    };

    const removeFile = (index: number) => {
        setFileUrls((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) return;

        setSubmitting(true);
        const url = editingId ? `/api/teacher-news/${editingId}` : "/api/teacher-news";
        const method = editingId ? "PUT" : "POST";

        const combinedImageUrl = imageUrls.join(",");
        const combinedFileUrl = fileUrls.map((f) => f.url).join(",");
        const combinedFileName = fileUrls.map((f) => f.name).join(",");

        try {
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    content,
                    imageUrl: combinedImageUrl,
                    fileUrl: combinedFileUrl,
                    fileName: combinedFileName,
                }),
            });

            if (res.ok) {
                handleResetForm();
                fetchNews();
            } else {
                alert("Помилка збереження новини");
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 font-sans">
            {/* Форма створення/редагування новини */}
            <form onSubmit={handleSubmit} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <h3 className="text-base font-bold text-slate-800">
                    {editingId ? "✏️ Редагувати новину / конкурс" : "➕ Створити анонс або конкурс"}
                </h3>

                <div className="space-y-3">
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Заголовок *</label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Наприклад: Всеукраїнська олімпіада з фізики..."
                            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Опис / Текст оголошення *</label>
                        <textarea
                            ref={textareaRef}
                            required
                            rows={6}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Опишіть деталі, умови участі та дедлайни..."
                            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Блок завантаження КІЛЬКОХ картинок */}
                        <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-3">
                            <label className="block text-xs font-semibold text-slate-700">🖼️ Завантажити зображення</label>
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleMultipleImagesUpload}
                                className="block w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                            />
                            {uploadingImage && <p className="text-[11px] text-blue-600">Завантаження фото...</p>}

                            {imageUrls.length > 0 && (
                                <div className="grid grid-cols-2 gap-2 pt-1">
                                    {imageUrls.map((url, idx) => (
                                        <div key={idx} className="relative group border rounded-lg p-1.5 bg-slate-50 space-y-1">
                                            <div className="h-20 w-full overflow-hidden rounded bg-slate-100">
                                                <img src={url} alt="Завантажено" className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => insertImageToContent(url)}
                                                    className="w-full text-[10px] bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold py-1 rounded transition"
                                                    title="Додати посилання на картинку в текст"
                                                >
                                                    ➕ В текст
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(idx)}
                                                    className="bg-red-50 hover:bg-red-100 text-red-600 px-2 text-[10px] rounded font-bold border border-red-100 transition"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Блок завантаження КІЛЬКОХ документів */}
                        <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-3">
                            <label className="block text-xs font-semibold text-slate-700">📎 Документи (PDF, DOC, XLS)</label>
                            <input
                                type="file"
                                multiple
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                                onChange={handleMultipleFilesUpload}
                                className="block w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                            />
                            {uploadingFile && <p className="text-[11px] text-emerald-600">Завантаження документів...</p>}

                            {fileUrls.length > 0 && (
                                <div className="space-y-1.5 pt-1">
                                    {fileUrls.map((doc, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border text-xs">
                                            <span className="truncate max-w-[180px] text-slate-700 font-medium">📎 {doc.name}</span>
                                            <button
                                                type="button"
                                                onClick={() => removeFile(idx)}
                                                className="text-red-500 hover:text-red-700 text-xs font-bold"
                                            >
                                                Видалити
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                    <button
                        type="submit"
                        disabled={submitting || uploadingImage || uploadingFile}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition disabled:opacity-50"
                    >
                        {editingId ? "Зберегти зміни" : "Опублікувати новину"}
                    </button>
                    {editingId && (
                        <button
                            type="button"
                            onClick={handleResetForm}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl transition"
                        >
                            Скасувати
                        </button>
                    )}
                </div>
            </form>

            {/* Список опублікованих новин */}
            <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-800">📋 Опубліковані анонси</h3>
                {loading ? (
                    <p className="text-xs text-slate-400">Завантаження новин...</p>
                ) : newsList.length === 0 ? (
                    <p className="text-xs text-slate-400">Ви ще не опублікували жодної новини.</p>
                ) : (
                    <div className="space-y-3">
                        {newsList.map((item) => (
                            <div
                                key={item.id}
                                className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                            >
                                <div className="space-y-1">
                                    <span className="text-[10px] text-slate-400 font-semibold">
                                        📅 {new Date(item.createdAt).toLocaleDateString()}
                                    </span>
                                    <h4 className="font-bold text-sm text-slate-900">{item.title}</h4>
                                    <p className="text-xs text-slate-600 line-clamp-2">{item.content}</p>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        onClick={() => handleEdit(item)}
                                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-xl transition"
                                    >
                                        ✏️ Редагувати
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold px-3 py-1.5 rounded-xl transition border border-red-100"
                                    >
                                        🗑️ Видалити
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}