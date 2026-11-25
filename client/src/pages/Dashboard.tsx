import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { BookOpen, Award, TrendingUp, GraduationCap, Layers, Users, Shield, Flag, Bug, ScrollText, ArrowRight, Sparkles } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { api } from "@/lib/api";
import { CourseCard } from "@/components/CourseCard";
import { Spinner, EmptyState } from "@/components/Spinner";
import { useAuth } from "@/store/auth";
import { cn } from "@/lib/utils";

type Tone = "gold" | "red" | "ink" | "emerald";

const tones: Record<Tone, { bg: string; ring: string; bar: string; text: string }> = {
  gold: {
    bg: "bg-ht-yellow/20 dark:bg-ht-yellow/10",
    ring: "ring-ht-yellow/30",
    bar: "bg-ht-yellow",
    text: "text-ht-black dark:text-ht-yellow",
  },
  red: {
    bg: "bg-ht-red/10 dark:bg-ht-red/15",
    ring: "ring-ht-red/30",
    bar: "bg-ht-red",
    text: "text-ht-red",
  },
  ink: {
    bg: "bg-slate-900 dark:bg-white/10",
    ring: "ring-slate-900/30 dark:ring-white/20",
    bar: "bg-ht-black dark:bg-white",
    text: "text-white dark:text-white",
  },
  emerald: {
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    ring: "ring-emerald-500/30",
    bar: "bg-emerald-500",
    text: "text-emerald-700 dark:text-emerald-300",
  },
};

const StatCard = ({
  icon: Icon,
  label,
  value,
  hint,
  tone = "gold",
}: {
  icon: any;
  label: string;
  value: string | number;
  hint?: string;
  tone?: Tone;
}) => {
  const t = tones[tone];
  return (
    <div className="relative card p-5 sm:p-6 overflow-hidden group hover:shadow-lg transition-all">
      {/* top accent bar */}
      <div className={cn("absolute top-0 left-0 right-0 h-1", t.bar)} />
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            "w-11 h-11 rounded-xl flex items-center justify-center ring-1",
            t.bg,
            t.ring,
            t.text
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-4 text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
        {value}
      </div>
      <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">{label}</div>
      {hint && <div className="text-xs text-slate-400 mt-2">{hint}</div>}
    </div>
  );
};

const ActionTile = ({
  to,
  icon: Icon,
  title,
  desc,
  tone = "gold",
}: {
  to: string;
  icon: any;
  title: string;
  desc: string;
  tone?: Tone;
}) => {
  const t = tones[tone];
  return (
    <Link
      to={to}
      className="group relative card p-5 sm:p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-start gap-4 overflow-hidden cursor-pointer"
    >
      <div className={cn("absolute top-0 left-0 h-1 w-12 group-hover:w-full transition-all duration-500", t.bar)} />
      <div
        className={cn(
          "w-11 h-11 rounded-xl flex items-center justify-center ring-1 shrink-0",
          t.bg,
          t.ring,
          t.text
        )}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <div className="font-semibold text-slate-900 dark:text-white">{title}</div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 group-hover:text-ht-red dark:group-hover:text-ht-yellow transition-all" />
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{desc}</p>
      </div>
    </Link>
  );
};

const Greeting = ({ name, sub, ribbon }: { name?: string; sub: string; ribbon: string }) => (
  <div className="relative overflow-hidden rounded-3xl bg-ht-black text-white p-6 sm:p-8">
    <div className="absolute -top-12 -right-12 w-48 h-48 bg-ht-yellow rounded-full opacity-20 blur-2xl" />
    <div className="absolute top-0 right-0 w-32 h-32 bg-ht-yellow rounded-bl-[80px] opacity-90" />
    <div className="relative">
      <span className="inline-flex items-center gap-1.5 chip-ribbon">
        <Sparkles className="w-3 h-3" />
        {ribbon}
      </span>
      <h1 className="mt-4 text-2xl sm:text-3xl md:text-4xl font-black tracking-tight">
        Bonjour, <span className="text-ht-yellow">{name || "—"}</span>
      </h1>
      <p className="mt-2 text-sm sm:text-base text-slate-300 max-w-2xl">{sub}</p>
    </div>
  </div>
);

