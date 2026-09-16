/**
 * ==============================================================================
 * МОДАЛЬНЕ ВІКНО УСПІШНОГО СТВОРЕННЯ КОРИСТУВАЧА (`src/components/admin/users/SingleUserCreatedModal.tsx`)
 * ==============================================================================
 * @description Клієнтський компонент діалогового вікна, який з'являється після
 *              успішного створення окремого користувача (учня, вчителя чи адміна).
 *              Дозволяє:
 *              1. Переглянути згенерований логін та унікальний пароль.
 *              2. Швидко скопіювати ці дані в буфер обміну.
 *              3. Завантажити квитанцію/дані про доступи у форматі Excel (.xlsx).
 *              4. Закрити вікно та повернутися до загального списку користувачів.
 * ==============================================================================
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreatedUser } from "@/types/userCreate";
import { exportUsersToExcel } from "@/utils/userCreationUtils";

interface ModalProps {
    user: CreatedUser;
    onClose: () => void;
}

export function SingleUserCreatedModal({ user, onClose }: ModalProps) {
    const router = useRouter();
    const [copied, setCopied] = useState(false);

    // Функція копіювання текстових даних доступу в буфер обміну з таймером статусу
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border space-y-5">
                {/* Заголовок та іконка успіху */}
                <div className="text-center">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl font-bold">
                        ✓
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">Користувача створено!</h3>
                    <p className="text-xs text-gray-500 mt-1">Збережіть або скопіюйте дані для доступу</p>
                </div>

                {/* Блок з реквізитами доступу нового користувача */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 font-mono text-xs">
                    <div>
                        <span className="text-gray-400 block font-sans text-[11px]">ПІБ:</span>
                        <span className="font-bold text-gray-800 text-sm">{user.fullName}</span>
                    </div>
                    <div>
                        <span className="text-gray-400 block font-sans text-[11px]">Логін (Email):</span>
                        <span className="text-blue-600 font-semibold">{user.email}</span>
                    </div>
                    <div>
                        <span className="text-gray-400 block font-sans text-[11px]">Пароль:</span>
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-sm">
                            {user.password}
                        </span>
                    </div>
                </div>

                {/* Кнопки керування та експорту */}
                <div className="flex flex-col gap-2">
                    <button
                        type="button"
                        onClick={() =>
                            copyToClipboard(
                                `ПІБ: ${user.fullName}\nЛогін: ${user.email}\nПароль: ${user.password}`
                            )
                        }
                        className="w-full bg-slate-800 hover:bg-slate-900 text-white font-medium py-2.5 rounded-lg text-xs transition flex items-center justify-center gap-2 shadow-sm"
                    >
                        <span>{copied ? "✓ Скопійовано!" : "📋 Скопіювати дані в буфер"}</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => exportUsersToExcel([user], user.fullName)}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-lg text-xs transition flex items-center justify-center gap-2 shadow-sm"
                    >
                        <span>📊 Завантажити Excel (.xlsx)</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            onClose();
                            router.push("/admin/users");
                        }}
                        className="w-full border border-gray-300 hover:bg-gray-100 text-gray-700 font-medium py-2.5 rounded-lg text-xs transition mt-1"
                    >
                        Перейти до списку користувачів
                    </button>
                </div>
            </div>
        </div>
    );
}