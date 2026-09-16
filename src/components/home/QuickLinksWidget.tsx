"use client";

import { ExternalLink, Code2, Laptop, BookOpen, Award } from "lucide-react";

const LINKS = [
    {
        title: "Scratch",
        badge: "Інформатика",
        url: "https://scratch.mit.edu/",
        icon: <Code2 className="w-4 h-4 text-orange-500" />,
    },
    {
        title: "Vascak Physics",
        badge: "Фізика",
        url: "https://www.vascak.cz/physicsanimations.php?l=uk",
        icon: <Laptop className="w-4 h-4 text-cyan-500" />,
    },
    {
        title: "Всеукраїнська школа онлайн",
        badge: "ВШО",
        url: "https://lms.e-school.net.ua/",
        icon: <BookOpen className="w-4 h-4 text-emerald-500" />,
    },
    {
        title: "На Урок",
        badge: "Тести",
        url: "https://naurok.com.ua/",
        icon: <BookOpen className="w-4 h-4 text-blue-500" />,
    },
    {
        title: "LearningApps",
        badge: "Вправи",
        url: "https://learningapps.org/",
        icon: <Laptop className="w-4 h-4 text-indigo-500" />,
    },
    {
        title: "Підготовка до НМТ",
        badge: "9–11 класи",
        url: "https://testportal.gov.ua/pidgotovka-do-nmt-2026/",
        icon: <Award className="w-4 h-4 text-amber-500" />,
    },
];

export default function SidebarQuickLinks() {
    return (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b pb-2.5 border-slate-100">
                <div className="flex items-center gap-2">
                    <span className="text-lg">🚀</span>
                    <h3 className="font-bold text-slate-800 text-sm">Корисні ресурси</h3>
                </div>
            </div>

            <div className="space-y-2">
                {LINKS.map((link, idx) => (
                    <a
                        key={idx}
                        href={link.url}
                        target={link.url.startsWith("http") ? "_blank" : "_self"}
                        rel="noopener noreferrer"
                        className="group flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-white hover:border-blue-300 hover:shadow-sm transition"
                    >
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="p-1.5 rounded-lg bg-white border border-slate-100 shadow-sm group-hover:scale-105 transition">
                                {link.icon}
                            </div>
                            <span className="font-semibold text-xs text-slate-700 group-hover:text-blue-600 transition truncate">
                {link.title}
              </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
              <span className="text-[10px] font-semibold bg-slate-200/60 text-slate-500 px-1.5 py-0.5 rounded">
                {link.badge}
              </span>
                            <ExternalLink className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition" />
                        </div>
                    </a>
                ))}
            </div>
        </div>
    );
}