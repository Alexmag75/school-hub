/**
 * ==============================================================================
 * ТАБЛИЦЯ КОРИСТУВАЧІВ ПАНЕЛІ АДМІНІСТРАТОРА (`src/components/admin/users/UsersTable.tsx`)
 * ==============================================================================
 */

import Link from "next/link";
import { User } from "@/types/user";
import { getUserClasses } from "@/utils/userUtils";

interface Props {
    users: User[];
    loading: boolean;
    hasActiveFilters: boolean;
    onResetFilters: () => void;
    onResetPassword: (user: User) => void;
    onDelete: (user: User) => void;
}

const roleBadges: Record<string, { label: string; style: string }> = {
    STUDENT: { label: "Учень", style: "bg-blue-50 text-blue-700 border-blue-200" },
    TEACHER: { label: "Вчитель", style: "bg-purple-50 text-purple-700 border-purple-200" },
    ADMIN: { label: "Адмін", style: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

function getSubgroupName(subgroup: any): string | null {
    if (!subgroup) return null;
    if (typeof subgroup === "string") return subgroup;
    if (typeof subgroup === "object" && subgroup.name) return subgroup.name;
    return null;
}

export function UsersTable({
                               users,
                               loading,
                               hasActiveFilters,
                               onResetFilters,
                               onResetPassword,
                               onDelete,
                           }: Props) {
    if (loading) {
        return <p className="p-6 text-gray-500 text-center">Завантаження...</p>;
    }

    if (users.length === 0) {
        return (
            <div className="p-8 text-center space-y-3">
                <p className="text-gray-400">Нічого не знайдено</p>
                {hasActiveFilters && (
                    <button
                        type="button"
                        onClick={onResetFilters}
                        className="text-xs font-medium text-blue-600 hover:underline"
                    >
                        Скинути фільтри пошуку
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                    <thead>
                    <tr className="border-b bg-gray-50 text-gray-600 font-medium">
                        <th className="p-4 w-1/4">ПІБ</th>
                        <th className="p-4">Email (Логін)</th>
                        <th className="p-4">Роль</th>
                        <th className="p-4 w-1/3">Клас / Навантаження</th>
                        <th className="p-4 text-right">Дії</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                    {users.map((u) => {
                        const badge = roleBadges[u.role] || { label: u.role, style: "bg-gray-100" };
                        const studentClasses = getUserClasses(u);

                        return (
                            <tr key={u.id} className="hover:bg-gray-50/80 transition">
                                <td className="p-4 font-semibold text-gray-800">
                                    {u.fullName || u.lastName}
                                </td>
                                <td className="p-4 text-gray-600 font-mono text-xs">
                                    {u.email}
                                </td>
                                <td className="p-4">
                                        <span className={`px-2.5 py-1 text-xs rounded-full border font-medium ${badge.style}`}>
                                            {badge.label}
                                        </span>
                                </td>

                                {/* ОНОВЛЕНА КОЛОНКА КЛАС / НАВАНТАЖЕННЯ */}
                                <td className="py-3 px-4 text-xs text-gray-600 max-w-md">
                                    {u.role === "TEACHER" ? (
                                        u.teacherAssignments && u.teacherAssignments.length > 0 ? (
                                            <div className="space-y-1">
                                                {/* Лічильник кількості предметів */}
                                                <div className="text-[11px] font-semibold text-gray-400 mb-1">
                                                    Всього призначень: {u.teacherAssignments.length}
                                                </div>

                                                {/* Компактний контейнер із прокруткою та flex-wrap */}
                                                <div className="max-h-28 overflow-y-auto pr-1 space-y-1.5 scrollbar-thin scrollbar-thumb-gray-200">
                                                    <div className="flex flex-wrap gap-1.5 items-center">
                                                        {u.teacherAssignments.map((a: any, idx: number) => {
                                                            const className = a.class?.name || "—";
                                                            const subjectTitle = a.subject?.title || "—";
                                                            const sg = getSubgroupName(a.subgroup);

                                                            return (
                                                                <div
                                                                    key={idx}
                                                                    className="inline-flex items-center gap-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2 py-0.5 text-xs transition"
                                                                >
                                                                    <span className="font-bold text-slate-800">
                                                                        {className}
                                                                    </span>
                                                                    <span className="text-slate-400">→</span>
                                                                    <span className="text-blue-700 font-medium">
                                                                        {subjectTitle}
                                                                    </span>
                                                                    {sg && (
                                                                        <span className="text-blue-500 text-[10px]">
                                                                            ({sg})
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-gray-400 italic">Навантаження не призначено</span>
                                        )
                                    ) : u.role === "STUDENT" ? (
                                        studentClasses.length > 0 ? (
                                            <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md border border-blue-200 font-medium">
                                                    {studentClasses.map((c) => c.name).join(", ")}
                                                </span>
                                        ) : (
                                            <span className="text-gray-400">—</span>
                                        )
                                    ) : (
                                        <span className="text-gray-400">—</span>
                                    )}
                                </td>

                                {/* Кнопки дій */}
                                <td className="p-4 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                        <Link
                                            href={`/admin/users/edit/${u.id}`}
                                            className="text-xs font-semibold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1.5 rounded-lg transition inline-flex items-center gap-1"
                                        >
                                            ✏️ Редагувати
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={() => onResetPassword(u)}
                                            className="text-xs font-semibold text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1.5 rounded-lg transition"
                                        >
                                            🔑 Пароль
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onDelete(u)}
                                            className="text-xs font-semibold text-red-700 hover:text-red-900 bg-red-50 hover:bg-red-100 border border-red-200 px-2.5 py-1.5 rounded-lg transition"
                                        >
                                            🗑
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}