// "use client";
//
// import { useState, useEffect } from "react";
//
// interface Subject {
//     id: string;
//     title: string;
// }
//
// interface Task {
//     id: string;
//     title: string;
//     description: string;
//     isActive: boolean;
//     isClosed: boolean;
//     createdAt: string;
//     subject: { title: string };
//     _count: { comments: number };
// }
//
// interface Props {
//     subjects?: Subject[]; // Принимаем предметы из дашборда
// }
//
// export default function TeacherDailyTasksPage({ subjects = [] }: Props) {
//     const [tasks, setTasks] = useState<Task[]>([]);
//     const [localSubjects, setLocalSubjects] = useState<Subject[]>(subjects);
//     const [loading, setLoading] = useState(true);
//
//     // Форма новой задачи
//     const [title, setTitle] = useState("");
//     const [description, setDescription] = useState("");
//     const [selectedSubject, setSelectedSubject] = useState("");
//     const [makeActive, setMakeActive] = useState(true);
//     const [isSubmitting, setIsSubmitting] = useState(false);
//
//     // Синхронизируем входные предметы и ставим первый предмет по умолчанию
//     useEffect(() => {
//         if (subjects.length > 0) {
//             setLocalSubjects(subjects);
//             if (!selectedSubject) setSelectedSubject(subjects[0].id);
//         } else {
//             // Фолбэк-загрузка, если предметы не были переданы снаружи
//             fetch("/api/teacher/my-data")
//                 .then((res) => res.json())
//                 .then((data) => {
//                     const teacherSubjects = data.subjects || [];
//                     setLocalSubjects(teacherSubjects);
//                     if (teacherSubjects.length > 0 && !selectedSubject) {
//                         setSelectedSubject(teacherSubjects[0].id);
//                     }
//                 })
//                 .catch(() => {});
//         }
//     }, [subjects]);
//
//     useEffect(() => {
//         fetchTasks();
//     }, []);
//
//     const fetchTasks = async () => {
//         try {
//             const res = await fetch("/api/teacher/daily-tasks");
//             const data = await res.json();
//             if (Array.isArray(data)) setTasks(data);
//         } finally {
//             setLoading(false);
//         }
//     };
//
//     const handleCreateTask = async (e: React.FormEvent) => {
//         e.preventDefault();
//         if (!title || !description || !selectedSubject) return;
//
//         setIsSubmitting(true);
//         try {
//             const res = await fetch("/api/teacher/daily-tasks", {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({
//                     title,
//                     description,
//                     subjectId: selectedSubject,
//                     makeActive,
//                 }),
//             });
//
//             if (res.ok) {
//                 setTitle("");
//                 setDescription("");
//                 fetchTasks();
//             }
//         } finally {
//             setIsSubmitting(false);
//         }
//     };
//
//     return (
//         <div className="max-w-6xl mx-auto p-2 md:p-4 space-y-8 font-sans">
//             <div>
//                 <h1 className="text-2xl font-bold text-slate-900">💡 Управління «Задачею дня»</h1>
//                 <p className="text-slate-500 text-sm">Створюйте інтелектуальні задачі для головної сторінки та обирайте найкращі відповіді учнів.</p>
//             </div>
//
//             {/* Форма создания задачи */}
//             <form onSubmit={handleCreateTask} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
//                 <h2 className="text-lg font-bold text-slate-800">Створити нову задачу</h2>
//
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     <div>
//                         <label className="block text-xs font-semibold text-slate-600 mb-1">Заголовок задачи</label>
//                         <input
//                             type="text"
//                             value={title}
//                             onChange={(e) => setTitle(e.target.value)}
//                             placeholder="Наприклад: Логічна задача про двозначні числа"
//                             className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//                             required
//                         />
//                     </div>
//
//                     <div>
//                         <label className="block text-xs font-semibold text-slate-600 mb-1">Предмет</label>
//                         <select
//                             value={selectedSubject}
//                             onChange={(e) => setSelectedSubject(e.target.value)}
//                             className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//                             required
//                         >
//                             <option value="">Оберіть предмет</option>
//                             {localSubjects.map((s) => (
//                                 <option key={s.id} value={s.id}>{s.title}</option>
//                             ))}
//                         </select>
//                     </div>
//                 </div>
//
//                 <div>
//                     <label className="block text-xs font-semibold text-slate-600 mb-1">Текст умови / запитання</label>
//                     <textarea
//                         rows={3}
//                         value={description}
//                         onChange={(e) => setDescription(e.target.value)}
//                         placeholder="Опишіть суть задачи та запитання до учнів..."
//                         className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
//                         required
//                     />
//                 </div>
//
//                 <div className="flex items-center justify-between pt-2">
//                     <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
//                         <input
//                             type="checkbox"
//                             checked={makeActive}
//                             onChange={(e) => setMakeActive(e.target.checked)}
//                             className="rounded text-blue-600 focus:ring-blue-500"
//                         />
//                         Опублікувати на головній сторінці негайно
//                     </label>
//
//                     <button
//                         type="submit"
//                         disabled={isSubmitting}
//                         className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded-xl text-sm transition disabled:opacity-50"
//                     >
//                         {isSubmitting ? "Збереження..." : "Опублікувати задачу"}
//                     </button>
//                 </div>
//             </form>
//
//             {/* Список созданных задач */}
//             <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
//                 <div className="p-4 border-b bg-slate-50 font-bold text-slate-700 text-sm">
//                     Ваші задачі
//                 </div>
//
//                 {loading ? (
//                     <div className="p-6 text-center text-sm text-slate-500">Завантаження...</div>
//                 ) : tasks.length === 0 ? (
//                     <div className="p-6 text-center text-sm text-slate-500">Ви ще не створили жодної задачи.</div>
//                 ) : (
//                     <div className="divide-y">
//                         {tasks.map((task) => (
//                             <div key={task.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50">
//                                 <div className="space-y-1">
//                                     <div className="flex items-center gap-2">
//                                         <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-200">
//                                             {task.subject?.title}
//                                         </span>
//                                         {task.isActive && (
//                                             <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
//                                                 Активна на головній
//                                             </span>
//                                         )}
//                                         {task.isClosed && (
//                                             <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
//                                                 Завершено
//                                             </span>
//                                         )}
//                                     </div>
//                                     <h3 className="font-bold text-slate-800">{task.title}</h3>
//                                     <p className="text-xs text-slate-500 line-clamp-1">{task.description}</p>
//                                 </div>
//
//                                 <div className="flex items-center gap-4">
//                                     <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
//                                         💬 Відповідей: <strong>{task._count?.comments || 0}</strong>
//                                     </span>
//                                     <button className="text-xs font-semibold text-blue-600 hover:text-blue-800 border border-blue-200 hover:bg-blue-50 px-3 py-1.5 rounded-xl transition">
//                                         Перевірити відповіді →
//                                     </button>
//                                 </div>
//                             </div>
//                         ))}
//                     </div>
//                 )}
//             </div>
//         </div>
//     );
// }