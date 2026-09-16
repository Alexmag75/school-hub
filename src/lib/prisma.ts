import { PrismaClient } from "@prisma/client";

/**
 * ==============================================================================
 * PRISMA CLIENT SINGLETON INITIALIZATION
 * ==============================================================================
 * @description Ініціалізація єдиного глобального екземпляра PrismaClient (Паттерн Singleton).
 *              Забігає створенню множинних підключень до бази даних PostgreSQL/MySQL
 *              під час гарячого перезавантаження (Hot Reloading / HMR) у режимі розробки Next.js.
 * ==============================================================================
 */

// Розширення глобального об'єкта Node.js для збереження екземпляра PrismaClient
const globalForPrisma = global as unknown as { prisma: PrismaClient };

/**
 * Глобальний екземпляр PrismaClient.
 * Якщо екземпляр уже існує в `global`, використовується він; інакше створюється новий.
 */
export const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        // Логування виконаних SQL-запитів у консоль (корисно для налагодження та оптимізації)
        log: ["query"],
    });

// У режимі розробки (development) зберігаємо екземпляр у глобальному об'єкті,
// щоб запобігти вичерпанню ліміту з'єднань БД при кожному оновленні файлів.
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;