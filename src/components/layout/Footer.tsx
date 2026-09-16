/**
 * ==============================================================================
 * КОМПОНЕНТ ПІДВАЛУ САЙТУ (`src/components/layout/Footer.tsx`)
 * ==============================================================================
 * @description Серверний компонент нижньої панелі сайту (Footer) освітньої платформи.
 *              Містить інформацію про ліцей, швидкі посилання на ключові секції
 *              головної сторінки, контактні дані та динамічний рік для копірайту.
 * ==============================================================================
 */

import Link from "next/link";
import { School, MapPin, Globe, Trophy, Archive, Newspaper, ExternalLink, Mail, Phone } from "lucide-react";
import { getSettings } from "@/lib/getSettings";

export default function Footer() {
    // Отримуємо налаштування безпосередньо на сервері
    const settings = getSettings();

    // Витягуємо дані зі значеннями за замовчуванням на випадок відсутності полів
    const schoolName = settings?.schoolName || "ОЗО «Болградський ліцей»";
    const address = settings?.address || "м. Болград, вул. Ізмаїльська, 1а";
    const website = settings?.website || "https://myschool.best";
    const email = settings?.email || "info@myschool.best";
    const phone = settings?.phone || "+38 (000) 000-00-00";

    // Функція для видалення https:// з URL для гарного відображення тексту
    const displayWebsite = website.replace(/^https?:\/\//, '');

    return (
        <footer className="bg-slate-900 text-slate-300 font-sans mt-12 border-t border-slate-800">
            <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-10">

                {/* 1. Інформація про заклад та платформу */}
                <div className="space-y-3">
                    <h3 className="text-white font-bold text-lg flex items-center gap-2.5">
                        <School className="w-5 h-5 text-blue-400 shrink-0" />
                        <span>{schoolName}</span>
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                        Інтерактивна освітня платформа для дистанційного навчання, підготовки до олімпіад та розв'язання цікавих задач.
                    </p>
                </div>

                {/* 2. Швидкі посилання на розділи сайту */}
                <div className="space-y-3">
                    <h4 className="text-white font-semibold text-base border-b border-slate-800 pb-2">
                        Швидкі посилання
                    </h4>
                    <ul className="space-y-2.5 text-sm">
                        <li>
                            <Link
                                href="/news"
                                className="flex items-center gap-2 hover:text-blue-400 hover:translate-x-1 transition duration-200"
                            >
                                <Newspaper className="w-4 h-4 text-blue-400" />
                                <span>Новини та конкурси</span>
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="/archive"
                                className="flex items-center gap-2 hover:text-amber-400 hover:translate-x-1 transition duration-200"
                            >
                                <Archive className="w-4 h-4 text-amber-500" />
                                <span>Архів задач</span>
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="/rating"
                                className="flex items-center gap-2 hover:text-amber-400 hover:translate-x-1 transition duration-200"
                            >
                                <Trophy className="w-4 h-4 text-amber-500" />
                                <span>Рейтинг учнів</span>
                            </Link>
                        </li>
                    </ul>
                </div>

                {/* 3. Контактні дані та геолокація */}
                <div className="space-y-3">
                    <h4 className="text-white font-semibold text-base border-b border-slate-800 pb-2">
                        Контакти
                    </h4>
                    <div className="space-y-2.5 text-sm text-slate-400">
                        <p className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                            <span>{address}</span>
                        </p>

                        {/* Телефон */}
                        <p className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-green-400 shrink-0" />
                            <a href={`tel:${phone}`} className="hover:text-green-400 transition">
                                {phone}
                            </a>
                        </p>

                        {/* Пошта */}
                        <p className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                            <a href={`mailto:${email}`} className="hover:text-amber-400 transition">
                                {email}
                            </a>
                        </p>

                        {/* Сайт */}
                        <p className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-blue-400 shrink-0" />
                            <Link
                                href={website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-blue-400 underline transition flex items-center gap-1 font-medium"
                            >
                                {displayWebsite}
                                <ExternalLink className="w-3 h-3 text-slate-500" />
                            </Link>
                        </p>
                    </div>
                </div>

            </div>

            {/* Нижня стрічка з копірайтом */}
            <div className="bg-slate-950 py-5 text-center text-sm text-slate-500 border-t border-slate-800/80">
                © {new Date().getFullYear()} {schoolName}. Всі права захищені.
            </div>
        </footer>
    );
}