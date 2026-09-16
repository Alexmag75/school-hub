"use client";

/**
 * ==============================================================================
 * КЛІЄНТСЬКА СТОРІНКА АВТОРИЗАЦІЇ (`src/app/login/page.tsx`)
 * ==============================================================================
 * @description Інтерактивна форма входу до платформи SchoolHub із підтримкою NextAuth.
 *              Забезпечує перевірку облікових даних через провайдер Credentials,
 *              отримання поточної сесії користувача та динамічний перенаправлення (маршрутизацію)
 *              залежно від призначеної ролі (`ADMIN`, `TEACHER`, `STUDENT`).
 *
 * @tech_stack Next.js App Router (Client Component), NextAuth.js, Tailwind CSS.
 * ==============================================================================
 */

import { useRouter } from "next/navigation";
import { useState } from "react";
import { signIn, getSession } from "next-auth/react";

export default function LoginPage() {
    /** Хук маршрутизатора Next.js для здійснення програмних редиректів */
    const router = useRouter();

    // --------------------------------------------------------------------------
    // СТАНЫ ФОРМИ ТА ІНДИКАТОРІВ ЗАВАНТАЖЕННЯ (LOCAL STATE)
    // --------------------------------------------------------------------------

    /** Введений Email користувача */
    const [email, setEmail] = useState("");

    /** Введений Пароль користувача */
    const [password, setPassword] = useState("");

    /** Повідомлення про помилку для відображення в UI */
    const [error, setError] = useState("");

    /** Прапорець заблокованого стану форми під час обробки запиту */
    const [loading, setLoading] = useState(false);

    /**
     * Обробник події відправки форми авторизації.
     *
     * @param {React.FormEvent} e - Подія відправки HTML-форми.
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            // 1. Авторизуємо користувача через Credentials провайдер NextAuth
            // redirect: false дозволяє уникнути автоматичного перезавантаження та самостійно керувати навігацією
            const res = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (res?.ok) {
                // 2. Отримуємо актуальні дані сесії безпосередньо після успішного входу
                const session = await getSession();
                const role = session?.user?.role;

                // 3. Розподіл користувачів та редирект за ролями
                if (role === "ADMIN") {
                    router.push("/admin");
                } else if (role === "TEACHER") {
                    router.push("/teacher");
                } else if (role === "STUDENT") {
                    router.push("/student");
                } else {
                    // Якщо роль відсутня або не розпізнана — повертаємо на головну сторінку
                    router.push("/");
                }
            } else {
                // Помилка автентифікації на стороні бекенду / сервісу провайдера
                setError("Невірний email або пароль");
                setLoading(false);
            }
        } catch (err) {
            console.error("Помилка авторизації:", err);
            setError("Сталася помилка при вході");
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
            {/* Контейнер картки авторизації */}
            <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
                <h1 className="mb-6 text-center text-2xl font-bold text-gray-800">
                    Вхід у SchoolHub
                </h1>

                {/* Баннер помилки автентифікації */}
                {error && (
                    <div className="mb-4 rounded bg-red-100 p-3 text-sm text-red-600" role="alert">
                        {error}
                    </div>
                )}

                {/* Форма аутентифікації */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Поле Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={loading}
                            className="mt-1 w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none disabled:bg-gray-50"
                            placeholder="student@schoolhub.com"
                        />
                    </div>

                    {/* Поле Пароль */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Пароль
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={loading}
                            className="mt-1 w-full rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none disabled:bg-gray-50"
                            placeholder="••••••••"
                        />
                    </div>

                    {/* Кнопка відправки форми */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-md bg-blue-600 py-2 text-white transition hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? "Вхід..." : "Увійти"}
                    </button>
                </form>
            </div>
        </div>
    );
}