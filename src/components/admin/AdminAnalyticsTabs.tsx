/**
 * ==============================================================================
 * КОМПОНЕНТ ВКЛАДОК АНАЛІТИКИ АДМІНІСТРАТОРА (`src/components/admin/AdminAnalyticsTabs.tsx`)
 * ==============================================================================
 */

"use client";

import { useState } from "react";
import {
    LayoutDashboard,
    GraduationCap,
    Users,
    HardDrive,
    ShieldAlert,
    Clock
} from "lucide-react";
import TeacherActivityWidget from "@/components/admin/TeacherActivityWidget";
import RecentActivityWidget from "@/components/admin/RecentActivityWidget";
import AcademicAnalyticsTab from "@/components/admin/AcademicAnalyticsTab";
import UsersAnalyticsTab from "@/components/admin/UsersAnalyticsTab";
import SystemAnalyticsTab from "@/components/admin/SystemAnalyticsTab";
import QuickActionsWidget from "@/components/admin/QuickActionsWidget";

type TabType = "overview" | "academic" | "users" | "system";

export default function AdminAnalyticsTabs() {
    const [activeTab, setActiveTab] = useState<TabType>("overview");

    return (
        <div className="space-y-6">
            {/* Навігаційна панель вкладок */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
                <button
                    onClick={() => setActiveTab("overview")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                        activeTab === "overview"
                            ? "bg-slate-900 text-white shadow-sm"
                            : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Огляд та Оперативно</span>
                </button>

                <button
                    onClick={() => setActiveTab("academic")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                        activeTab === "academic"
                            ? "bg-blue-600 text-white shadow-sm"
                            : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                >
                    <GraduationCap className="w-4 h-4" />
                    <span>Учбова аналітика</span>
                </button>

                <button
                    onClick={() => setActiveTab("users")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                        activeTab === "users"
                            ? "bg-indigo-600 text-white shadow-sm"
                            : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                >
                    <Users className="w-4 h-4" />
                    <span>Користувачі та Контент</span>
                </button>

                <button
                    onClick={() => setActiveTab("system")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                        activeTab === "system"
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                >
                    <HardDrive className="w-4 h-4" />
                    <span>Система та Сховище</span>
                </button>
            </div>

            {/* ВКЛАДКА 1: ОГЛЯД */}
            {activeTab === "overview" && (
                <div className="space-y-6">
                    <TeacherActivityWidget />

                    {/* Сетка: 1 колонка для Быстрых действий, 2 колонки для Активности */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1">
                            <QuickActionsWidget />
                        </div>
                        <div className="lg:col-span-2">
                            <RecentActivityWidget />
                        </div>
                    </div>
                </div>
            )}

            {/* ВКЛАДКА 2: НАВЧАЛЬНА АНАЛІТИКА */}
            {activeTab === "academic" && (
                <AcademicAnalyticsTab />
            )}

            {/* ВКЛАДКА 3: КОРИСТУВАЧІ ТА КОНТЕНТ */}
            {activeTab === "users" && (
                <UsersAnalyticsTab />
            )}

            {/* ВКЛАДКА 4: СИСТЕМА ТА СХОВИЩЕ */}
            {activeTab === "system" && (
                <SystemAnalyticsTab />
            )}
        </div>
    );
}