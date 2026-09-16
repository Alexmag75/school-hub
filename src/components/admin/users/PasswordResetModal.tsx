/**
 * ==============================================================================
 * МОДАЛЬНЕ ВІКНО СКИДАННЯ ПАРОЛЯ (`src/components/admin/users/PasswordResetModal.tsx`)
 * ==============================================================================
 * @description Компонент модального вікна, що показує згенерований новий пароль
 *              для користувача. Надає адміністратору можливість скопіювати
 *              нові дані для авторизації в буфер обміну.
 * ==============================================================================
 */

import { User } from "@/types/user";

interface Props {
    data: { pass: string; user: User };
    copied: boolean;
    onCopy: (text: string) => void;
    onClose: () => void;
}

export function PasswordResetModal({ data, copied, onCopy, onClose }: Props) {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border space-y-4">
                {/* Заголовок та іконка ключа */}
                <div className="text-center">
                    <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-2 text-xl">
                        🔑
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">Новий пароль згенеровано</h3>
                    <p className="text-xs text-gray-500">
                        Пароль для користувача {data.user.fullName || data.user.lastName}
                    </p>
                </div>

                {/* Блок відображення логіна та згенерованого пароля */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 font-mono text-xs">
                    <div>
                        <span className="text-gray-400 block font-sans text-[11px]">Логін:</span>
                        <span className="text-blue-600 font-semibold">{data.user.email}</span>
                    </div>
                    <div>
                        <span className="text-gray-400 block font-sans text-[11px]">Новий Пароль:</span>
                        <span className="text-amber-800 font-bold text-base bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                            {data.pass}
                        </span>
                    </div>
                </div>

                {/* Кнопки копіювання доступу та закриття вікна */}
                <div className="flex flex-col gap-2 pt-2">
                    <button
                        type="button"
                        onClick={() =>
                            onCopy(`Логін: ${data.user.email}\nНовий пароль: ${data.pass}`)
                        }
                        className="w-full bg-slate-800 hover:bg-slate-900 text-white font-medium py-2 rounded-lg text-xs transition"
                    >
                        {copied ? "✓ Скопійовано в буфер!" : "📋 Скопіювати нові доступи"}
                    </button>

                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full border border-gray-300 hover:bg-gray-100 text-gray-700 font-medium py-2 rounded-lg text-xs transition"
                    >
                        Закрити
                    </button>
                </div>
            </div>
        </div>
    );
}