import { useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BookOpen, CheckCircle2, Clock, PlayCircle, ClipboardCheck, Award, ArrowRight, Lock, Trophy } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { Spinner } from "@/components/Spinner";
import { ReportButton } from "@/components/ReportButton";
import { CourseReviews } from "@/components/CourseReviews";
import { BookmarkButton } from "@/components/BookmarkButton";
import { useAuth } from "@/store/auth";
import { cn } from "@/lib/utils";

export const CourseDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["course", id],
    queryFn: async () => (await api.get(`/courses/${id}`)).data,
  });

  const { data: chapters = [] } = useQuery({
    queryKey: ["chapters", id],
    queryFn: async () => (await api.get(`/chapters/course/${id}`)).data,
  });

  const { data: enrollment } = useQuery({
    queryKey: ["enrollment", id],
    enabled: !!user && user.role === "student",
    queryFn: async () => (await api.get(`/enrollments/course/${id}`)).data,
  });

  // Final-exam eligibility check (student-only, when a final exists)
  const finalExam = data?.quizzes?.find((q: any) => q.kind === "final");
  const { data: eligibility } = useQuery({
    queryKey: ["final-can-attempt", finalExam?._id],
    enabled: !!finalExam && !!user && user.role === "student" && !!enrollment,
    queryFn: async () =>
      (await api.get(`/quizzes/${finalExam._id}/can-attempt`)).data as {
        allowed: boolean;
        missing?: { chapter: string; status: "no-exam" | "not-passed"; best?: number }[];
      },
  });

  // Scroll to the final-exam section when arriving with #examen-final
  // (e.g. after submitting a chapter exam). Waits for eligibility so the
  // unlocked/locked state is rendered before scrolling.
  useEffect(() => {
    if (window.location.hash !== "#examen-final") return;
    if (!finalExam) return;
    const studentNeedsEligibility =
      !!user && user.role === "student" && !!enrollment;
    if (studentNeedsEligibility && !eligibility) return;
    const el = document.getElementById("examen-final");
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    history.replaceState(null, "", window.location.pathname);
  }, [finalExam?._id, eligibility, enrollment, user?.role]);

  const enroll = useMutation({
    mutationFn: async () => (await api.post(`/enrollments/${id}`)).data,
    onSuccess: () => {
      toast.success("Inscription au cours réussie !");
      qc.invalidateQueries({ queryKey: ["enrollment", id] });
    },
  });

  if (isLoading) return <Spinner />;
  if (!data) return null;

  const { course, lessons, quizzes } = data;
  const isEnrolled = !!enrollment;
  const completedIds = new Set(enrollment?.completedLessons?.map(String) || []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="relative rounded-2xl overflow-hidden h-64 sm:h-72 bg-ht-black shadow-ink">
            {course.thumbnail ? (
              <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
            ) : (
              <>
                <div className="absolute inset-0 bg-gradient-to-br from-ht-black via-slate-900 to-ht-black" />
                <div className="absolute inset-0 bg-ht-grid [background-size:32px_32px] opacity-25" />
                <div className="absolute -top-16 -right-16 w-56 h-56 bg-ht-yellow rounded-bl-[120px] opacity-90" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <BookOpen className="w-20 h-20 text-white/70" />
                </div>
              </>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="badge bg-ht-yellow/30 text-ht-black dark:bg-ht-yellow/20 dark:text-ht-yellow">
                {course.category}
              </span>
              <span className="badge bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {course.level}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
              {course.title}
            </h1>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
              {course.description}
            </p>
            <div className="mt-3">
              <ReportButton targetType="course" targetId={course._id} label="Signaler ce cours" />
            </div>
          </div>

          <div className="card p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-ht-yellow flex items-center justify-center text-ht-black font-extrabold ring-1 ring-ht-black/10">
              {course.teacher?.name?.[0] || "?"}
            </div>
            <div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Enseignant</div>
              <div className="font-semibold text-slate-900 dark:text-white">{course.teacher?.name}</div>
              {course.teacher?.bio && (
                <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">{course.teacher.bio}</div>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Programme du cours
            </h2>

            {(() => {
              const renderLessonRow = (lesson: any, displayIndex: number) => {
                const lessonQuiz = quizzes.find(
                  (q: any) =>
                    (q.kind === "practice" || !q.kind) &&
                    String(q.lesson) === String(lesson._id)
                );
                const isCompleted = completedIds.has(String(lesson._id));
                return (
                  <div
                    key={lesson._id}
                    className={cn(
                      "card p-4 flex items-center gap-4 transition-all",
                      isEnrolled && "hover:shadow-md hover:border-ht-yellow"
                    )}
                  >
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold",
                        isCompleted
                          ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"
                          : "bg-ht-yellow/30 text-ht-black dark:bg-ht-yellow/15 dark:text-ht-yellow"
                      )}
                    >
                      {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <span className="font-bold">{displayIndex}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-900 dark:text-white">{lesson.title}</div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {lesson.duration && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> {lesson.duration} min
                          </span>
                        )}
                        {lessonQuiz && (
                          <span className="flex items-center gap-1">
                            <ClipboardCheck className="w-3.5 h-3.5" /> Quiz inclus
                          </span>
                        )}
                      </div>
                    </div>
                    {isEnrolled && (
                      <Link
                        to={`/courses/${id}/lessons/${lesson._id}`}
                        className="btn-secondary text-xs"
                      >
                        <PlayCircle className="w-4 h-4" /> Voir
                      </Link>
                    )}
                  </div>
                );
              };

              if (lessons.length === 0) {
                return (
                  <div className="card p-8 text-center text-sm text-slate-500">
                    Aucune leçon publiée pour le moment.
                  </div>
                );
              }

              if (chapters.length === 0) {
                return (
                  <div className="space-y-3">
                    {lessons.map((l: any, i: number) => renderLessonRow(l, i + 1))}
                  </div>
                );
              }

              // Grouped view by chapter
              let counter = 0;
              const ungrouped = lessons.filter((l: any) => !l.chapter);
              return (
                <div className="space-y-6">
                  {chapters.map((ch: any, ci: number) => {
                    const chLessons = lessons.filter(
                      (l: any) => String(l.chapter) === String(ch._id)
                    );
                    const chExam = quizzes.find(
                      (q: any) =>
                        q.kind === "chapter" &&
                        String(q.chapter) === String(ch._id)
                    );
                    return (
                      <div key={ch._id} className="space-y-3">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-ht-yellow text-ht-black font-extrabold text-sm shadow-sm">
                            C{ci + 1}
                          </span>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {ch.title}
                            </div>
                            {ch.description && (
                              <div className="text-xs text-slate-500">
                                {ch.description}
                              </div>
                            )}
                          </div>
                        </div>
                        {chLessons.map((l: any) => {
                          counter += 1;
                          return renderLessonRow(l, counter);
                        })}
                        {chExam && isEnrolled && (
                          <Link
                            to={`/quiz/${chExam._id}`}
                            className="card p-4 flex items-center gap-4 border-2 border-ht-yellow/40 hover:border-ht-yellow transition-all"
                          >
                            <div className="w-10 h-10 rounded-full bg-ht-yellow text-ht-black flex items-center justify-center shrink-0">
                              <Award className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-slate-900 dark:text-white">
                                Examen de chapitre
                              </div>
                              <div className="text-xs text-slate-500">
                                {chExam.questionCount} questions · Score requis {chExam.passingScore || 60}%
                              </div>
                            </div>
                            <span className="btn-primary text-xs">
                              Passer l'examen <ArrowRight className="w-4 h-4" />
                            </span>
                          </Link>
                        )}
                      </div>
                    );
                  })}
                  {ungrouped.length > 0 && (
                    <div className="space-y-3">
                      <div className="text-xs uppercase tracking-wider font-semibold text-slate-500">
                        Sans chapitre
                      </div>
                      {ungrouped.map((l: any) => {
                        counter += 1;
                        return renderLessonRow(l, counter);
                      })}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {finalExam && (
            <div id="examen-final" className="scroll-mt-24">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Trophy className="w-6 h-6 text-ht-red" /> Examen final
              </h2>
              {(() => {
                const minutes = Math.round((finalExam.timeLimitSec || 0) / 60);
                const allowed = !!eligibility?.allowed;
                const missing = eligibility?.missing || [];
                const showCard = (
                  <div
                    className={cn(
                      "card p-5 border-2",
                      isEnrolled && allowed
                        ? "border-ht-red/40 hover:border-ht-red transition-all"
                        : "border-slate-200 dark:border-slate-800 opacity-90"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                          isEnrolled && allowed
                            ? "bg-ht-red text-white"
                            : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                        )}
                      >
                        {isEnrolled && allowed ? (
                          <Trophy className="w-6 h-6" />
                        ) : (
                          <Lock className="w-5 h-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {finalExam.title}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {finalExam.questionCount} questions · {minutes} min · Score requis{" "}
                          {finalExam.passingScore}%
                        </div>
                        {isEnrolled && !allowed && (
                          <div className="mt-3 text-xs text-slate-600 dark:text-slate-400">
                            <div className="font-medium mb-1">
                              Débloqué quand tous les examens de chapitre sont réussis (≥60%) :
                            </div>
                            <ul className="space-y-0.5">
                              {missing.map((m, i) => (
                                <li key={i} className="flex items-center gap-1.5">
                                  <Lock className="w-3 h-3" />
                                  <span>
                                    {m.chapter}
                                    {m.status === "no-exam"
                                      ? " — aucun examen défini"
                                      : ` — meilleur score ${m.best ?? 0}%`}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {!isEnrolled && (
                          <div className="mt-2 text-xs text-slate-500">
                            Inscrivez-vous au cours pour accéder à l'examen final.
                          </div>
                        )}
                      </div>
                      {isEnrolled && allowed && (
                        <Link to={`/quiz/${finalExam._id}`} className="btn-primary text-xs shrink-0 self-center">
                          Commencer <ArrowRight className="w-4 h-4" />
                        </Link>
                      )}
                    </div>
                  </div>
                );
                return showCard;
              })()}
            </div>
          )}

          <CourseReviews
            courseId={String(course._id)}
            canReview={!!user && user.role === "student" && isEnrolled}
          />
        </div>

        {/* Sidebar */}
        <div className="lg:sticky lg:top-24 self-start">
          <div className="card p-6 space-y-4">
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Leçons</span>
                <span className="font-semibold">{lessons.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Quiz</span>
                <span className="font-semibold">{quizzes.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Niveau</span>
                <span className="font-semibold">{course.level}</span>
              </div>
            </div>

            {isEnrolled && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center mb-2 text-sm">
                  <span className="font-medium">Votre progression</span>
                  <span className="text-ht-black dark:text-ht-yellow font-extrabold">
                    {enrollment.progress}%
                  </span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-ht-yellow to-ht-red transition-all duration-500"
                    style={{ width: `${enrollment.progress}%` }}
                  />
                </div>
              </div>
            )}

            {!user ? (
              <button onClick={() => navigate("/login")} className="btn-primary w-full">
                Connexion pour s'inscrire
              </button>
            ) : user.role !== "student" ? (
              <div className="text-xs text-slate-500 text-center">
                Les enseignants ne peuvent pas s'inscrire
              </div>
            ) : isEnrolled ? (
              lessons[0] && (
                <Link
                  to={`/courses/${id}/lessons/${lessons[0]._id}`}
                  className="btn-primary w-full"
                >
                  Continuer <ArrowRight className="w-4 h-4" />
                </Link>
              )
            ) : (
              <button
                onClick={() => enroll.mutate()}
                disabled={enroll.isPending}
                className="btn-primary w-full"
              >
                {enroll.isPending ? "..." : "S'inscrire au cours"}
              </button>
            )}

            {user?.role === "student" && (
              <BookmarkButton courseId={String(course._id)} variant="full" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
