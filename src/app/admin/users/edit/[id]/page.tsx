"use client";

/**
 * ==============================================================================
 * СТОРІНКА РЕДАГУВАННЯ КОРИСТУВАЧА (`src/app/admin/users/edit/[id]/page.tsx`)
 * ==============================================================================
 * @description Клієнтська сторінка панелі адміністратора для редагування облікового
 *              запису користувача (ПІБ, Email, клас/підгрупи для учня або педагогічне
 *              навантаження для вчителя).
 * ==============================================================================
 */

"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    TeacherAssignment,
    TeacherEditAssignments,
    SubjectWithGroups,
    SchoolClass
} from "@/app/admin/users/TeacherEditAssignments";

export default function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: userId } = use(params);
    const router = useRouter();

    const [availableClasses, setAvailableClasses] = useState<SchoolClass[]>([]);
    const [availableSubjects, setAvailableSubjects] = useState<SubjectWithGroups[]>([]);

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<"STUDENT" | "TEACHER" | "ADMIN">("STUDENT");
    const [selectedStudentClass, setSelectedStudentClass] = useState<string>("");
    const [teacherAssignments, setTeacherAssignments] = useState<TeacherAssignment[]>([]);

    const [pageLoading, setPageLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        async function initData() {
            try {
                setPageLoading(true);

                const [resUser, resClasses, resSubjects] = await Promise.all([
                    fetch(`/api/admin/users/${userId}`),
                    fetch("/api/admin/classes"),
                    fetch("/api/admin/subjects"),
                ]);

                if (!resUser.ok) throw new Error("Не вдалося завантажити дані користувача");

                const userData = await resUser.json();

                if (resClasses.ok) {
                    setAvailableClasses(await resClasses.json());
                }
                if (resSubjects.ok) {
                    // Зберігаємо предмети разом із підгрупами з роуту GET /api/admin/subjects
                    setAvailableSubjects(await resSubjects.json());
                }

                setFullName(userData.fullName || userData.lastName || "");
                setEmail(userData.email || "");
                setRole(userData.role);

                if (userData.role === "STUDENT" && userData.className) {
                    setSelectedStudentClass(userData.className.name);
                }

                if (userData.role === "TEACHER" && Array.isArray(userData.teacherAssignments)) {
                    setTeacherAssignments(userData.teacherAssignments);
                }
            } catch (err: any) {
                setError(err.message || "Помилка завантаження");
            } finally {
                setPageLoading(false);
            }
        }

        initData();
    }, [userId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setSubmitting(true);

        const payload = {
            fullName,
            email,
            role,
            targetClassName: role === "STUDENT" ? selectedStudentClass : null,
            teacherAssignments: role === "TEACHER" ? teacherAssignments.map((a) => ({
                subjectId: a.subjectId,
                classId: a.classId,
                subgroupId: a.subgroupId || null,
            })) : [],
        };

        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Не вдалося оновити користувача");
            } else {
                setSuccess("Дані успішно збережено!");
                setTimeout(() => {
                    router.push("/admin/users");
                }, 1000);
            }
        } catch {
            setError("Помилка мережі при збереженні");
        } finally {
            setSubmitting(false);
        }
    };

    if (pageLoading) {
        return (
            <div className="max-w-2xl mx-auto p-12 text-center text-gray-500 font-medium">
                Завантаження даних...
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Редагування користувача</h1>
                    <p className="text-gray-500 text-sm">Зміна особистих даних, предметів та класів</p>
                </div>
                <Link
                    href="/admin/users"
                    className="text-sm font-medium text-slate-600 hover:text-slate-900 border px-3 py-1.5 rounded-md bg-white shadow-sm transition"
                >
                    ← Назад
                </Link>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                {error && (
                    <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="mb-4 text-sm text-emerald-700 bg-emerald-50 p-3 rounded-lg font-medium border border-emerald-100">
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                ПІБ Користувача
                            </label>
                            <input
                                type="text"
                                required
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Роль у системі
                            </label>
                            <div className="h-[42px] flex items-center">
                                {role === "STUDENT" && (
                                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5">
                                        🎓 Учень
                                    </span>
                                )}
                                {role === "TEACHER" && (
                                    <span className="bg-blue-50 text-blue-700 border border-blue-200 font-semibold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5">
                                        👨‍🏫 Вчитель
                                    </span>
                                )}
                                {role === "ADMIN" && (
                                    <span className="bg-purple-50 text-purple-700 border border-purple-200 font-semibold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5">
                                        ⚡ Адміністратор
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email (Логін)
                        </label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                    </div>

                    {role === "STUDENT" && (
                        <div className="pt-2 border-t border-gray-100">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Клас учня
                            </label>
                            <select
                                value={selectedStudentClass}
                                onChange={(e) => setSelectedStudentClass(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            >
                                <option value="">Без класу</option>
                                {availableClasses.map((cls) => (
                                    <option key={cls.id || cls.name} value={cls.name}>
                                        Клас {cls.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {role === "TEACHER" && (
                        <TeacherEditAssignments
                            availableClasses={availableClasses}
                            availableSubjects={availableSubjects}
                            assignments={teacherAssignments}
                            onChangeAssignments={setTeacherAssignments}
                        />
                    )}

                    <div className="pt-4 flex justify-end gap-3 border-t">
                        <Link
                            href="/admin/users"
                            className="px-5 py-2.5 rounded-lg border text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                        >
                            Скасувати
                        </Link>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg text-sm transition shadow-sm disabled:opacity-50"
                        >
                            {submitting ? "Збереження..." : "Зберегти зміни"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}