/**
 * ==============================================================================
 * ПАНЕЛЬ ФІЛЬТРАЦІЇ КОРИСТУВАЧІВ (`src/components/admin/users/UserFilterPanel.tsx`)
 * ==============================================================================
 * @description Клієнтська панель інструментів для адміністратора, що містить:
 *              1. Перемикачі ролей (Усі, Вчителі, Учні, Адміни).
 *              2. Поле текстового пошуку за ПІБ або Email.
 *              3. Селектори для фільтрації за конкретним класом та предметом.
 *              4. Кнопку скидання активних фільтрів.
 * ==============================================================================
 */

interface Props {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    search: string;
    setSearch: (s: string) => void;
    selectedClass: string;
    setSelectedClass: (c: string) => void;
    selectedSubject: string;
    setSelectedSubject: (s: string) => void;
    availableClasses: string[];
    availableSubjects: string[];
    hasActiveFilters: boolean;
    onResetFilters: () => void;
}

export function UserFilterPanel({
                                    activeTab,
                                    setActiveTab,
                                    search,
                                    setSearch,
                                    selectedClass,
                                    setSelectedClass,
                                    selectedSubject,
                                    setSelectedSubject,
                                    availableClasses,
                                    availableSubjects,
                                    hasActiveFilters,
                                    onResetFilters,
                                }: Props) {
    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 space-y-4">
            {/* Верхня лінія: перемикачі ролей (вкладки) та рядок пошуку */}
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-full lg:w-auto overflow-x-auto">
                    {[
                        { id: "ALL", label: "Усі" },
                        { id: "TEACHER", label: "Вчителі" },
                        { id: "STUDENT", label: "Учні" },
                        { id: "ADMIN", label: "Адміни" },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition whitespace-nowrap ${
                                activeTab === tab.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="w-full lg:w-80">
                    <input
                        type="text"
                        placeholder="Пошук за ПІБ або Email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full border rounded-lg px-3.5 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                </div>
            </div>

            {/* Нижня лінія: випадаючі списки фільтрів за класом/предметом та кнопка скидання */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-gray-100">
                <div className="flex flex-wrap items-center gap-4">
                    <span className="text-xs font-semibold text-gray-500 uppercase">Фільтри:</span>
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-600">Клас:</label>
                        <select
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                            className="border rounded-lg px-2.5 py-1 text-xs bg-white font-medium"
                        >
                            <option value="ALL">Усі класи</option>
                            {availableClasses.map((cls) => (
                                <option key={cls} value={cls}>Клас {cls}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-600">Предмет:</label>
                        <select
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                            className="border rounded-lg px-2.5 py-1 text-xs bg-white font-medium"
                        >
                            <option value="ALL">Усі предмети</option>
                            {availableSubjects.map((sub) => (
                                <option key={sub} value={sub}>{sub}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {hasActiveFilters && (
                    <button
                        type="button"
                        onClick={onResetFilters}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1 rounded-lg transition inline-flex items-center gap-1.5"
                    >
                        <span>↺</span> Скинути фільтри
                    </button>
                )}
            </div>
        </div>
    );
}