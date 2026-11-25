import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { ArrowLeft, ArrowRight, CheckCircle2, ClipboardCheck, Award, ChevronRight, Trophy } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { Spinner } from "@/components/Spinner";
import { MediaViewer } from "@/components/MediaViewer";
import { LessonTutor } from "@/components/LessonTutor";
import { Flashcards } from "@/components/Flashcards";
import { cn } from "@/lib/utils";

export const LessonViewPage = () => {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: courseData } = useQuery({
    queryKey: ["course", courseId],
    queryFn: async () => (await api.get(`/courses/${courseId}`)).data,
  });

  const { data: chapters = [] } = useQuery({
    queryKey: ["chapters", courseId],
    queryFn: async () => (await api.get(`/chapters/course/${courseId}`)).data,
  });

  const { data: lesson, isLoading } = useQuery({
    queryKey: ["lesson", lessonId],
    queryFn: async () => (await api.get(`/lessons/${lessonId}`)).data,
  });

  const { data: enrollment } = useQuery({
    queryKey: ["enrollment", courseId],
    queryFn: async () => (await api.get(`/enrollments/course/${courseId}`)).data,
  });

  const complete = useMutation({
    mutationFn: async () =>
      (await api.post(`/enrollments/${courseId}/complete-lesson/${lessonId}`)).data,
    onSuccess: () => {
      toast.success("Leçon marquée comme terminée !");
      qc.invalidateQueries({ queryKey: ["enrollment", courseId] });
    },
  });

  if (isLoading || !courseData || !lesson) return <Spinner />;

  const lessons = courseData.lessons;
  const quizzes = courseData.quizzes || [];
  const lessonsOfChapter = (chId: string) =>
    lessons.filter((l: any) => String(l.chapter) === String(chId));
  const ungroupedLessons = lessons.filter((l: any) => !l.chapter);
  // Navigate in chapter order (the raw API list is sorted by per-chapter `order`,
  // which interleaves chapters when they share order values).
  const orderedLessons =
    chapters.length > 0
      ? [...chapters.flatMap((ch: any) => lessonsOfChapter(ch._id)), ...ungroupedLessons]
      : lessons;
  const finalExam = quizzes.find((q: any) => q.kind === "final");

  const idx = orderedLessons.findIndex((l: any) => l._id === lessonId);
  const prev = orderedLessons[idx - 1];
  const next = orderedLessons[idx + 1];
  const completedIds = new Set<string>(enrollment?.completedLessons?.map(String) || []);
  const isCompleted = completedIds.has(String(lessonId));
  const lessonQuiz = quizzes.find((q: any) => String(q.lesson) === String(lessonId));

  return (
    <>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 grid lg:grid-cols-[280px_minmax(0,1fr)] gap-8">
      {/* Sidebar */}
      <aside className="min-w-0 lg:sticky lg:top-24 self-start">
        <Link
          to={`/courses/${courseId}`}
          className="text-sm text-slate-600 dark:text-slate-400 hover:text-ht-red dark:hover:text-ht-yellow flex items-center gap-1 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Retour au cours
        </Link>
        <div className="card p-4">
          <h3 className="font-semibold text-sm mb-3 text-slate-900 dark:text-white">
            {courseData.course.title}
          </h3>
          {(() => {
            const lessonRow = (l: any, label: string) => {
              const c = completedIds.has(String(l._id));
              const active = l._id === lessonId;
              return (
                <Link
                  key={l._id}
                  to={`/courses/${courseId}/lessons/${l._id}`}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-lg text-sm transition-colors",
                    active
                      ? "bg-ht-yellow/25 dark:bg-ht-yellow/10 text-ht-black dark:text-ht-yellow font-semibold ring-1 ring-ht-yellow/40"
                      : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                  )}
                >
                  {c ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <span className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-600 shrink-0" />
                  )}
                  <span className="line-clamp-2 break-words min-w-0">{label} {l.title}</span>
                </Link>
              );
            };

            const examRow = (exam: any, opts: { final?: boolean } = {}) => (
              <Link
                to={`/quiz/${exam._id}`}
                className="flex items-center gap-3 p-2 rounded-lg text-sm transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                {opts.final ? (
                  <Trophy className="w-4 h-4 text-ht-red dark:text-ht-yellow shrink-0" />
                ) : (
                  <Award className="w-4 h-4 text-ht-red dark:text-ht-yellow shrink-0" />
                )}
                <span className="line-clamp-2 break-words min-w-0 font-medium">
                  {opts.final ? "Examen final" : "Examen du chapitre"}
                </span>
              </Link>
            );

            if (chapters.length === 0) {
              return (
                <div className="space-y-1">
                  {lessons.map((l: any, i: number) => lessonRow(l, `${i + 1}.`))}
                  {finalExam && examRow(finalExam, { final: true })}
                </div>
              );
            }

            return (
              <div className="space-y-4">
                {chapters.map((ch: any, ci: number) => {
                  const chLessons = lessonsOfChapter(ch._id);
                  const chExam = quizzes.find(
                    (q: any) => q.kind === "chapter" && String(q.chapter) === String(ch._id)
                  );
                  return (
                    <div key={ch._id} className="space-y-1">
                      <div className="px-2 pt-1">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          Chapitre {ci + 1}
                        </div>
                        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {ch.title}
                        </div>
                      </div>
                      {chLessons.map((l: any, li: number) => lessonRow(l, `${ci + 1}.${li + 1}`))}
                      {chExam && examRow(chExam)}
                    </div>
                  );
                })}
                {ungroupedLessons.length > 0 && (
                  <div className="space-y-1">
                    <div className="px-2 pt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Sans chapitre
                    </div>
                    {ungroupedLessons.map((l: any, i: number) => lessonRow(l, `${i + 1}.`))}
                  </div>
                )}
                {finalExam && (
                  <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                    {examRow(finalExam, { final: true })}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </aside>

      {/* Content */}
      <main className="min-w-0 max-w-full">
        <div className="card p-5 sm:p-8 md:p-10 overflow-hidden max-w-full">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2 break-words">
            {lesson.title}
          </h1>
          <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400 mb-6">
            {lesson.duration && <span>{lesson.duration} min de lecture</span>}
            {isCompleted && (
              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                <CheckCircle2 className="w-4 h-4" /> Terminée
              </span>
            )}
          </div>

          {(!lesson.kind || lesson.kind === "text") ? (
            <div className="markdown-body max-w-full min-w-0 overflow-hidden">
              <ReactMarkdown>{lesson.content}</ReactMarkdown>
            </div>
          ) : lesson.mediaUrl ? (
            <>
              <MediaViewer kind={lesson.kind} url={lesson.mediaUrl} />
              {(lesson.kind === "video" || lesson.kind === "audio") && lesson.transcript && (
                <details className="mt-6 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                  <summary className="cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    📝 Transcription
                  </summary>
                  <div className="mt-3 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                    {lesson.transcript}
                  </div>
                </details>
              )}
            </>
          ) : (
            <div className="text-sm text-slate-500 italic">
              Aucun contenu n'a encore été ajouté à cette leçon.
            </div>
          )}

          {lesson.flashcards && lesson.flashcards.length > 0 && (
            <div className="mt-10">
              <Flashcards cards={lesson.flashcards} />
            </div>
          )}

          {lessonQuiz && (
            <div className="mt-10 relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-ht-yellow/30 via-ht-yellow/10 to-transparent dark:from-ht-yellow/15 dark:via-ht-yellow/5 dark:to-transparent border border-ht-yellow/40">
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-ht-yellow/30 rounded-full blur-2xl" />
              <div className="relative flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-ht-black text-ht-yellow flex items-center justify-center shrink-0 shadow-ink">
                  <ClipboardCheck className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-ht-red dark:text-ht-yellow mb-1">
                    Quiz inclus
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                    Testez vos connaissances
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {lessonQuiz.questionCount} questions • Score requis : {lessonQuiz.passingScore}%
                  </p>
                  <Link to={`/quiz/${lessonQuiz._id}`} className="btn-accent mt-4">
                    Commencer le quiz <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-4 mt-6">
          {prev ? (
            <Link
              to={`/courses/${courseId}/lessons/${prev._id}`}
              className="btn-secondary"
            >
              <ArrowLeft className="w-4 h-4" /> Précédent
            </Link>
          ) : (
            <div />
          )}

          <button
            onClick={() => !isCompleted && complete.mutate()}
            disabled={isCompleted || complete.isPending}
            className={cn(
              "btn",
              isCompleted
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                : "btn-primary"
            )}
          >
            {isCompleted ? (
              <><CheckCircle2 className="w-4 h-4" /> Terminée</>
            ) : (
              "Marquer comme terminée"
            )}
          </button>

          {next ? (
            <Link
              to={`/courses/${courseId}/lessons/${next._id}`}
              className="btn-secondary"
            >
              Suivant <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <button onClick={() => navigate(`/courses/${courseId}`)} className="btn-secondary">
              Terminer
            </button>
          )}
        </div>
      </main>
    </div>
    {(!lesson.kind || lesson.kind === "text") && (
      <LessonTutor lessonId={String(lessonId)} />
    )}
    </>
  );
};
