/**
 * ==============================================================================
 * МОДАЛЬНЕ ВІКНО ВИДАЛЕННЯ КОРИСТУВАЧА (`src/components/admin/users/DeleteUserModal.tsx`)
 * ==============================================================================
 * @description Компонент діалогового вікна підтвердження видалення акаунта
 *              користувача (учня або вчителя) з панелі адміністратора.
 *              Відображає попередження про незворотність дії та кнопки керування.
 * ==============================================================================
 */

import { User } from "@/types/user";

interface Props {
    user: User;
    loading: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export function DeleteUserModal({ user, loading, onConfirm, onCancel }: Props) {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border space-y-4">
                {/* Заголовок та іконка попередження */}
                <div className="text-center">
                    <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-2 text-xl font-bold">
                        🗑
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">Видалити користувача?</h3>
                    <p className="text-xs text-gray-500 mt-1">
                        Ви дійсно бажаєте видалити користувача{" "}
                        <span className="font-semibold text-gray-800">
                            {user.fullName || user.lastName}
                        </span>{" "}
                        ({user.email})? Цю дію неможливо буде скасувати.
                    </p>
                </div>

                {/* Кнопки підтвердження або скасування */}
                <div className="flex gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="w-1/2 border border-gray-300 hover:bg-gray-100 text-gray-700 font-medium py-2 rounded-lg text-xs transition"
                    >
                        Скасувати
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        className="w-1/2 bg-red-600 hover:bg-red-700 text-white font-medium py-2 rounded-lg text-xs transition shadow-sm disabled:opacity-50"
                    >
                        {loading ? "Видалення..." : "Так, видалити"}
                    </button>
                </div>
            </div>
        </div>
    );
}