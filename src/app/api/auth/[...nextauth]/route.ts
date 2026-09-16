import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * ==============================================================================
 * ROUTE: Catch-All Endpoint NextAuth (/api/auth/*)
 * ==============================================================================
 * @description Единый динамический обработчик (Catch-All Route) для библиотеки NextAuth.
 *              Автоматически перехватывает и обрабатывает все входящие HTTP-запросы,
 *              связанные с аутентификацией и сессиями пользователей.
 *
 * Автоматически обрабатываемые эндпоинты:
 * - GET/POST /api/auth/signin        — страница входа / отправка данных формы
 * - POST     /api/auth/signout       — выход из системы и очистка cookie
 * - GET      /api/auth/session       — получение текущей сессии (CSR)
 * - GET      /api/auth/csrf          — получение токена CSRF защиты
 * - GET/POST /api/auth/callback/[p]  — OAuth/Credentials колбэки от провайдеров
 * - GET      /api/auth/providers     — список активных провайдеров
 *
 * @see {@link "@/lib/auth"} — Конфигурация authOptions (CredentialsProvider, Callbacks, JWT)
 * ==============================================================================
 */

/**
 * Инициализация основного обработчика NextAuth с использованием единой конфигурации проекта.
 * Поддерживает работу как с Next.js App Router (NextRequest/Response), так и с Server Actions/RSC.
 */
const handler = NextAuth(authOptions);

/**
 * Экспорт обработчиков для HTTP-методов GET и POST в соответствии со стандартом Next.js App Router Route Handlers.
 */
export { handler as GET, handler as POST };