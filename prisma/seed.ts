import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    const hashedPassword = await bcrypt.hash("student123", 10);
    const adminPassword = await bcrypt.hash("admin123", 10);

    // 1. Створення Адміністратора
    const admin = await prisma.user.upsert({
        where: { email: "admin@schoolhub.com" },
        update: {},
        create: {
            email: "admin@schoolhub.com",
            lastName: "Головний",
            fullName: "Маргарит АГ",
            password: adminPassword,
            role: Role.ADMIN,
        },
    });
    console.log("✅ Адміністратора успішно створено:", admin.email);

    // 2. Створення тестового класу
    // let testClass = await prisma.class.findFirst({
    //     where: { name: "10-А" },
    // });
    //
    // if (!testClass) {
    //     testClass = await prisma.class.create({
    //         data: {
    //             name: "10-А",
    //             year: 10, // 👈 Добавлено обязательное поле year
    //         },
    //     });
    // }
    // console.log("✅ Клас 10-А створено/знайдено:", testClass.id);
    //
    // // 3. Створення тестового Учня
    // const student = await prisma.user.upsert({
    //     where: { email: "student@schoolhub.com" },
    //     update: {
    //         classId: testClass.id,
    //     },
    //     create: {
    //         email: "student@schoolhub.com",
    //         lastName: "Коваленко",
    //         fullName: "Олександр Коваленко",
    //         password: hashedPassword,
    //         role: Role.STUDENT,
    //         classId: testClass.id,
    //     },
    // });
    // console.log("✅ Тестового учня створено:", student.email);

    // 4. Створення базових ачівок
    await prisma.achievement.upsert({
        where: { code: "PUNCTUAL" },
        update: {},
        create: {
            code: "PUNCTUAL",
            title: "Пунктуальний",
            description: "Складено 5 робіт вчасно",
            icon: "⏱️",
        },
    });

    await prisma.achievement.upsert({
        where: { code: "STREAK_5" },
        update: {},
        create: {
            code: "STREAK_5",
            title: "В ритмі",
            description: "Навчання 5 днів поспіль",
            icon: "🔥",
        },
    });
    console.log("✅ Ачівки створено");

    // // 5. Створення Стрику для учня
    // await prisma.userStreak.upsert({
    //     where: { userId: student.id },
    //     update: { currentStreak: 3 },
    //     create: {
    //         userId: student.id,
    //         currentStreak: 3,
    //         lastActiveDate: new Date(),
    //     },
    // });
    // console.log("✅ Стрік 3 дні призначено учню!");

    console.log("\n🎉 Всі початкові дані успішно занесені в БД!");
}

main()
    .catch((e) => {
        console.error("❌ Помилка під час сідингу:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });