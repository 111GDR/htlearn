import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { CheckCircle2, XCircle, Award, RotateCcw, ChevronRight, Lightbulb, ArrowUp, ArrowDown, GripVertical, Clock, Hourglass } from "lucide-react";
import { api } from "@/lib/api";
import { Spinner } from "@/components/Spinner";
import { MediaViewer } from "@/components/MediaViewer";
import { useDragReorder } from "@/lib/useDragReorder";
import { cn } from "@/lib/utils";
import { playCorrect, playWrong, playPassed, playFailed } from "@/lib/sound";

type QuestionType = "mcq" | "tf" | "fill" | "order" | "text";

interface QuestionMedia {
  kind: "pdf" | "video" | "audio";
  url: string;
}

interface QuizQuestion {
  type: QuestionType;
  text: string;
  options?: string[];
  blankCount?: number;
  items?: string[];
  media?: QuestionMedia;
}

type Answer = number | boolean | string | string[];

interface ResultDetail {
  type: QuestionType;
  text: string;
  options?: string[];
  correctIndex?: number;
  correctBool?: boolean;
  blanks?: string[];
  items?: string[];
  userAnswer: Answer;
  isCorrect: boolean;
  explanation?: string;
}

interface QuizResult {
  status: "graded" | "pending";
  score?: number;
  passed?: boolean;
  correct?: number;
  total?: number;
  detail?: ResultDetail[];
  attemptId?: string;
  message?: string;
}

interface CheckResult {
  type: QuestionType;
  isCorrect?: boolean;
  pending?: boolean;
  explanation?: string;
  correctIndex?: number;
  correctBool?: boolean;
  blanks?: string[];
  items?: string[];
}

