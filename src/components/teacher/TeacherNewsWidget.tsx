// "use client";
//
// import { useEffect, useState } from "react";
//
// interface NewsItem {
//     id: string;
//     title: string;
//     content: string;
//     imageUrl?: string | null;
//     fileUrl?: string | null;
//     fileName?: string | null;
//     createdAt: string;
//     author: { fullName: string };
// }
//
// export default function TeacherNewsWidget() {
//     const [news, setNews] = useState<NewsItem[]>([]);
//     const [loading, setLoading] = useState<boolean>(true);
//
//     useEffect(() => {
//         fetch("/api/teacher-news")
//             .then((res) => res.json())
//             .then((data) => {
//                 if (Array.isArray(data)) setNews(data);
//             })
//             .catch((err) => console.error(err))
//             .finally(() => setLoading(false));
//     }, []);
//
//     return (
//         <div className="w-full bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
//             <div className="flex items-center justify-between border-b border-slate-100 pb-3">
//                 <div>
//                     <h2 className="text-xl font-bold text-slate-800">📢 Анонси та конкурси</h2>
//                     <p className="text-xs text-slate-500">Оголошення від учителів щодо турнірів та заходів</p>
//                 </div>
//             </div>
//
//             {loading ? (
//                 <p className="text-center text-xs text-slate-400 py-6">Завантаження анонсів...</p>
//             ) : news.length === 0 ? (
//                 <p className="text-center text-xs text-slate-400 py-6">Наразі немає активних оголошень.</p>
//             ) : (
//                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                     {news.map((item) => (
//                         <div key={item.id} className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 flex flex-col justify-between space-y-3">
//                             <div className="space-y-2">
//                                 <div className="flex items-center justify-between text-[11px] text-slate-400">
//                                     <span className="font-semibold text-slate-600">{item.author.fullName}</span>
//                                     <span>{new Date(item.createdAt).toLocaleDateString()}</span>
//                                 </div>
//
//                                 <h3 className="font-bold text-sm text-slate-800">{item.title}</h3>
//
//                                 {item.imageUrl && (
//                                     <div className="rounded-lg overflow-hidden border border-slate-200 max-h-40">
//                                         <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
//                                     </div>
//                                 )}
//
//                                 <p className="text-xs text-slate-600 whitespace-pre-line line-clamp-4">
//                                     {item.content}
//                                 </p>
//                             </div>
//
//                             {item.fileUrl && (
//                                 <div className="pt-2 border-t border-slate-200/60">
//                                     <a
//                                         href={item.fileUrl}
//                                         target="_blank"
//                                         rel="noopener noreferrer"
//                                         className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline font-medium"
//                                     >
//                                         📎 {item.fileName || "Завантажити матеріал"}
//                                     </a>
//                                 </div>
//                             )}
//                         </div>
//                     ))}
//                 </div>
//             )}
//         </div>
//     );
// }