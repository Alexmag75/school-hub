/**
 * ==============================================================================
 * КОМПОНЕНТ ТАБЛИЦІ МАСОВОГО СТВОРЕННЯ КОРИСТУВАЧІВ (`src/components/admin/users/BulkUsersResultTable.tsx`)
 * ==============================================================================
 * @description Клієнтський компонент, що відображає результати масової генерації
 *              акаунтів учнів для конкретного класу. Включає:
 *              1. Сповіщення про успішне завантаження Excel-файлу.
 *              2. Кнопку для повторного експорту згенерованих даних в Excel.
 *              3. Детальну таблицю з прізвищами, логінами (email) та паролями учнів.
 * ==============================================================================
 */

"use client";

import { CreatedUser } from "@/types/userCreate";
import { exportUsersToExcel } from "@/utils/userCreationUtils";

interface Props {
    users: CreatedUser[];
    targetClass: string;
}

export function BulkUsersResultTable({ users, targetClass }: Props) {
    // Якщо список згенерованих користувачів порожній, нічого не рендеримо
    if (users.length === 0) return null;

    return (
        <div className="mt-8 border-t pt-6 space-y-4">
            {/* Панель заголовка та експорту */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                    <h3 className="font-bold text-gray-800 text-base">
                        Згенеровано доступів ({users.length} учнів)
                    </h3>
                    <p className="text-xs text-gray-500">
                        Файл Excel вже завантажено. Якщо потрібно, ви можете скачати його повторно.
                    </p>
                </div>
                <div className="flex gap-2">
                    {/* Кнопка повторного завантаження таблиці у форматі Excel */}
                    <button
                        type="button"
                        onClick={() => exportUsersToExcel(users, `Клас_${targetClass}`)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition shadow-sm flex items-center gap-1.5"
                    >
                        📊 Завантажити Excel повторно
                    </button>
                </div>
            </div>

            {/* Таблиця згенерованих логінів та паролів */}
            <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b text-gray-600">
                    <tr>
                        <th className="p-2.5 w-12 text-center">№</th>
                        <th className="p-2.5">ПІБ Учня</th>
                        <th className="p-2.5">Логін (Email)</th>
                        <th className="p-2.5">Пароль</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y font-mono text-xs">
                    {users.map((u, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2.5 text-center text-gray-400 font-sans">{idx + 1}</td>
                            <td className="p-2.5 font-sans font-medium text-gray-800">{u.fullName}</td>
                            <td className="p-2.5 text-blue-600">{u.email}</td>
                            <td className="p-2.5 font-bold text-gray-700">{u.password || u.pass}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}