const OrderAnswer = ({
  items,
  onChange,
  onMove,
  disabled,
}: {
  items: string[];
  onChange: (next: string[]) => void;
  onMove: (from: number, to: number) => void;
  disabled?: boolean;
}) => {
  const { handlers, dragging, over } = useDragReorder(items, disabled ? () => {} : onChange);

  return (
    <div className="space-y-2">
      <div className="text-xs text-slate-500 mb-2">
        Glissez n'importe quel élément ou utilisez les flèches pour réordonner.
      </div>
      {items.map((item, ii) => {
        const isDragging = dragging === ii;
        const isOver = over === ii && dragging !== null && dragging !== ii;
        return (
          <div
            key={`${item}-${ii}`}
            {...(disabled ? {} : handlers(ii))}
            className={cn(
              "group flex items-center gap-3 p-3 rounded-lg border-2 bg-white dark:bg-slate-900 transition-all",
              disabled
                ? "cursor-not-allowed opacity-80"
                : "cursor-grab active:cursor-grabbing select-none",
              isDragging && "opacity-40 scale-[0.99]",
              isOver
                ? "border-ht-yellow ring-2 ring-ht-yellow/40"
                : "border-slate-200 dark:border-slate-700",
              !disabled && "hover:border-ht-yellow/60"
            )}
            title={disabled ? undefined : "Glisser pour réordonner"}
          >
            <GripVertical
              className="w-4 h-4 text-slate-300 group-hover:text-ht-yellow shrink-0"
              aria-hidden="true"
            />
            <span className="w-6 h-6 rounded-full bg-ht-yellow text-ht-black flex items-center justify-center text-xs font-extrabold shrink-0">
              {ii + 1}
            </span>
            <span className="flex-1 text-slate-900 dark:text-white">{item}</span>
            <div className="flex flex-col cursor-default" draggable={false}>
              <button
                type="button"
                draggable={false}
                disabled={disabled || ii === 0}
                onClick={() => onMove(ii, ii - 1)}
                className="text-slate-400 hover:text-ht-red dark:hover:text-ht-yellow disabled:opacity-30 transition-colors"
                aria-label="Monter"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
              <button
                type="button"
                draggable={false}
                disabled={disabled || ii === items.length - 1}
                onClick={() => onMove(ii, ii + 1)}
                className="text-slate-400 hover:text-ht-red dark:hover:text-ht-yellow disabled:opacity-30 transition-colors"
                aria-label="Descendre"
              >
                <ArrowDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const renderFillText = (text: string, fills: string[], onChange?: (i: number, v: string) => void) => {
  const parts = text.split("___");
  return (
    <span className="leading-loose">
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 &&
            (onChange ? (
              <input
                value={fills[i] || ""}
                onChange={(e) => onChange(i, e.target.value)}
                className="inline-block mx-1 px-2 py-0.5 min-w-[100px] border-b-2 border-ht-yellow/60 focus:outline-none focus:border-ht-yellow bg-transparent text-ht-black dark:text-ht-yellow font-semibold"
                placeholder="…"
              />
            ) : (
              <span className="inline-block mx-1 px-2 py-0.5 min-w-[60px] text-center font-semibold bg-ht-yellow/30 dark:bg-ht-yellow/15 text-ht-black dark:text-ht-yellow rounded">
                {fills[i] || "—"}
              </span>
            ))}
        </span>
      ))}
    </span>
  );
};

export const QuizPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<Record<number, Answer>>({});
  const [checked, setChecked] = useState<Record<number, CheckResult>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [remainingSec, setRemainingSec] = useState<number | null>(null);

  const { data: quiz, isLoading } = useQuery({
    queryKey: ["quiz", id],
    queryFn: async () => (await api.get(`/quizzes/${id}`)).data,
  });

  // Start the server-side clock when a final exam is loaded
  useEffect(() => {
    if (!quiz || quiz.kind !== "final" || startedAt) return;
    (async () => {
      try {
        const { data } = await api.post(`/quizzes/${id}/start`);
        setStartedAt(data.startedAt);
        if (data.timeLimitSec) setRemainingSec(data.timeLimitSec);
      } catch (e) {
        // Fall back to client-side anchor if /start fails
        setStartedAt(new Date().toISOString());
        if (quiz.timeLimitSec) setRemainingSec(quiz.timeLimitSec);
      }
    })();
  }, [quiz, startedAt, id]);

  const submit = useMutation({
    mutationFn: async () => {
      const arr = quiz.questions.map((q: QuizQuestion, i: number) => {
        const a = answers[i];
        if (q.type === "mcq") return typeof a === "number" ? a : -1;
        if (q.type === "tf") return typeof a === "boolean" ? a : null;
        if (q.type === "fill") return Array.isArray(a) ? a : new Array(q.blankCount || 0).fill("");
        if (q.type === "order") return Array.isArray(a) ? a : q.items || [];
        if (q.type === "text") return typeof a === "string" ? a : "";
        return -1;
      });
      return (
        await api.post(`/quizzes/${id}/attempt`, {
          answers: arr,
          startedAt: startedAt || undefined,
        })
      ).data as QuizResult;
    },
    onSuccess: (data) => {
      setResult(data);
      if (data.status === "graded") {
        // Master tone for the overall result.
        // Per-question feedback sounds already played during the quiz.
        if (data.passed) playPassed();
        else playFailed();
      }
    },
  });

  const check = useMutation({
    mutationFn: async (qIndex: number) => {
      const a = answers[qIndex];
      return (
        await api.post(`/quizzes/${id}/check`, {
          questionIndex: qIndex,
          answer: a,
        })
      ).data as CheckResult;
    },
    onSuccess: (data, qIndex) => {
      setChecked((prev) => ({ ...prev, [qIndex]: data }));
      if (data.pending) return;
      if (data.isCorrect) playCorrect();
      else playWrong();
    },
  });

  // Countdown for final exam
  useEffect(() => {
    if (remainingSec === null || result) return;
    if (remainingSec <= 0) {
      if (!submit.isPending) submit.mutate();
      return;
    }
    const t = window.setTimeout(() => setRemainingSec((s) => (s === null ? null : s - 1)), 1000);
    return () => window.clearTimeout(t);
  }, [remainingSec, result, submit]);

  if (isLoading || !quiz) return <Spinner />;

  if (result?.status === "pending") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="card p-8 md:p-10 text-center animate-slide-up">
          <div className="inline-flex w-20 h-20 rounded-full items-center justify-center mb-4 bg-amber-100 text-amber-600 dark:bg-amber-900/40">
            <Hourglass className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Examen soumis
          </h1>
          <p className="mt-3 text-slate-600 dark:text-slate-400 leading-relaxed">
            {result.message ||
              "Votre examen contient des questions à réponse libre. Vos résultats seront publiés après correction par l'enseignant."}
          </p>
          <button
            onClick={() => {
              if (quiz?.kind === "chapter" && quiz?.course) {
                navigate(`/courses/${quiz.course}#examen-final`);
              } else {
                navigate(-1);
              }
            }}
            className="btn-primary mt-6"
          >
            Retour au cours
          </button>
        </div>
      </div>
    );
  }

  if (result?.status === "graded") {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="card p-8 md:p-10 text-center animate-slide-up">
          <div
            className={cn(
              "inline-flex w-20 h-20 rounded-full items-center justify-center mb-4",
              result.passed
                ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40"
                : "bg-amber-100 text-amber-600 dark:bg-amber-900/40"
            )}
          >
            <Award className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            {result.passed ? "Bravo !" : "Continuez vos efforts !"}
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Vous avez obtenu {result.correct} bonnes réponses sur {result.total}.
          </p>
          <div className="mt-6 inline-flex items-baseline gap-1">
            <span
              className={cn(
                "text-6xl font-extrabold",
                result.passed ? "text-emerald-600" : "text-amber-600"
              )}
            >
              {result.score}
            </span>
            <span className="text-2xl text-slate-400">%</span>
          </div>
          <div className="text-sm text-slate-500 mt-2">Score requis : {quiz.passingScore}%</div>
        </div>

        <div className="mt-8 space-y-4">
          {(result.detail || []).map((d, i) => (
            <div
              key={i}
              className={cn(
                "card p-5",
                d.isCorrect ? "border-l-4 border-emerald-500" : "border-l-4 border-red-500"
              )}
            >
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => (d.isCorrect ? playCorrect() : playWrong())}
                  className="shrink-0 mt-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 p-0.5 cursor-pointer transition-colors"
                  aria-label={d.isCorrect ? "Bonne réponse, rejouer le son" : "Mauvaise réponse, rejouer le son"}
                  title="Rejouer le son"
                >
                  {d.isCorrect ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                </button>
                <div className="flex-1">
                  <div className="font-medium text-slate-900 dark:text-white">
                    {i + 1}. {d.type === "fill" ? renderFillText(d.text, Array.isArray(d.userAnswer) ? d.userAnswer as string[] : []) : d.text}
                  </div>

                  {d.type === "mcq" && d.options && (
                    <div className="mt-3 space-y-1.5">
                      {d.options.map((opt, oi) => (
                        <div
                          key={oi}
                          className={cn(
                            "text-sm px-3 py-1.5 rounded-lg",
                            oi === d.correctIndex && "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 font-medium",
                            oi === d.userAnswer && oi !== d.correctIndex && "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 line-through"
                          )}
                        >
                          {opt}
                        </div>
                      ))}
                    </div>
                  )}

                  {d.type === "tf" && (
                    <div className="mt-3 flex flex-wrap gap-2 text-sm">
                      {[true, false].map((b) => (
                        <span
                          key={String(b)}
                          className={cn(
                            "px-3 py-1 rounded-md",
                            b === d.correctBool && "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 font-medium",
                            b === d.userAnswer && b !== d.correctBool && "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 line-through",
                            b !== d.correctBool && b !== d.userAnswer && "bg-slate-100 dark:bg-slate-800 text-slate-500"
                          )}
                        >
                          {b ? "Vrai" : "Faux"}
                        </span>
                      ))}
                    </div>
                  )}

                  {d.type === "fill" && d.blanks && (
                    <div className="mt-3 text-sm">
                      <div className="text-slate-500 mb-1">Réponses correctes :</div>
                      <div className="flex flex-wrap gap-1.5">
                        {d.blanks.map((b, bi) => (
                          <span key={bi} className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 rounded font-medium">
                            #{bi + 1} {b}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {d.type === "order" && d.items && (
                    <div className="mt-3 text-sm space-y-2">
                      <div>
                        <div className="text-slate-500 mb-1">Votre réponse :</div>
                        <ol className="list-decimal list-inside text-slate-700 dark:text-slate-300">
                          {(Array.isArray(d.userAnswer) ? (d.userAnswer as string[]) : []).map((it, ii) => (
                            <li key={ii} className={cn(it === d.items![ii] ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400")}>
                              {it}
                            </li>
                          ))}
                        </ol>
                      </div>
                      {!d.isCorrect && (
                        <div>
                          <div className="text-slate-500 mb-1">Ordre correct :</div>
                          <ol className="list-decimal list-inside text-emerald-700 dark:text-emerald-400">
                            {d.items.map((it, ii) => <li key={ii}>{it}</li>)}
                          </ol>
                        </div>
                      )}
                    </div>
                  )}

                  {d.explanation && (
                    <div className="mt-3 flex gap-2 text-sm bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 p-3 rounded-lg">
                      <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{d.explanation}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 justify-center mt-8">
          <button
            onClick={() => {
              setResult(null);
              setAnswers({});
              setChecked({});
              setCurrentQ(0);
            }}
            className="btn-secondary"
          >
            <RotateCcw className="w-4 h-4" /> Réessayer
          </button>
          <button
            onClick={() => {
              if (quiz?.kind === "chapter" && quiz?.course) {
                navigate(`/courses/${quiz.course}#examen-final`);
              } else {
                navigate(-1);
              }
            }}
            className="btn-primary"
          >
            Retour à la leçon
          </button>
        </div>
      </div>
    );
  }

  const q: QuizQuestion = quiz.questions[currentQ];
  const total = quiz.questions.length;
  const currentChecked = checked[currentQ];
  const isLocked = currentChecked !== undefined;

  const isAnswered = (i: number) => {
    const qq: QuizQuestion = quiz.questions[i];
    const a = answers[i];
    if (qq.type === "mcq") return typeof a === "number" && a >= 0;
    if (qq.type === "tf") return typeof a === "boolean";
    if (qq.type === "fill") return Array.isArray(a) && a.length === (qq.blankCount || 0) && a.every((v) => v && v.trim());
    if (qq.type === "order") return Array.isArray(a) && a.length === (qq.items?.length || 0);
    if (qq.type === "text") return typeof a === "string" && a.trim().length > 0;
    return false;
  };
  const allChecked = quiz.questions.every((_: QuizQuestion, i: number) => checked[i] !== undefined);

  const orderAnswer = (q.type === "order" ? (answers[currentQ] as string[] | undefined) || q.items || [] : []) as string[];

  const moveOrderItem = (from: number, to: number) => {
    if (isLocked) return;
    if (to < 0 || to >= orderAnswer.length) return;
    const next = [...orderAnswer];
    [next[from], next[to]] = [next[to], next[from]];
    setAnswers({ ...answers, [currentQ]: next });
  };

  const updateAnswer = (val: Answer) => {
    if (isLocked) return;
    setAnswers({ ...answers, [currentQ]: val });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="card p-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3 gap-3">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{quiz.title}</h1>
            <div className="flex items-center gap-3">
              {remainingSec !== null && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-sm font-bold tabular-nums",
                    remainingSec <= 60
                      ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 animate-pulse"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                  )}
                >
                  <Clock className="w-4 h-4" />
                  {Math.floor(Math.max(0, remainingSec) / 60)
                    .toString()
                    .padStart(2, "0")}
                  :{(Math.max(0, remainingSec) % 60).toString().padStart(2, "0")}
                </span>
              )}
              <span className="text-sm text-slate-500">
                Question {currentQ + 1} / {total}
              </span>
            </div>
          </div>
          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-ht-yellow to-ht-red transition-all duration-500"
              style={{ width: `${((currentQ + 1) / total) * 100}%` }}
            />
          </div>
        </div>

        <div className="animate-fade-in">
          {q.type === "fill" ? (
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-5">
              {renderFillText(q.text, (answers[currentQ] as string[]) || [], (i, v) => {
                if (isLocked) return;
                const arr = [...(((answers[currentQ] as string[]) || new Array(q.blankCount || 0).fill("")))];
                arr[i] = v;
                updateAnswer(arr);
              })}
            </h2>
          ) : (
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-5">{q.text}</h2>
          )}

          {q.media?.url && (
            <div className="mb-5">
              <MediaViewer kind={q.media.kind} url={q.media.url} />
            </div>
          )}

          {q.type === "mcq" && q.options && (
            <div className="space-y-2">
              {q.options.map((opt, i) => {
                const selected = answers[currentQ] === i;
                const isCorrectOpt = isLocked && currentChecked?.correctIndex === i;
                const isWrongPick = isLocked && selected && currentChecked?.correctIndex !== i;
                return (
                  <button
                    key={i}
                    disabled={isLocked}
                    onClick={() => updateAnswer(i)}
                    className={cn(
                      "w-full text-left p-4 rounded-lg border-2 transition-all",
                      isCorrectOpt
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                        : isWrongPick
                        ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                        : selected
                        ? "border-ht-yellow bg-ht-yellow/15 dark:bg-ht-yellow/10"
                        : "border-slate-200 dark:border-slate-700",
                      !isLocked && "hover:border-ht-yellow/60 dark:hover:border-ht-yellow/40",
                      isLocked && "cursor-not-allowed"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0",
                          isCorrectOpt
                            ? "border-emerald-600 bg-emerald-600 text-white"
                            : isWrongPick
                            ? "border-red-600 bg-red-600 text-white"
                            : selected
                            ? "border-ht-black bg-ht-black text-ht-yellow dark:border-ht-yellow dark:bg-ht-yellow dark:text-ht-black"
                            : "border-slate-300 text-slate-400"
                        )}
                      >
                        {String.fromCharCode(65 + i)}
                      </div>
                      <span className="text-slate-900 dark:text-white">{opt}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {q.type === "tf" && (
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: true, label: "Vrai" },
                { value: false, label: "Faux" },
              ].map(({ value, label }) => {
                const selected = answers[currentQ] === value;
                const isCorrectOpt = isLocked && currentChecked?.correctBool === value;
                const isWrongPick = isLocked && selected && currentChecked?.correctBool !== value;
                return (
                  <button
                    key={label}
                    disabled={isLocked}
                    onClick={() => updateAnswer(value)}
                    className={cn(
                      "p-5 rounded-lg border-2 transition-all font-semibold text-lg",
                      isCorrectOpt
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300"
                        : isWrongPick
                        ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300"
                        : selected
                        ? "border-ht-yellow bg-ht-yellow/20 dark:bg-ht-yellow/10 text-ht-black dark:text-ht-yellow"
                        : "border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200",
                      !isLocked &&
                        !selected &&
                        "hover:border-slate-300 dark:hover:border-slate-600",
                      isLocked && "cursor-not-allowed"
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}

          {q.type === "order" && (
            <OrderAnswer
              items={orderAnswer}
              onChange={(next) => updateAnswer(next)}
              onMove={moveOrderItem}
              disabled={isLocked}
            />
          )}

          {q.type === "text" && (
            <div>
              <textarea
                rows={6}
                className="input resize-y"
                placeholder="Rédigez votre réponse..."
                value={typeof answers[currentQ] === "string" ? (answers[currentQ] as string) : ""}
                onChange={(e) => updateAnswer(e.target.value)}
                maxLength={4000}
                readOnly={isLocked}
              />
              <div className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                <Hourglass className="w-3 h-3" />
                Cette question sera corrigée par l'enseignant.
              </div>
            </div>
          )}
        </div>

        {currentChecked && (
          <div
            className={cn(
              "mt-6 rounded-lg p-4 animate-fade-in border-l-4",
              currentChecked.pending
                ? "bg-amber-50 dark:bg-amber-900/20 border-amber-500"
                : currentChecked.isCorrect
                ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500"
                : "bg-red-50 dark:bg-red-900/20 border-red-500"
            )}
          >
            <div className="flex items-start gap-3">
              {currentChecked.pending ? (
                <Hourglass className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              ) : currentChecked.isCorrect ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div
                  className={cn(
                    "font-semibold",
                    currentChecked.pending
                      ? "text-amber-800 dark:text-amber-300"
                      : currentChecked.isCorrect
                      ? "text-emerald-800 dark:text-emerald-300"
                      : "text-red-800 dark:text-red-300"
                  )}
                >
                  {currentChecked.pending
                    ? "Réponse enregistrée"
                    : currentChecked.isCorrect
                    ? "Bonne réponse !"
                    : "Mauvaise réponse"}
                </div>

                {currentChecked.pending && (
                  <div className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    Cette question sera corrigée par l'enseignant.
                  </div>
                )}

                {!currentChecked.pending && !currentChecked.isCorrect && currentChecked.type === "fill" && currentChecked.blanks && (
                  <div className="mt-2 text-sm">
                    <div className="text-slate-600 dark:text-slate-300 mb-1">Réponses correctes :</div>
                    <div className="flex flex-wrap gap-1.5">
                      {currentChecked.blanks.map((b, bi) => (
                        <span
                          key={bi}
                          className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 rounded font-medium"
                        >
                          #{bi + 1} {b}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {!currentChecked.pending && !currentChecked.isCorrect && currentChecked.type === "order" && currentChecked.items && (
                  <div className="mt-2 text-sm">
                    <div className="text-slate-600 dark:text-slate-300 mb-1">Ordre correct :</div>
                    <ol className="list-decimal list-inside text-emerald-700 dark:text-emerald-400">
                      {currentChecked.items.map((it, ii) => (
                        <li key={ii}>{it}</li>
                      ))}
                    </ol>
                  </div>
                )}

                {currentChecked.explanation && (
                  <div className="mt-3 flex gap-2 text-sm bg-white/60 dark:bg-slate-900/40 text-slate-700 dark:text-slate-200 p-3 rounded-lg">
                    <Lightbulb className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                    <span>{currentChecked.explanation}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-8">
          <button
            disabled={currentQ === 0}
            onClick={() => setCurrentQ(currentQ - 1)}
            className="btn-secondary"
          >
            Précédent
          </button>
          {!isLocked ? (
            <button
              disabled={!isAnswered(currentQ) || check.isPending}
              onClick={() => check.mutate(currentQ)}
              className="btn-primary"
            >
              {check.isPending ? "Vérification..." : "Vérifier"}
            </button>
          ) : currentQ < total - 1 ? (
            <button
              onClick={() => setCurrentQ(currentQ + 1)}
              className="btn-primary"
            >
              Suivant <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              disabled={!allChecked || submit.isPending}
              onClick={() => submit.mutate()}
              className="btn-primary"
            >
              {submit.isPending ? "Validation..." : "Voir le résultat"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
