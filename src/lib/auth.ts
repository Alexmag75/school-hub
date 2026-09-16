import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

/**
 * ==============================================================================
 * NEXT-AUTH CONFIGURATION: authOptions
 * ==============================================================================
 * @description Центральний конфігураційний файл автентифікації та авторизації.
 *              Визначає стратегію авторизації через email/пароль, структуру JWT-токена,
 *              кастомні поля сесії (роль, ID) та правила кастомного редиректу.
 * ==============================================================================
 */
export const authOptions: AuthOptions = {
    // --------------------------------------------------------------------------
    // 1. ПРОВАЙДЕРИ АВТЕНТИФІКАЦІЇ (Authentication Providers)
    // --------------------------------------------------------------------------
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Пароль", type: "password" },
            },
            /**
             * @description Метод верифікації облікових даних користувача
             * @param credentials — Поля форми входу (email, password)
             * @returns Об'єкт користувача у разі успіху або генерує помилку
             */
            async authorize(credentials) {
                // 1.1. Перевірка наявності вхідних даних
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Введіть email та пароль");
                }

                // 1.2. Пошук користувача в БД за електронною поштою
                const user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                });

                if (!user || !user.password) {
                    throw new Error("Користувача не знайдено");
                }

                // 1.3. Порівняння введеного пароля з хешем у базі даних (bcrypt)
                const isPasswordValid = await bcrypt.compare(
                    credentials.password,
                    user.password
                );

                if (!isPasswordValid) {
                    throw new Error("Невірний пароль");
                }

                // 1.4. Повернення об'єкта користувача для запису в JWT
                return {
                    id: user.id,
                    email: user.email,
                    lastName: user.lastName,
                    role: user.role,
                };
            },
        }),
    ],

    // --------------------------------------------------------------------------
    // 2. CALLBACKS (Обробники подій та трансформації даних)
    // --------------------------------------------------------------------------
    callbacks: {
        /**
         * @description Викликається при створенні або оновленні JWT-токена.
         *              Зберігає додаткові атрибути користувача (id, role) всередині токена.
         */
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = (user as { role?: string }).role;
            }
            return token;
        },

        /**
         * @description Викликається при перевірці сесії на клієнті або сервері.
         *              Переносить атрибути з JWT-токена в об'єкт `session.user`.
         */
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
            }
            return session;
        },

        /**
         * @description Керує перенаправленням користувача після успішного входу.
         *              Забезпечує безпечний редирект на внутрішні сторінки платформи.
         */
        async redirect({ url, baseUrl }) {
            // Перенаправлення з дефолтного маршруту на панель управління
            if (url === baseUrl || url === `${baseUrl}/dashboard`) {
                return `${baseUrl}/admin/users`;
            }
            // Дозволяємо тільки внутрішні редиректи в межах одного домену
            return url.startsWith(baseUrl) ? url : baseUrl;
        },
    },

    // --------------------------------------------------------------------------
    // 3. СТОРІНКИ, СТРАТЕГІЯ СЕСІЇ ТА БЕЗПЕКА
    // --------------------------------------------------------------------------
    pages: {
        signIn: "/login", // Кастомна сторінка входу
    },
    session: {
        strategy: "jwt", // Безстанкова (stateless) сесія на основі Encrypted JWT
    },
    secret: process.env.NEXTAUTH_SECRET,
};