/**
 * ==============================================================================
 * ГОЛОВНА СТОРІНКА ПЛАТФОРМИ (`src/app/page.tsx`)
 * ==============================================================================
 */

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import TopStudentsWidget from "@/components/home/TopStudentsWidget";
import DailyTaskWidget from "@/components/home/DailyTaskWidget";
import NewsWidget from "@/components/news/NewsWidget";


export default function HomePage() {
  return (
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans">

        <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-8 space-y-6">

          {/* 1. HERO СЕКЦІЯ (Вітальний блок) */}
          <section className="bg-gradient-to-r from-blue-900 via-blue-800 to-slate-900 text-white rounded-2xl p-8 md:p-12 shadow-xl relative overflow-hidden">
            <div className="relative z-10 max-w-2xl space-y-4">
              <span className="bg-blue-500/20 text-blue-200 border border-blue-400/30 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                Освітня платформа
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                Шановні відвідувачі!
              </h2>
              <p className="text-slate-200 text-sm md:text-base leading-relaxed">
                Ласкаво просимо до нашої інтерактивної системи! Тут ви можете проходити уроки, розв&apos;язувати цікаві інтелектуальні задачі, готуватися до олімпіад та змагатися за перші місця в рейтингу ліцею.
              </p>
              <div className="pt-2 flex flex-wrap gap-3">
                {/*<Link*/}
                {/*    href="#tasks"*/}
                {/*    className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-5 py-2.5 rounded-xl shadow-md transition"*/}
                {/*>*/}
                {/*  💡 Розв&apos;язати задачу дня*/}
                {/*</Link>*/}
                {/*<Link*/}
                {/*    href="#olympiads"*/}
                {/*    className="bg-white/10 hover:bg-white/20 text-white text-sm font-medium px-5 py-2.5 rounded-xl backdrop-blur-sm border border-white/20 transition"*/}
                {/*>*/}
                {/*  🏆 Олімпіади*/}
                {/*</Link>*/}
              </div>
            </div>
          </section>

          {/* 2. ТОП УЧНІВ (Рейтинг активності та балів) */}
          <TopStudentsWidget />

          {/* 3. ЦІКАВІ ЗАДАЧІ (Інтерактивна задача дня з гілкою коментарів) */}
          <DailyTaskWidget />

          {/* 4. ВІДЖЕТ ОСТАННІХ НОВИН СТАЙЛІЗОВАНИЙ З МОДАЛКОЮ ТА ПОСИЛАННЯМ НА ВСІ НОВИНИ */}
          <NewsWidget />
        </main>
      </div>
  );
}