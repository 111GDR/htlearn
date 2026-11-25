import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  GraduationCap,
  BookOpen,
  Award,
  BarChart3,
  Sparkles,
  ArrowRight,
  Users,
  CheckCircle,
} from "lucide-react";
import { api } from "@/lib/api";
import { CourseCard } from "@/components/CourseCard";

const features = [
  {
    icon: BookOpen,
    title: "Cours interactifs",
    desc: "Des leçons claires créées par des enseignants experts, accessibles à tout moment.",
  },
  {
    icon: Award,
    title: "Quiz & évaluations",
    desc: "Testez vos connaissances avec des quiz instantanés et des explications détaillées.",
  },
  {
    icon: BarChart3,
    title: "Suivi de progression",
    desc: "Visualisez votre avancement et vos performances grâce à des tableaux de bord clairs.",
  },
  {
    icon: Users,
    title: "Espace enseignant",
    desc: "Outils complets pour créer, organiser et publier vos cours et quiz.",
  },
];

export const HomePage = () => {
  const { data: courses } = useQuery({
    queryKey: ["courses", "home-preview"],
    queryFn: async () => {
      const { data } = await api.get("/courses");
      return data;
    },
  });
  const previewCourses = (courses || []).slice(0, 6);

  return (
    <div className="min-h-screen">
      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden">
        {/* yellow tint base */}
        <div className="absolute inset-0 bg-gradient-to-br from-ht-yellow/30 via-white to-white dark:from-ht-yellow/10 dark:via-slate-950 dark:to-slate-950" />
        {/* subtle grid */}
        <div className="absolute inset-0 bg-ht-grid [background-size:40px_40px] opacity-40 dark:opacity-20" />
        {/* animated blobs */}
        <div className="absolute -top-32 -right-20 w-[480px] h-[480px] bg-ht-yellow/40 rounded-full blur-3xl motion-safe:animate-blob" />
        <div className="absolute -bottom-32 -left-20 w-[420px] h-[420px] bg-ht-red/20 rounded-full blur-3xl motion-safe:animate-blob" />

        <div className="relative max-w-7xl mx-auto px-5 sm:px-6 py-20 md:py-28 lg:py-32">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Text */}
            <div className="lg:col-span-7 animate-slide-up text-center lg:text-left">
              <div className="flex flex-wrap items-center gap-2 justify-center lg:justify-start">
                <span className="chip-ribbon">
                  <Sparkles className="w-3 h-3" />
                  Inspiré par l'École High-Tech
                </span>
              </div>

              <h1 className="mt-6 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.05]">
                Apprenez avec <br className="hidden sm:block" />
                <span className="relative inline-block">
                  <span className="relative z-10 px-2">HtLearn</span>
                  <span className="absolute inset-x-0 bottom-1 h-4 sm:h-5 bg-ht-yellow -z-0 -skew-x-3" />
                </span>
              </h1>

              <p className="mt-6 text-base sm:text-lg md:text-xl text-slate-700 dark:text-slate-300 max-w-2xl mx-auto lg:mx-0">
                La plateforme e-learning où les enseignants partagent leur savoir et où
                les étudiants progressent à leur rythme — leçons, quiz, suivi, tout y est.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row flex-wrap items-center justify-center lg:justify-start gap-3">
                <Link to="/login" className="btn-primary text-base px-6 py-3 w-full sm:w-auto">
                  Se connecter <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/courses" className="btn-accent text-base px-6 py-3 w-full sm:w-auto">
                  Découvrir les cours
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2 text-sm text-slate-600 dark:text-slate-400">
                {["Comptes créés par l'école", "Plateforme sécurisée", "Accès immédiat"].map((t) => (
                  <span key={t} className="flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-ht-red" /> {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Visual card */}
            <div className="lg:col-span-5 relative hidden lg:block">
              <div className="relative">
                <div className="absolute -inset-4 bg-ht-yellow rounded-3xl rotate-3" />
                <div className="relative card p-6 rotate-[-2deg] shadow-ink">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2.5 h-2.5 rounded-full bg-ht-red" />
                    <div className="w-2.5 h-2.5 rounded-full bg-ht-yellow" />
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                    <span className="ml-2 text-xs text-slate-500">htlearn.com</span>
                  </div>
                  <div className="space-y-3">
                    {[
                      { title: "Algorithmique avancée", pct: 86, level: "Avancé" },
                      { title: "Marketing digital", pct: 64, level: "Intermédiaire" },
                      { title: "UI Design", pct: 32, level: "Débutant" },
                    ].map((c) => (
                      <div
                        key={c.title}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-semibold text-sm text-slate-900 dark:text-white">
                            {c.title}
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-ht-black bg-ht-yellow px-2 py-0.5 rounded">
                            {c.level}
                          </span>
                        </div>
                        <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-ht-black dark:bg-ht-yellow"
                            style={{ width: `${c.pct}%` }}
                          />
                        </div>
                        <div className="mt-1 text-[11px] text-slate-500 text-right">{c.pct}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FEATURES ============ */}
      <section className="max-w-7xl mx-auto px-5 sm:px-6 py-20">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="chip-ribbon mb-4">Pourquoi HtLearn</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            Tout ce qu'il faut pour <span className="text-ht-red">réussir</span>
          </h2>
          <p className="mt-4 text-slate-600 dark:text-slate-400">
            Des outils pensés pour les étudiants et les enseignants.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="group relative card p-6 hover:shadow-xl hover:-translate-y-1 transition-all overflow-hidden"
            >
              <div className="absolute top-0 left-0 h-1 w-12 bg-ht-yellow group-hover:w-full transition-all duration-500" />
              <div className="w-12 h-12 rounded-xl bg-ht-yellow/20 group-hover:bg-ht-yellow flex items-center justify-center text-ht-black mb-4 transition-colors">
                <f.icon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">
                {f.title}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">{f.desc}</p>
              <div className="mt-4 text-xs font-bold text-slate-300 dark:text-slate-700">
                0{i + 1}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============ COURSES PREVIEW ============ */}
      {previewCourses.length > 0 && (
        <section className="max-w-7xl mx-auto px-5 sm:px-6 pb-20">
          <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
            <div>
              <span className="chip-ribbon mb-3">Sélection</span>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white heading-accent">
                Cours populaires
              </h2>
              <p className="mt-4 text-slate-600 dark:text-slate-400">
                Un aperçu de ce que vous pouvez apprendre dès maintenant.
              </p>
            </div>
            <Link to="/courses" className="btn-ghost">
              Voir tous les cours <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {previewCourses.map((c: any) => (
              <CourseCard key={c._id} course={c} />
            ))}
          </div>

          <div className="mt-10 flex justify-center">
            <Link to="/courses" className="btn-primary text-base px-6 py-3">
              Voir plus de cours <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      )}

      {/* ============ CTA ============ */}
      <section className="max-w-7xl mx-auto px-5 sm:px-6 pb-24">
        <div className="relative rounded-3xl bg-ht-black p-8 sm:p-12 md:p-16 text-white shadow-xl overflow-hidden">
          {/* yellow corner */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-ht-yellow rounded-bl-[100px]" />
          <div className="absolute -bottom-20 -left-10 w-80 h-80 bg-ht-yellow/10 rounded-full blur-3xl" />
          {/* red ribbon */}
          <div className="absolute top-6 left-0 chip-ribbon rounded-none rounded-r-md">
            Rejoignez-nous
          </div>

          <div className="relative pt-10 md:pt-6 max-w-3xl">
            <GraduationCap className="w-12 h-12 mb-4 text-ht-yellow" />
            <h2 className="text-3xl md:text-5xl font-black leading-tight">
              Prêt à commencer votre
              <span className="block text-ht-yellow">parcours d'apprentissage ?</span>
            </h2>
            <p className="mt-4 text-slate-300 max-w-xl">
              Vous êtes étudiant ou enseignant à l'École High-Tech ? Connectez-vous avec les
              identifiants envoyés par l'administration.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
              <Link to="/login" className="btn-accent text-base px-6 py-3">
                Se connecter <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/courses"
                className="btn text-base px-6 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20"
              >
                Voir le catalogue
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-300">
              {["Identifiants envoyés par email", "Mot de passe sécurisé", "Accès immédiat"].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-ht-yellow" /> {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <span className="font-extrabold text-slate-900 dark:text-white">Ht</span>
            <span className="font-extrabold text-ht-red">Learn</span>
            <span className="hidden sm:inline">— Plateforme d'apprentissage moderne.</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="hidden md:inline">
              Astuce : appuyez sur{" "}
              <kbd className="px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-[10px]">?</kbd>{" "}
              pour voir les raccourcis
            </span>
            <span>
              © {new Date().getFullYear()} HtLearn. Inspiré par l'École High-Tech.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
