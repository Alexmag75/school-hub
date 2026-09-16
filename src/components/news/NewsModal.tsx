import ReactMarkdown from "react-markdown";

export interface NewsItem {
    id: string;
    title: string;
    content: string;
    imageUrl?: string | null;
    fileUrl?: string | null;
    fileName?: string | null;
    createdAt: string;
    authorName?: string;
}

export interface NewsModalProps {
    news: NewsItem | null;
    onClose: () => void;
}

export default function NewsModal({ news, onClose }: NewsModalProps) {
    if (!news) return null;

    // 1. БЕЗПЕЧНИЙ ПАРСИНГ MAIN IMAGE (беремо тільки перше посилання до коми)
    const rawImageUrls = news.imageUrl ? news.imageUrl.split(",").map((u) => u.trim()).filter(Boolean) : [];
    const firstImage = rawImageUrls.length > 0 ? rawImageUrls[0] : null;

    // Якщо перше зображення вже є в тексті (Markdown), не дублюємо його зверху
    const isImageInContent = firstImage ? news.content.includes(firstImage) : false;
    const showHeaderImage = firstImage && !isImageInContent;

    // 2. БЕЗПЕЧНИЙ ПАРСИНГ ФАЙЛІВ
    const fileUrls = news.fileUrl ? news.fileUrl.split(",").map((u) => u.trim()).filter(Boolean) : [];
    const fileNames = news.fileName ? news.fileName.split(",").map((n) => n.trim()).filter(Boolean) : [];

    return (
        // Клік по темному фону закриває модалку
        <div
            onClick={onClose}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
        >
            {/* Зупиняємо спливання події кліку, щоб модалка не закривалася при кліку на її контент */}
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl max-w-2xl w-full flex flex-col max-h-[90vh] shadow-xl overflow-hidden"
            >
                {/* Фіксована шапка модалки */}
                <div className="flex justify-between items-center text-slate-400 text-xs font-medium border-b p-5 pb-4 bg-white sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <span>📅 {new Date(news.createdAt).toLocaleDateString()}</span>
                        {news.authorName && <span>👤 {news.authorName}</span>}
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 rounded-lg hover:bg-slate-100 transition"
                        title="Закрити"
                    >
                        ✕
                    </button>
                </div>

                {/* Прокручувана область контенту */}
                <div className="p-6 overflow-y-auto space-y-4">
                    {/* Заголовок */}
                    <h2 className="text-xl font-bold text-slate-900">{news.title}</h2>

                    {/* Головна картинка новини */}
                    {showHeaderImage && (
                        <div className="rounded-xl overflow-hidden max-h-80 bg-slate-100 border border-slate-100">
                            <img
                                src={firstImage}
                                alt={news.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    (e.target as HTMLElement).style.display = "none";
                                }}
                            />
                        </div>
                    )}

                    {/* Основний текст з підтримкою Markdown */}
                    <div className="text-sm text-slate-700 leading-relaxed space-y-3 prose max-w-none">
                        <ReactMarkdown
                            components={{
                                img: ({ node, ...props }) => (
                                    <img
                                        {...props}
                                        className="rounded-xl my-3 max-h-96 w-full object-cover border border-slate-100"
                                        alt={props.alt || "Зображення новини"}
                                    />
                                ),
                            }}
                        >
                            {news.content}
                        </ReactMarkdown>
                    </div>

                    {/* Блок завантаження окремих документів */}
                    {fileUrls.length > 0 && (
                        <div className="space-y-2 pt-4 border-t border-slate-100">
                            <p className="text-xs font-bold text-slate-600">Прикріплені документи:</p>
                            <div className="flex flex-col gap-2">
                                {fileUrls.map((url, index) => {
                                    const name = fileNames[index] || `Документ ${index + 1}`;
                                    return (
                                        <a
                                            key={index}
                                            href={url}
                                            download
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-semibold transition border border-blue-100"
                                        >
                                            <span className="truncate max-w-[80%]">📄 {name}</span>
                                            <span>📥 Завантажити</span>
                                        </a>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Нижній підвал з кнопкою закриття */}
                <div className="border-t p-4 bg-slate-50 flex justify-end rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition shadow-sm"
                    >
                        Закрити
                    </button>
                </div>
            </div>
        </div>
    );
}