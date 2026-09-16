import { TeacherAssignment } from "@/app/admin/users/TeacherEditAssignments";

/**
 * ==============================================================================
 * TYPE DEFINITIONS: User & Educational Entities (`types/user.ts`)
 * ==============================================================================
 * @description Визначає базові моделi даних користувача (учня, вчителя, адміністратора),
 *              а також пов'язані навчальні сутності: класи (`SchoolClass`),
 *              предмети (`Subject`) та структури для форм редагування (`UserEdit`).
 * ==============================================================================
 */

/**
 * @description Інтерфейс навчального класу школи.
 */
export interface SchoolClass {
    /** Унікальний ідентифікатор класу в базі даних */
    id: string;
    /** Назва класу (наприклад: "9-В", "11-А") */
    name: string;
}

/**
 * @description Інтерфейс навчального предмета.
 */
export interface Subject {
    /** Унікальний ідентифікатор предмета */
    id: string;
    /** Повна назва предмета (наприклад: "Фізика", "Інформатика") */
    title: string;
    /** Закріплений клас (для одиничної прив'язки) */
    className?: SchoolClass | null;
    /** Масив класів, у яких викладається даний предмет */
    classes?: SchoolClass[];
}

/**
 * @description Повний інтерфейс об'єкта користувача системи.
 */
export interface User {
    /** Унікальний ідентифікатор користувача (Prisma ID) */
    id: string;
    /** Системний email / логін користувача */
    email: string;
    /** Повне ім'я (ПІБ) */
    fullName?: string;
    /** Прізвище користувача */
    lastName: string;
    /** Системна роль користувача в платформі */
    role: "STUDENT" | "TEACHER" | "ADMIN" | string;
    /** Дата реєстрації / створення облікового запису (ISO date string) */
    createdAt: string;
    /** Закріплений клас (актуально для учня) */
    className?: SchoolClass | null;
    /** Масив класів, до яких прив'язаний користувач */
    classes?: SchoolClass[];
    /** Список предметів користувача */
    subjects?: Subject[];
    /** Перелік предметів, які викладає вчитель */
    teachingSubjects?: Subject[];
    /** Список класів, у яких викладає вчитель */
    teacherClasses?: SchoolClass[];
    /** Розподіл педагогічного навантаження вчителя (клас + предмет) */
    teacherAssignments?: TeacherAssignment[];
}

/**
 * @description Структура даних для форм створення та редагування користувача в адмін-панелі.
 */
export interface UserEdit {
    /** Повне ім'я користувача */
    fullName: string;
    /** Електронна пошта / логін */
    email: string;
    /** Системна роль ("STUDENT", "TEACHER", "ADMIN") */
    role: string;
    /** ID закріпленого класу (для ролі учня) */
    className?: string | null;
    /** Масив ID обраних класів (для ролі вчителя) */
    classIds?: string[];
    /** Масив ID обраних предметів (для ролі вчителя) */
    subjectIds?: string[];
}