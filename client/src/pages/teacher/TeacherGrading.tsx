import { useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Hourglass,
  CheckCircle2,
  ScrollText,
  User,
  ChevronRight,
} from "lucide-react";
import { api } from "@/lib/api";
import { Spinner, EmptyState } from "@/components/Spinner";
import { cn } from "@/lib/utils";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

export const TeacherGradingQueuePage = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["grading", "pending"],
    queryFn: async () => (await api.get("/quizzes/attempts/pending")).data as any[],
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <div>
        <Link
          to="/teach"
          className="inline-flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-ht-red mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Mes cours
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ScrollText className="w-7 h-7 text-ht-red" /> Examens à corriger
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Examens finaux en attente de correction manuelle (questions à réponse
          libre).
        </p>
      </div>

      {isLoading ? (
        <Spinner />
      ) : !data?.length ? (
        <EmptyState
          icon={<CheckCircle2 className="w-10 h-10" />}
          title="Tout est à jour"
          message="Aucun examen en attente de correction."
        />
      ) : (
        <ul className="space-y-3">
          {data.map((a: any) => (
            <li key={a._id}>
              <Link
                to={`/teach/grading/${a._id}`}
                className="card p-4 flex items-center gap-4 hover:shadow-md transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 flex items-center justify-center shrink-0">
                  <Hourglass className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-900 dark:text-white truncate">
                    {a.quiz?.title || "Examen"}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      {a.student?.name || "—"}
                    </span>
                    <span>·</span>
                    <span>{a.pendingItems?.length || 0} question{(a.pendingItems?.length || 0) > 1 ? "s" : ""} à noter</span>
                    <span>·</span>
                    <span>{fmtDate(a.createdAt)}</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export const TeacherGradingDetailPage = () => {
  const { attemptId } = useParams() as { attemptId: string };
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["grading", "detail", attemptId],
    queryFn: async () =>
      (await api.get(`/quizzes/attempts/${attemptId}`)).data,
  });

  const [grades, setGrades] = useState<
    Record<number, { awardedPoints: number; comment: string }>
  >({});

  const pendingItems = useMemo(() => data?.pendingItems || [], [data]);
  const questions = useMemo(() => data?.quiz?.questions || [], [data]);

  const submit = useMutation({
    mutationFn: async () => {
      const items = pendingItems.map((p: any) => ({
        questionIndex: p.questionIndex,
        awardedPoints: grades[p.questionIndex]?.awardedPoints ?? 0,
        comment: grades[p.questionIndex]?.comment,
      }));
      return (
        await api.post(`/quizzes/attempts/${attemptId}/grade`, { items })
      ).data;
    },
    onSuccess: (res: any) => {
      toast.success(`Note finale : ${res.score}%`);
      navigate("/teach/grading");
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Erreur"),
  });

  if (isLoading || !data) return <Spinner />;

  const allGraded = pendingItems.every(
    (p: any) => typeof grades[p.questionIndex]?.awardedPoints === "number"
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <div>
        <Link
          to="/teach/grading"
          className="inline-flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-ht-red mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> File de correction
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          {data.quiz?.title}
        </h1>
        <div className="mt-2 text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
          <User className="w-4 h-4" /> {data.student?.name}{" "}
          <span className="text-slate-400">·</span>
          <span>{data.student?.email}</span>
        </div>
        <div className="mt-1 text-xs text-slate-500">
          Score auto-noté actuel : {data.score}% — la note finale sera recalculée à
          partir des points attribués ci-dessous.
        </div>
      </div>

      <div className="space-y-4">
        {pendingItems.map((p: any) => {
          const q = questions[p.questionIndex];
          const g = grades[p.questionIndex] || { awardedPoints: 0, comment: "" };
          return (
            <div
              key={p.questionIndex}
              className="card p-5 border-l-4 border-ht-yellow"
            >
              <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">
                Question {p.questionIndex + 1}
              </div>
              <div className="font-medium text-slate-900 dark:text-white mb-3">
                {q?.text}
              </div>

              <div className="text-xs font-medium text-slate-500 mb-1">
                Réponse de l'étudiant
              </div>
              <div className="rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-3 text-sm whitespace-pre-wrap mb-3">
                {p.userAnswer || <span className="italic text-slate-400">(réponse vide)</span>}
              </div>

              {q?.expectedAnswer && (
                <>
                  <div className="text-xs font-medium text-slate-500 mb-1">
                    Réponse attendue (référence)
                  </div>
                  <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-900/30 p-3 text-sm whitespace-pre-wrap mb-3">
                    {q.expectedAnswer}
                  </div>
                </>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-medium mb-1">
                    Points (0 – 100%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={5}
                    className="input"
                    value={Math.round((g.awardedPoints || 0) * 100)}
                    onChange={(e) => {
                      const pct = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                      setGrades((s) => ({
                        ...s,
                        [p.questionIndex]: {
                          awardedPoints: pct / 100,
                          comment: g.comment || "",
                        },
                      }));
                    }}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium mb-1">
                    Commentaire (optionnel)
                  </label>
                  <input
                    className="input"
                    value={g.comment || ""}
                    onChange={(e) =>
                      setGrades((s) => ({
                        ...s,
                        [p.questionIndex]: {
                          awardedPoints: g.awardedPoints || 0,
                          comment: e.target.value,
                        },
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-end gap-2">
        <Link to="/teach/grading" className="btn-ghost">
          Annuler
        </Link>
        <button
          onClick={() => submit.mutate()}
          disabled={!allGraded || submit.isPending}
          className={cn("btn-primary", !allGraded && "opacity-50")}
        >
          {submit.isPending ? "Publication..." : "Publier la note"}
        </button>
      </div>
    </div>
  );
};
