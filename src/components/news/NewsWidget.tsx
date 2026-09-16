"use client";

import { useState, useEffect } from "react";
import { Newspaper, ArrowRight, Calendar } from "lucide-react";
import NewsModal, { NewsItem } from "@/components/news/NewsModal";

export default function NewsWidget() {
    const [newsList, setNewsList] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

    useEffect(() => {
        async function fetchLatestNews() {
            try {
                const res = await fetch("/api/news?limit=3");
                if (res.ok) {
                    const data = await res.json();
                    setNewsList(data.news || []);
                }
            } catch (err) {
                console.error("Помилка завантаження новин:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchLatestNews();
    }, []);

    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Newspaper className="w-6 h-6 text-blue-600" />
                    <h2 className="text-xl font-bold text-slate-800">Останні новини</h2>
                </div>
                <a
                    href="/news"
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition"
                >
                    Усі новини <ArrowRight className="w-3.5 h-3.5" />
                </a>
            </div>

            {loading ? (
                <div className="py-8 text-center text-xs text-slate-400">Завантаження новин...</div>
            ) : newsList.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">Новин поки немає</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {newsList.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => setSelectedNews(item)}
                            className="group border border-slate-200 rounded-xl p-4 cursor-pointer hover:border-blue-300 hover:shadow-md transition flex flex-col justify-between bg-slate-50/50 hover:bg-white"
                        >
                            <div className="space-y-2">
                                {/* Отримуємо тільки першу картинку зі списку */}
                                {(() => {
                                    const mainImg = item.imageUrl ? item.imageUrl.split(",")[0]?.trim() : null;
                                    return mainImg ? (
                                        <img
                                            src={mainImg}
                                            alt={item.title}
                                            className="w-full h-48 object-cover rounded-xl"
                                            onError={(e) => {
                                                (e.target as HTMLElement).style.display = "none";
                                            }}
                                        />
                                    ) : null;
                                })()}
                                <span className="flex items-center gap-1 text-[11px] text-slate-400">
                  <Calendar className="w-3 h-3" />
                                    {new Date(item.createdAt).toLocaleDateString("uk-UA")}
                </span>
                                <h3 className="font-bold text-slate-800 text-sm line-clamp-2 group-hover:text-blue-600 transition">
                                    {item.title}
                                </h3>
                                <div className="text-xs text-slate-500 line-clamp-3">{(() => {
                                    const cleanContent = item.content
                                        ? item.content.replace(/!\[.*?\]\(.*?\)/g, "").trim()
                                        : "";

                                    return (
                                        <p className="text-xs text-slate-600 line-clamp-2">
                                            {cleanContent}
                                        </p>
                                    );
                                })()}</div>
                            </div>

                            <button className="mt-3 text-xs font-semibold text-blue-600 group-hover:underline text-left">
                                Читати повністю ➔
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Модальне вікно перегляду */}
            <NewsModal news={selectedNews} onClose={() => setSelectedNews(null)} />
        </div>
    );
}