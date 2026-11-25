import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  GraduationCap,
  Users,
  Search,
  Trophy,
  Hourglass,
  XCircle,
  Minus,
} from "lucide-react";
import { api } from "@/lib/api";
import { Spinner, EmptyState } from "@/components/Spinner";
import { cn } from "@/lib/utils";

type FinalStatus = "passed" | "failed" | "pending" | "not-attempted" | "no-final";

interface StudentRow {
  enrollmentId: string;
  student: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    studentId?: string;
    grade?: string;
  };
  enrolledAt: string;
  progress: number;
  completedLessons: number;
  totalLessons: number;
  attemptsCount: number;
  avgScore: number | null;
  finalStatus: FinalStatus;
  bestFinal: number | null;
  lastActivity: number;
}

interface ResponseShape {
  course: { _id: string; title: string };
  totalLessons: number;
  hasFinal: boolean;
  students: StudentRow[];
}

const FINAL_BADGE: Record<FinalStatus, { label: string; cls: string; icon: any }> = {
  passed: {
    label: "Validé",
    cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    icon: Trophy,
  },
  failed: {
    label: "Échec",
    cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    icon: XCircle,
  },
  pending: {
    label: "À corriger",
    cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    icon: Hourglass,
  },
  "not-attempted": {
    label: "Non tenté",
    cls: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    icon: Minus,
  },
  "no-final": {
    label: "—",
    cls: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500",
    icon: Minus,
  },
};

const fmtAgo = (ms: number) => {
  const diff = (Date.now() - ms) / 1000;
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  if (diff < 86400 * 30) return `il y a ${Math.floor(diff / 86400)} j`;
  return new Date(ms).toLocaleDateString("fr-FR");
};

export const TeacherCourseStudentsPage = () => {
  const { id } = useParams<{ id: string }>();
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["course-students", id],
    queryFn: async () =>
      (await api.get(`/courses/${id}/students`)).data as ResponseShape,
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    if (!q) return data.students;
    return data.students.filter(
      (s) =>
        s.student.name.toLowerCase().includes(q) ||
        s.student.email.toLowerCase().includes(q) ||
        (s.student.studentId || "").toLowerCase().includes(q)
    );
  }, [data, search]);

  if (isLoading || !data) return <Spinner />;

  const completed = data.students.filter((s) => s.progress >= 100).length;
  const avgProgress =
    data.students.length === 0
      ? 0
      : Math.round(
          data.students.reduce((s, r) => s + r.progress, 0) / data.students.length
        );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <Link
        to={`/teach/courses/${id}`}
        className="text-sm text-slate-600 dark:text-slate-400 hover:text-ht-red dark:hover:text-ht-yellow flex items-center gap-1 mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Retour au cours
      </Link>

      <div className="mb-6">
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <GraduationCap className="w-7 h-7 text-ht-yellow" /> Étudiants inscrits
        </h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          {data.course.title} — suivi de la progression de chaque étudiant.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="card p-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-slate-500">
            <Users className="w-3.5 h-3.5" /> Inscrits
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">
            {data.students.length}
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-slate-500">
            <Trophy className="w-3.5 h-3.5" /> Cours terminé
          </div>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {completed}
          </div>
        </div>
        <div className="card p-4">
          <div className="text-xs uppercase tracking-wider font-semibold text-slate-500">
            Progression moyenne
          </div>
          <div className="text-3xl font-black text-ht-black dark:text-ht-yellow mt-1">
            {avgProgress}%
          </div>
        </div>
        <div className="card p-4">
          <div className="text-xs uppercase tracking-wider font-semibold text-slate-500">
            Leçons publiées
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">
            {data.totalLessons}
          </div>
        </div>
      </div>

      <div className="card p-4 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
            placeholder="Rechercher par nom, email ou identifiant…"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="w-7 h-7" />}
          title={search ? "Aucun résultat" : "Aucun étudiant inscrit"}
          message={search ? "Essayez d'autres mots-clés." : "Les inscriptions apparaîtront ici dès qu'un étudiant rejoindra le cours."}
        />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Étudiant</th>
                <th className="px-4 py-3 hidden md:table-cell">Progression</th>
                <th className="px-4 py-3 hidden lg:table-cell">Quiz</th>
                <th className="px-4 py-3">Examen final</th>
                <th className="px-4 py-3 hidden xl:table-cell">Dernière activité</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filtered.map((r) => {
                const fb = FINAL_BADGE[r.finalStatus];
                const Icon = fb.icon;
                return (
                  <tr
                    key={r.enrollmentId}
                    className="hover:bg-slate-50 dark:hover:bg-slate-900/30"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-ht-yellow text-ht-black flex items-center justify-center font-bold shrink-0 overflow-hidden">
                          {r.student.avatar ? (
                            <img
                              src={r.student.avatar}
                              alt={r.student.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            r.student.name[0]?.toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-slate-900 dark:text-white truncate">
                            {r.student.name}
                          </div>
                          <div className="text-xs text-slate-500 truncate">
                            {r.student.email}
                            {r.student.studentId && (
                              <span className="ml-2 text-slate-400">
                                · {r.student.studentId}
                              </span>
                            )}
                            {r.student.grade && (
                              <span className="ml-2 text-slate-400">
                                · {r.student.grade}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell min-w-[180px]">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className={cn(
                              "h-full transition-all",
                              r.progress >= 100
                                ? "bg-emerald-500"
                                : "bg-gradient-to-r from-ht-yellow to-ht-red"
                            )}
                            style={{ width: `${r.progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold w-10 text-right tabular-nums">
                          {r.progress}%
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        {r.completedLessons}/{r.totalLessons} leçons
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {r.attemptsCount === 0 ? (
                        <span className="text-xs text-slate-400">—</span>
                      ) : (
                        <div className="text-xs">
                          <span className="font-semibold">
                            {r.attemptsCount} tentative{r.attemptsCount > 1 ? "s" : ""}
                          </span>
                          {r.avgScore !== null && (
                            <span className="ml-2 text-slate-500">
                              moy. {r.avgScore}%
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium",
                          fb.cls
                        )}
                      >
                        <Icon className="w-3 h-3" />
                        {fb.label}
                        {r.bestFinal !== null && (
                          <span className="ml-1 opacity-70">· {r.bestFinal}%</span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 hidden xl:table-cell">
                      {fmtAgo(r.lastActivity)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
