"use client";

import { useEffect } from "react";

export default function GlobalError({
                                        error,
                                        reset,
                                    }: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Відправляємо серверний збій у нашу БД
        fetch("/api/admin/logs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: error.message || "Критична системна помилка (Global Error)",
                stack: error.stack,
                source: "Next.js Global Crash",
            }),
        }).catch(() => {});
    }, [error]);

    return (
        <html lang="uk">
        <body>
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 p-4 text-center">
            <h2 className="text-xl font-bold text-red-600 mb-2">Критична помилка платформи</h2>
            <p className="text-xs text-slate-600 mb-4">
                Помилку зафіксовано. Адміністратор вже працює над її усуненням.
            </p>
            <button
                onClick={() => reset()}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold"
            >
                Спробувати знову
            </button>
        </div>
        </body>
        </html>
    );
}