const StudentDashboard = () => {
  const { user } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["stats", "student"],
    queryFn: async () => (await api.get("/stats/student")).data,
  });

  const { data: enrollments, isLoading } = useQuery({
    queryKey: ["my-enrollments"],
    queryFn: async () => (await api.get("/enrollments")).data,
  });

  return (
    <div className="space-y-8">
      <Greeting
        name={user?.name}
        ribbon="Espace étudiant"
        sub="Continuez votre apprentissage là où vous l'avez laissé."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={BookOpen} label="Cours inscrits" value={stats?.enrolled ?? 0} tone="gold" />
        <StatCard icon={Award} label="Cours terminés" value={stats?.completed ?? 0} tone="emerald" />
        <StatCard icon={Layers} label="Quiz passés" value={stats?.quizzesTaken ?? 0} tone="ink" />
        <StatCard icon={TrendingUp} label="Score moyen" value={`${stats?.avgScore ?? 0}%`} tone="red" />
      </div>

      <div>
        <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white heading-accent">Mes cours</h2>
          <Link to="/courses" className="btn-ghost text-sm">
            Explorer le catalogue <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {isLoading ? (
          <Spinner />
        ) : enrollments?.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="w-7 h-7" />}
            title="Aucun cours pour le moment"
            message="Explorez le catalogue pour commencer à apprendre."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {enrollments?.map((e: any) => (
              <CourseCard key={e._id} course={e.course} progress={e.progress} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const TeacherDashboard = () => {
  const { user } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["stats", "teacher"],
    queryFn: async () => (await api.get("/stats/teacher")).data,
  });

  return (
    <div className="space-y-8">
      <Greeting
        name={user?.name}
        ribbon="Espace enseignant"
        sub="Voici un aperçu des statistiques de vos cours et de vos étudiants."
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={BookOpen} label="Mes cours" value={stats?.totalCourses ?? 0} tone="gold" />
        <StatCard icon={GraduationCap} label="Étudiants total" value={stats?.totalStudents ?? 0} tone="ink" />
        <StatCard icon={Award} label="Quiz tentés" value={stats?.totalAttempts ?? 0} tone="red" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ActionTile
          to="/teach/grading"
          icon={ScrollText}
          tone="red"
          title="Examens à corriger"
          desc="Notez les questions à réponse libre des examens finaux soumis."
        />
        <ActionTile
          to="/teach"
          icon={GraduationCap}
          tone="gold"
          title="Gérer mes cours"
          desc="Créez, organisez et publiez vos cours, leçons et quiz."
        />
      </div>

      {stats?.perCourse?.length > 0 && (
        <div className="card p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <h2 className="font-bold text-slate-900 dark:text-white text-lg">
              Performance par cours
            </h2>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-ht-black dark:bg-white" /> Inscriptions
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-ht-yellow" /> Score moyen
              </span>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={stats.perCourse}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:opacity-20" />
                <XAxis dataKey="title" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#161925",
                    border: "1px solid #F1D302",
                    borderRadius: 10,
                    color: "white",
                  }}
                  cursor={{ fill: "rgba(241, 211, 2, 0.08)" }}
                />
                <Bar dataKey="enrollments" fill="#161925" radius={[6, 6, 0, 0]} name="Inscriptions" />
                <Bar dataKey="avgScore" fill="#F1D302" radius={[6, 6, 0, 0]} name="Score moyen" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const { data: stats } = useQuery({
    queryKey: ["stats", "admin"],
    queryFn: async () => (await api.get("/admin/stats")).data,
  });

  return (
    <div className="space-y-8">
      <Greeting
        name={user?.name}
        ribbon="Administration"
        sub="Vue d'ensemble de la plateforme — utilisateurs, contenu et signalements."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Utilisateurs" value={stats?.totalUsers ?? 0} tone="gold" />
        <StatCard icon={GraduationCap} label="Enseignants" value={stats?.totalTeachers ?? 0} tone="ink" />
        <StatCard icon={BookOpen} label="Étudiants" value={stats?.totalStudents ?? 0} tone="emerald" />
        <StatCard icon={Flag} label="Signalements ouverts" value={stats?.openReports ?? 0} tone="red" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ActionTile
          to="/admin/users"
          icon={Users}
          tone="gold"
          title="Gérer les membres"
          desc="Lister, filtrer par rôle, créer des comptes (y compris enseignants)."
        />
        <ActionTile
          to="/admin/reports"
          icon={Shield}
          tone="red"
          title="Signalements"
          desc="Examiner les signalements soumis par les utilisateurs."
        />
      </div>
    </div>
  );
};

export const DashboardPage = () => {
  const { user } = useAuth();
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
      {user?.role === "admin" ? (
        <AdminDashboard />
      ) : user?.role === "teacher" ? (
        <TeacherDashboard />
      ) : (
        <StudentDashboard />
      )}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 heading-accent">
          Aide & support
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ActionTile
            to="/report-bug"
            icon={Bug}
            tone="red"
            title="Signaler un bug"
            desc="Un souci sur la plateforme ? Décrivez-le et l'équipe sera notifiée."
          />
        </div>
      </div>
    </div>
  );
};
