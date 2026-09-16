import { Role } from "@prisma/client";
import DefaultSession from "next-auth";

/**
 * ==============================================================================
 * TYPE AUGMENTATION: NextAuth Session & JWT Definitions
 * ==============================================================================
 * @description Декларація розширення системних типів бібліотеки NextAuth.
 *              Додає користувацькі поля `id` та `role` до об'єктів сесії,
 *              користувача та JWT-токена для забезпечення суворої типографізації (TypeScript)
 *              при авторизації та перевірці прав доступу (RBAC).
 * ==============================================================================
 */

declare module "next-auth" {
    /**
     * Розширення базового інтерфейсу користувача NextAuth (User)
     */
    interface User {
        /** Унікальний ідентифікатор користувача в базі даних Prisma */
        id: string;
        /** Системна роль користувача ("STUDENT" | "TEACHER" | "ADMIN") */
        role?: Role | string;
    }

    /**
     * Розширення структури сесії NextAuth (Session)
     */
    interface Session {
        user: {
            /** Унікальний ідентифікатор користувача в базі даних Prisma */
            id: string;
            /** Системна роль користувача ("STUDENT" | "TEACHER" | "ADMIN") */
            role?: Role | string;
        } & DefaultSession["user"];
    }
}

declare module "next-auth/jwt" {
    /**
     * Розширення структури JSON Web Token (JWT)
     */
    interface JWT {
        /** Унікальний ідентифікатор користувача, збережений у кодованому токені */
        id: string;
        /** Системна роль користувача для перевірки доступу на рівні Middleware / Server Actions */
        role?: Role | string;
    }
}