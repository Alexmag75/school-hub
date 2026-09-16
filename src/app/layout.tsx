/**
 * ==============================================================================
 * КОРЕНЕВИЙ МАКЕТ ДОДАТКУ (`src/app/layout.tsx`)
 * ==============================================================================
 * @description Головний серверний макет (Root Layout) для Next.js додатку.
 *              Визначає глобальні метадані сайту (заголовок, опис), підключає
 *              глобальні стилі Tailwind CSS (`globals.css`) та загортає
 *              весь деревоподібний компонент у контекст автентифікації (`AuthProvider`).
 * ==============================================================================
 */

import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ErrorBoundary } from "@/components/Error/ErrorBoundary";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getSettings } from "@/lib/getSettings";

export const metadata: Metadata = {
    title: "ОЗО Болградський Ліцей",
    description: "Освітня платформа",
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    const settings = getSettings();

    // Обчислюємо базовий розмір шрифту в пікселях
    const fontSizePx =
        settings.fontSize === "compact"
            ? "14px"
            : settings.fontSize === "large"
                ? "18px"
                : "16px";

    const primaryColor = settings.primaryColor || "#2563eb";

    return (
        <html
            lang="uk"
            style={{
                "--primary-color": primaryColor,
                fontSize: fontSizePx, // Оновлює глобальний розмір (1rem = fontSizePx)
            } as React.CSSProperties}
        >
        <body className="antialiased bg-slate-50 text-slate-900">
        <AuthProvider>
            <ErrorBoundary>
                <Header initialSettings={settings} />
                <main>{children}</main>
                <Footer />
            </ErrorBoundary>
        </AuthProvider>
        </body>
        </html>
    );
}