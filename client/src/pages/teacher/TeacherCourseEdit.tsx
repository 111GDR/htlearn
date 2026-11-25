import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Edit, Trash2, ClipboardCheck, Award, BookOpen, FileText, Video, Music, Type, Sparkles, Loader2, GripVertical, Users } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { Spinner } from "@/components/Spinner";
import { MediaPicker, MediaKind, MediaSource } from "@/components/MediaPicker";
import { useDragReorder } from "@/lib/useDragReorder";
import { cn } from "@/lib/utils";

type LessonKind = "text" | MediaKind;

const KIND_OPTIONS: { value: LessonKind; label: string; icon: React.ReactNode }[] = [
  { value: "text", label: "Texte", icon: <Type className="w-4 h-4" /> },
  { value: "pdf", label: "PDF", icon: <FileText className="w-4 h-4" /> },
  { value: "video", label: "Vidéo", icon: <Video className="w-4 h-4" /> },
  { value: "audio", label: "Audio", icon: <Music className="w-4 h-4" /> },
];

const KIND_ICON: Record<LessonKind, React.ReactNode> = {
  text: <Type className="w-3.5 h-3.5" />,
  pdf: <FileText className="w-3.5 h-3.5" />,
  video: <Video className="w-3.5 h-3.5" />,
  audio: <Music className="w-3.5 h-3.5" />,
};

const LessonModal = ({
  initial,
  courseId,
  chapters,
  onClose,
  onSaved,
}: {
  initial?: any;
  courseId: string;
  chapters: any[];
  onClose: () => void;
  onSaved: () => void;
}) => {
  const [form, setForm] = useState<{
    title: string;
    kind: LessonKind;
    chapter: string;
    content: string;
    mediaUrl: string;
    mediaSource?: MediaSource;
    transcript: string;
    flashcards: { front: string; back: string }[];
    order: number;
    duration: number;
  }>({
    title: initial?.title || "",
    kind: (initial?.kind as LessonKind) || "text",
    chapter: initial?.chapter ? String(initial.chapter) : "",
    content: initial?.content || "",
    mediaUrl: initial?.mediaUrl || "",
    mediaSource: initial?.mediaSource,
    transcript: initial?.transcript || "",
    flashcards: initial?.flashcards || [],
    order: initial?.order || 0,
    duration: initial?.duration || 15,
  });

  const save = useMutation({
    mutationFn: async () => {
      const isMedia = form.kind === "video" || form.kind === "audio";
      const payload: any = {
        title: form.title,
        kind: form.kind,
        chapter: form.chapter || null,
        order: form.order,
        duration: form.duration,
        content: form.kind === "text" ? form.content : "",
        mediaUrl: form.kind === "text" ? "" : form.mediaUrl,
        mediaSource: form.kind === "text" ? undefined : form.mediaSource,
        transcript: isMedia ? form.transcript : "",
        flashcards: form.kind === "text" ? form.flashcards : [],
      };
      return initial
        ? (await api.put(`/lessons/${initial._id}`, payload)).data
        : (await api.post("/lessons", { ...payload, course: courseId })).data;
    },
    onSuccess: () => {
      toast.success("Leçon enregistrée");
      onSaved();
      onClose();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Erreur"),
  });

  const generateFlashcardsMut = useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/flashcards/generate", {
        courseId,
        lessonTitle: form.title || "Leçon",
        content: form.content,
      });
      return data.flashcards as { front: string; back: string }[];
    },
    onSuccess: (cards) => {
      const replace =
        form.flashcards.length === 0 ||
        confirm("Remplacer les flashcards actuelles par les nouvelles ?");
      if (replace) {
        setForm((f) => ({ ...f, flashcards: cards }));
        toast.success(`${cards.length} flashcards générées`);
      }
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Échec de la génération"),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="card w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto animate-slide-up">
        <h2 className="text-xl font-bold mb-4">{initial ? "Modifier la leçon" : "Nouvelle leçon"}</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Titre</label>
              <input
                className="input"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Durée (min)</label>
              <input
                type="number"
                className="input"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Ordre</label>
              <input
                type="number"
                className="input"
                value={form.order}
                onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Chapitre</label>
              <select
                className="input"
                value={form.chapter}
                onChange={(e) => setForm({ ...form, chapter: e.target.value })}
              >
                <option value="">Aucun</option>
                {chapters.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Type de leçon</label>
            <div className="grid grid-cols-4 gap-2">
              {KIND_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => setForm({ ...form, kind: opt.value, mediaUrl: "", mediaSource: undefined })}
                  className={cn(
                    "flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all text-xs",
                    form.kind === opt.value
                      ? "border-ht-yellow bg-ht-yellow/20 dark:bg-ht-yellow/10 text-ht-black dark:text-ht-yellow"
                      : "border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-600 dark:text-slate-400"
                  )}
                >
                  {opt.icon}
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {form.kind === "text" ? (
            <>
            <div>
              <label className="block text-sm font-medium mb-1">
                Contenu (Markdown supporté)
              </label>
              <textarea
                rows={12}
                className="input font-mono text-xs"
                placeholder="# Titre&#10;&#10;Votre contenu en markdown..."
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
              />
            </div>

            <div className="rounded-xl border border-ht-yellow/40 dark:border-ht-yellow/20 bg-gradient-to-br from-ht-yellow/20 via-white to-white dark:from-ht-yellow/10 dark:via-slate-900 dark:to-slate-900 p-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-ht-black text-ht-yellow flex items-center justify-center shrink-0 shadow-ink">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">
                        Flashcards d'étude
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        Générées par IA à partir du contenu — non modifiables manuellement.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => generateFlashcardsMut.mutate()}
                      disabled={generateFlashcardsMut.isPending || !form.content.trim()}
                      className="btn-primary text-xs whitespace-nowrap"
                    >
                      {generateFlashcardsMut.isPending ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Génération…</>
                      ) : (
                        <><Sparkles className="w-3.5 h-3.5" /> {form.flashcards.length > 0 ? "Régénérer" : "Générer"}</>
                      )}
                    </button>
                  </div>
                  {form.flashcards.length > 0 && (
                    <div className="mt-3 space-y-1.5 max-h-60 overflow-y-auto pr-1">
                      {form.flashcards.map((c, i) => (
                        <div
                          key={i}
                          className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2"
                        >
                          <div className="font-medium text-slate-900 dark:text-white truncate">{c.front}</div>
                          <div className="text-slate-600 dark:text-slate-400 line-clamp-2">{c.back}</div>
                        </div>
                      ))}
                      <div className="text-xs text-slate-500 mt-1">
                        {form.flashcards.length} flashcard{form.flashcards.length > 1 ? "s" : ""}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            </>
          ) : (
            <div>
              <label className="block text-sm font-medium mb-2">
                {form.kind === "pdf" ? "Document PDF" : form.kind === "video" ? "Vidéo" : "Fichier audio"}
              </label>
              <MediaPicker
                kind={form.kind}
                url={form.mediaUrl}
                source={form.mediaSource}
                onChange={({ url, source, transcript }) =>
                  setForm({
                    ...form,
                    mediaUrl: url,
                    mediaSource: source,
                    transcript: transcript !== undefined ? transcript : url ? form.transcript : "",
                  })
                }
              />
              {(form.kind === "video" || form.kind === "audio") && form.mediaUrl && (
                <details className="mt-3 rounded-lg border border-slate-200 dark:border-slate-700 p-3 bg-slate-50 dark:bg-slate-900/50" open={!!form.transcript}>
                  <summary className="cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-300">
                    Transcription {form.transcript ? "(modifiable)" : "— ajouter manuellement"}
                  </summary>
                  <textarea
                    rows={6}
                    className="input mt-3 text-xs"
                    placeholder={
                      form.transcript
                        ? ""
                        : "La transcription automatique n'est disponible que pour les fichiers ≤ 25 Mo. Vous pouvez la coller ici."
                    }
                    value={form.transcript}
                    onChange={(e) => setForm({ ...form, transcript: e.target.value })}
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    La transcription nourrit l'assistant IA et est consultable par les étudiants.
                  </p>
                </details>
              )}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="btn-ghost">Annuler</button>
          <button onClick={() => save.mutate()} disabled={save.isPending} className="btn-primary">
            {save.isPending ? "..." : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
};

const OrderItemsEditor = ({
  items,
  onChange,
}: {
  items: string[];
  onChange: (next: string[]) => void;
}) => {
  const { handlers, dragging, over } = useDragReorder(items, onChange);

  return (
    <div className="space-y-1.5">
      <div className="text-xs text-slate-500">
        Éléments dans l'<strong>ordre correct</strong> (ils seront mélangés pour l'étudiant) — glissez n'importe quelle ligne pour réordonner :
      </div>
      {items.map((it, ii) => {
        const isDragging = dragging === ii;
        const isOver = over === ii && dragging !== null && dragging !== ii;
        return (
          <div
            key={ii}
            {...handlers(ii)}
            className={cn(
              "group flex items-center gap-2 rounded-lg transition-all p-1 cursor-grab active:cursor-grabbing",
              isDragging && "opacity-40",
              isOver && "ring-2 ring-ht-yellow bg-ht-yellow/10"
            )}
            title="Glisser pour réordonner"
          >
            <GripVertical
              className="w-4 h-4 text-slate-300 group-hover:text-ht-yellow shrink-0"
              aria-hidden="true"
            />
            <span className="text-xs font-mono text-slate-500 w-6 select-none">{ii + 1}.</span>
            <input
              draggable={false}
              className="input flex-1 cursor-text"
              placeholder="Élément"
              value={it}
              onChange={(e) => {
                const next = [...items];
                next[ii] = e.target.value;
                onChange(next);
              }}
            />
            <div className="flex flex-col cursor-default" draggable={false}>
              <button
                type="button"
                draggable={false}
                disabled={ii === 0}
                onClick={() => {
                  const next = [...items];
                  [next[ii - 1], next[ii]] = [next[ii], next[ii - 1]];
                  onChange(next);
                }}
                className="text-xs text-slate-400 hover:text-ht-red dark:hover:text-ht-yellow disabled:opacity-30 transition-colors"
                aria-label="Monter"
              >
                ▲
              </button>
              <button
                type="button"
                draggable={false}
                disabled={ii === items.length - 1}
                onClick={() => {
                  const next = [...items];
                  [next[ii + 1], next[ii]] = [next[ii], next[ii + 1]];
                  onChange(next);
                }}
                className="text-xs text-slate-400 hover:text-ht-red dark:hover:text-ht-yellow disabled:opacity-30 transition-colors"
                aria-label="Descendre"
              >
                ▼
              </button>
            </div>
            {items.length > 2 && (
              <button
                type="button"
                draggable={false}
                onClick={() => onChange(items.filter((_, i) => i !== ii))}
                className="text-slate-400 hover:text-red-500"
                aria-label="Supprimer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        );
      })}
      <button
        type="button"
        onClick={() => onChange([...items, ""])}
        className="text-xs text-ht-red dark:text-ht-yellow hover:underline ml-7 font-semibold"
      >
        + Ajouter un élément
      </button>
    </div>
  );
};

const QuizModal = ({
  initial,
  lessonId,
  chapterId,
  finalCourseId,
  onClose,
  onSaved,
}: {
  initial?: any;
  lessonId?: string;
  chapterId?: string;
  finalCourseId?: string;
  onClose: () => void;
  onSaved: () => void;
}) => {
  const isChapterExam = !!chapterId;
  const isFinalExam = !!finalCourseId || initial?.kind === "final";
  const showAiPanel = !isChapterExam && !isFinalExam;
  const allowText = isFinalExam;
  const [form, setForm] = useState<any>({
    title: initial?.title || (isFinalExam ? "Examen final" : "Quiz"),
    passingScore: initial?.passingScore || 60,
    timeLimitMin: Math.max(1, Math.round((initial?.timeLimitSec ?? 60 * 60) / 60)),
    questions:
      initial?.questions?.length > 0
        ? initial.questions.map((q: any) => ({ type: q.type || "mcq", ...q }))
        : [{ type: "mcq", text: "", options: ["", ""], correctIndex: 0, explanation: "", media: undefined }],
  });
  const [aiCount, setAiCount] = useState(5);
  const [aiTypes, setAiTypes] = useState<("mcq" | "fill" | "order")[]>(["mcq"]);

  const toggleAiType = (t: "mcq" | "fill" | "order") => {
    setAiTypes((prev) =>
      prev.includes(t) ? (prev.length > 1 ? prev.filter((x) => x !== t) : prev) : [...prev, t]
    );
  };

  const sanitizeQuestion = (q: any) => {
    const t = q.type || "mcq";
    const out: any = { type: t, text: (q.text || "").trim() };
    if (q.explanation?.trim()) out.explanation = q.explanation.trim();
    if (q.media?.url) {
      out.media = { kind: q.media.kind, url: q.media.url };
      if (q.media.source) out.media.source = q.media.source;
    }
    if (t === "mcq") {
      out.options = (q.options || []).map((o: string) => (o || "").trim()).filter(Boolean);
      out.correctIndex = typeof q.correctIndex === "number" ? q.correctIndex : 0;
    } else if (t === "tf") {
      out.correctBool = q.correctBool === true;
    } else if (t === "fill") {
      out.blanks = (q.blanks || []).map((b: string) => (b || "").trim()).filter(Boolean);
    } else if (t === "order") {
      out.items = (q.items || []).map((i: string) => (i || "").trim()).filter(Boolean);
    } else if (t === "text") {
      if (q.expectedAnswer?.trim()) out.expectedAnswer = q.expectedAnswer.trim();
    }
    return out;
  };

  const save = useMutation({
    mutationFn: async () => {
      const { timeLimitMin, questions: rawQs, ...rest } = form;
      const timeLimitSec = isFinalExam ? Math.max(60, Math.round(timeLimitMin * 60)) : undefined;
      const questions = (rawQs as any[]).map(sanitizeQuestion);
      const body = { ...rest, questions };

      if (initial) {
        return (await api.put(`/quizzes/${initial._id}`, {
          ...body,
          ...(isFinalExam ? { timeLimitSec } : {}),
        })).data;
      }
      let payload: any;
      if (isChapterExam) {
        payload = { ...body, kind: "chapter", chapter: chapterId };
      } else if (isFinalExam) {
        payload = { ...body, kind: "final", course: finalCourseId, timeLimitSec };
      } else {
        payload = { ...body, lesson: lessonId };
      }
      return (await api.post("/quizzes", payload)).data;
    },
    onSuccess: () => {
      toast.success("Quiz enregistré");
      onSaved();
      onClose();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Erreur"),
  });

  const generate = useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/quizzes/generate", {
        lessonId,
        count: aiCount,
        types: aiTypes,
      });
      return data.questions as any[];
    },
    onSuccess: (questions) => {
      const hasManual = form.questions.some((q: any) => q.text?.trim());
      if (hasManual && !confirm("Remplacer les questions actuelles par celles générées par l'IA ?")) {
        return;
      }
      setForm({
        ...form,
        questions: questions.map((q) => {
          if (q.type === "fill") {
            return {
              type: "fill",
              text: q.text,
              blanks: q.blanks,
              explanation: q.explanation || "",
              media: undefined,
            };
          }
          if (q.type === "order") {
            return {
              type: "order",
              text: q.text,
              items: q.items,
              explanation: q.explanation || "",
              media: undefined,
            };
          }
          return {
            type: "mcq",
            text: q.text,
            options: q.options,
            correctIndex: q.correctIndex,
            explanation: q.explanation || "",
            media: undefined,
          };
        }),
      });
      toast.success(`${questions.length} questions générées — relisez-les !`);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Échec de la génération"),
  });

  const updateQ = (i: number, patch: any) => {
    const qs = [...form.questions];
    qs[i] = { ...qs[i], ...patch };
    setForm({ ...form, questions: qs });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="card w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto animate-slide-up">
        <h2 className="text-xl font-bold mb-4">
          {isFinalExam
            ? "Examen final"
            : isChapterExam
            ? "Examen de chapitre"
            : "Éditer le quiz"}
        </h2>
        {isChapterExam && !initial && (
          <p className="text-xs text-slate-500 -mt-3 mb-4">
            L'examen de chapitre est noté automatiquement. Pas de questions à
            réponse libre.
          </p>
        )}
        {isFinalExam && !initial && (
          <p className="text-xs text-slate-500 -mt-3 mb-4">
            L'examen final est chronométré et débloqué uniquement quand
            l'étudiant a réussi tous les examens de chapitre (≥60%). Les
            questions à réponse libre nécessitent votre correction manuelle.
          </p>
        )}
        <div className="space-y-4">
          <div className={cn("grid gap-3", isFinalExam ? "grid-cols-4" : "grid-cols-3")}>
            <div className={isFinalExam ? "col-span-2" : "col-span-2"}>
              <label className="block text-sm font-medium mb-1">Titre</label>
              <input
                className="input"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Score requis (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                className="input"
                value={form.passingScore}
                onChange={(e) => setForm({ ...form, passingScore: Number(e.target.value) })}
              />
            </div>
            {isFinalExam && (
              <div>
                <label className="block text-sm font-medium mb-1">Durée (min)</label>
                <input
                  type="number"
                  min={1}
                  max={360}
                  className="input"
                  value={form.timeLimitMin}
                  onChange={(e) =>
                    setForm({ ...form, timeLimitMin: Math.max(1, Number(e.target.value) || 1) })
                  }
                />
              </div>
            )}
          </div>

          {showAiPanel && (
          <div className="rounded-xl border border-ht-yellow/40 dark:border-ht-yellow/20 bg-gradient-to-br from-ht-yellow/20 via-white to-white dark:from-ht-yellow/10 dark:via-slate-900 dark:to-slate-900 p-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-ht-black text-ht-yellow flex items-center justify-center shrink-0 shadow-ink">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-900 dark:text-white">
                  Générer avec l'IA
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  L'IA crée des questions à partir du contenu de la leçon. Vous pourrez les relire et modifier ensuite.
                </p>
                <div className="mt-3">
                  <label className="block text-xs font-medium mb-1.5 text-slate-700 dark:text-slate-300">
                    Types de questions à générer
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {([
                      { value: "mcq", label: "QCM" },
                      { value: "fill", label: "À trous" },
                      { value: "order", label: "Ordre" },
                    ] as const).map((opt) => {
                      const active = aiTypes.includes(opt.value);
                      return (
                        <button
                          type="button"
                          key={opt.value}
                          onClick={() => toggleAiType(opt.value)}
                          className={cn(
                            "px-2.5 py-1 rounded-md text-xs border transition-colors",
                            active
                              ? "bg-ht-black text-white border-ht-black dark:bg-white dark:text-ht-black dark:border-white"
                              : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                          )}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="flex items-end gap-2 mt-3">
                  <div>
                    <label className="block text-xs font-medium mb-1 text-slate-700 dark:text-slate-300">
                      Nombre de questions
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={15}
                      value={aiCount}
                      onChange={(e) => setAiCount(Math.max(1, Math.min(15, Number(e.target.value) || 1)))}
                      className="input w-24"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => generate.mutate()}
                    disabled={generate.isPending || aiTypes.length === 0}
                    className="btn-primary"
                  >
                    {generate.isPending ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Génération…</>
                    ) : (
                      <><Sparkles className="w-4 h-4" /> Générer</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
          )}

          <div className="space-y-3">
            {form.questions.map((q: any, qi: number) => (
              <div key={qi} className="card p-4 bg-slate-50 dark:bg-slate-900/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Question {qi + 1}</span>
                  <div className="flex items-center gap-1">
                    {(allowText
                      ? (["mcq", "tf", "fill", "order", "text"] as const)
                      : (["mcq", "tf", "fill", "order"] as const)
                    ).map((t) => (
                      <button
                        type="button"
                        key={t}
                        onClick={() => {
                          const base: any = {
                            type: t,
                            text: q.text || "",
                            explanation: q.explanation || "",
                            media: q.media,
                          };
                          if (t === "mcq") Object.assign(base, { options: q.options || ["", ""], correctIndex: q.correctIndex ?? 0 });
                          if (t === "tf") Object.assign(base, { correctBool: typeof q.correctBool === "boolean" ? q.correctBool : true });
                          if (t === "fill") Object.assign(base, { blanks: q.blanks || [""] });
                          if (t === "order") Object.assign(base, { items: q.items || ["", ""] });
                          if (t === "text") Object.assign(base, { expectedAnswer: q.expectedAnswer || "" });
                          // Replace the question entirely so stale fields from the
                          // previous type don't leak into the payload.
                          const qs = [...form.questions];
                          qs[qi] = base;
                          setForm({ ...form, questions: qs });
                        }}
                        className={cn(
                          "px-2 py-0.5 rounded-md text-xs border transition-colors",
                          (q.type || "mcq") === t
                            ? "bg-ht-black text-white border-ht-black dark:bg-white dark:text-ht-black dark:border-white"
                            : "border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        )}
                      >
                        {t === "mcq" ? "QCM" : t === "tf" ? "V/F" : t === "fill" ? "À trous" : t === "order" ? "Ordre" : "Libre"}
                      </button>
                    ))}
                    {form.questions.length > 1 && (
                      <button
                        onClick={() =>
                          setForm({
                            ...form,
                            questions: form.questions.filter((_: any, i: number) => i !== qi),
                          })
                        }
                        className="text-red-500 hover:text-red-700 ml-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <input
                  className="input mb-2"
                  placeholder={
                    (q.type || "mcq") === "fill"
                      ? "Énoncé avec ___ pour chaque trou (ex: La capitale de la France est ___)"
                      : (q.type === "order")
                        ? "Consigne (ex: Remettez ces étapes dans l'ordre)"
                        : "Énoncé de la question"
                  }
                  value={q.text}
                  onChange={(e) => updateQ(qi, { text: e.target.value })}
                />

                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-2 text-xs text-slate-600 dark:text-slate-400">
                    <span>Média (optionnel) :</span>
                    {(["pdf", "video", "audio"] as MediaKind[]).map((k) => (
                      <button
                        type="button"
                        key={k}
                        onClick={() =>
                          updateQ(qi, {
                            media: q.media?.kind === k ? undefined : { kind: k, url: "", source: "upload" },
                          })
                        }
                        className={cn(
                          "px-2 py-0.5 rounded-md border text-xs transition-colors",
                          q.media?.kind === k
                            ? "bg-ht-black text-white border-ht-black dark:bg-white dark:text-ht-black dark:border-white"
                            : "border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        )}
                      >
                        {k.toUpperCase()}
                      </button>
                    ))}
                    {q.media && (
                      <button
                        type="button"
                        onClick={() => updateQ(qi, { media: undefined })}
                        className="ml-auto text-xs text-slate-500 hover:text-red-500"
                      >
                        Retirer
                      </button>
                    )}
                  </div>
                  {q.media && (
                    <MediaPicker
                      compact
                      kind={q.media.kind}
                      url={q.media.url}
                      source={q.media.source}
                      onChange={({ url, source }) =>
                        updateQ(qi, { media: url ? { kind: q.media.kind, url, source } : undefined })
                      }
                    />
                  )}
                </div>

                {(q.type || "mcq") === "mcq" && (
                  <div className="space-y-1.5">
                    {(q.options || []).map((opt: string, oi: number) => (
                      <div key={oi} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct-${qi}`}
                          checked={q.correctIndex === oi}
                          onChange={() => updateQ(qi, { correctIndex: oi })}
                          className="w-4 h-4 text-ht-black accent-ht-black focus:ring-ht-yellow"
                        />
                        <input
                          className="input flex-1"
                          placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                          value={opt}
                          onChange={(e) => {
                            const opts = [...q.options];
                            opts[oi] = e.target.value;
                            updateQ(qi, { options: opts });
                          }}
                        />
                        {q.options.length > 2 && (
                          <button
                            onClick={() =>
                              updateQ(qi, {
                                options: q.options.filter((_: any, i: number) => i !== oi),
                                correctIndex: q.correctIndex >= oi ? Math.max(0, q.correctIndex - 1) : q.correctIndex,
                              })
                            }
                            className="text-slate-400 hover:text-red-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => updateQ(qi, { options: [...q.options, ""] })}
                      className="text-xs text-ht-red dark:text-ht-yellow hover:underline font-semibold"
                    >
                      + Ajouter une option
                    </button>
                  </div>
                )}

                {q.type === "tf" && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Bonne réponse :</span>
                    {[
                      { value: true, label: "Vrai" },
                      { value: false, label: "Faux" },
                    ].map(({ value, label }) => (
                      <button
                        type="button"
                        key={label}
                        onClick={() => updateQ(qi, { correctBool: value })}
                        className={cn(
                          "px-3 py-1 rounded-md text-xs border transition-colors",
                          q.correctBool === value
                            ? "bg-ht-black text-white border-ht-black dark:bg-white dark:text-ht-black dark:border-white"
                            : "border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}

                {q.type === "fill" && (
                  <div className="space-y-1.5">
                    <div className="text-xs text-slate-500">
                      Réponses attendues pour chaque <code className="text-ht-red dark:text-ht-yellow font-semibold">___</code> dans l'ordre :
                    </div>
                    {(q.blanks || []).map((b: string, bi: number) => (
                      <div key={bi} className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 w-6">#{bi + 1}</span>
                        <input
                          className="input flex-1"
                          placeholder="Réponse acceptée (insensible à la casse)"
                          value={b}
                          onChange={(e) => {
                            const blanks = [...(q.blanks || [])];
                            blanks[bi] = e.target.value;
                            updateQ(qi, { blanks });
                          }}
                        />
                        {q.blanks.length > 1 && (
                          <button
                            onClick={() =>
                              updateQ(qi, {
                                blanks: q.blanks.filter((_: any, i: number) => i !== bi),
                              })
                            }
                            className="text-slate-400 hover:text-red-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => updateQ(qi, { blanks: [...(q.blanks || []), ""] })}
                      className="text-xs text-ht-red dark:text-ht-yellow hover:underline font-semibold"
                    >
                      + Ajouter un trou
                    </button>
                  </div>
                )}

                {q.type === "order" && (
                  <OrderItemsEditor
                    items={q.items || []}
                    onChange={(items) => updateQ(qi, { items })}
                  />
                )}

                {q.type === "text" && (
                  <div className="space-y-1.5">
                    <div className="text-xs text-slate-500">
                      Réponse attendue (référence pour la correction — non
                      visible par l'étudiant) :
                    </div>
                    <textarea
                      rows={2}
                      className="input"
                      placeholder="Réponse modèle / éléments à attendre dans la réponse"
                      value={q.expectedAnswer || ""}
                      onChange={(e) => updateQ(qi, { expectedAnswer: e.target.value })}
                    />
                    <div className="text-[11px] text-amber-700 dark:text-amber-400 flex items-start gap-1">
                      <span>⓵ Cette question sera notée manuellement par l'enseignant après la soumission.</span>
                    </div>
                  </div>
                )}
                <input
                  className="input mt-2 text-xs"
                  placeholder="Explication (optionnel)"
                  value={q.explanation || ""}
                  onChange={(e) => updateQ(qi, { explanation: e.target.value })}
                />
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() =>
              setForm({
                ...form,
                questions: [...form.questions, { type: "mcq", text: "", options: ["", ""], correctIndex: 0, explanation: "", media: undefined }],
              })
            }
            className="btn-secondary w-full"
          >
            <Plus className="w-4 h-4" /> Ajouter une question
          </button>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="btn-ghost">Annuler</button>
          <button onClick={() => save.mutate()} disabled={save.isPending} className="btn-primary">
            {save.isPending ? "..." : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
};

const ChapterModal = ({
  initial,
  courseId,
  onClose,
  onSaved,
}: {
  initial?: any;
  courseId: string;
  onClose: () => void;
  onSaved: () => void;
}) => {
  const [title, setTitle] = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");

  const save = useMutation({
    mutationFn: async () => {
      const payload = { course: courseId, title: title.trim(), description: description.trim() || undefined };
      return initial
        ? (await api.put(`/chapters/${initial._id}`, payload)).data
        : (await api.post("/chapters", payload)).data;
    },
    onSuccess: () => {
      toast.success("Chapitre enregistré");
      onSaved();
      onClose();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Erreur"),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="card w-full max-w-lg p-6 animate-slide-up">
        <h2 className="text-xl font-bold mb-4">
          {initial ? "Modifier le chapitre" : "Nouveau chapitre"}
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Titre</label>
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex. Fondamentaux"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Description (optionnel)
            </label>
            <textarea
              rows={3}
              className="input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="btn-ghost">Annuler</button>
          <button
            onClick={() => save.mutate()}
            disabled={save.isPending || title.trim().length < 2}
            className="btn-primary"
          >
            {save.isPending ? "..." : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
};

export const TeacherCourseEditPage = () => {
  const { id } = useParams() as { id: string };
  const qc = useQueryClient();
  const [lessonModal, setLessonModal] = useState<{ open: boolean; initial?: any }>({ open: false });
  const [quizModal, setQuizModal] = useState<
    { lessonId?: string; chapterId?: string; finalCourseId?: string; initial?: any } | null
  >(null);
  const [chapterModal, setChapterModal] = useState<{ open: boolean; initial?: any }>({ open: false });

  const { data, isLoading } = useQuery({
    queryKey: ["course", id],
    queryFn: async () => (await api.get(`/courses/${id}`)).data,
  });

  const { data: chapters = [] } = useQuery({
    queryKey: ["chapters", id],
    queryFn: async () => (await api.get(`/chapters/course/${id}`)).data,
  });

  const deleteChapter = useMutation({
    mutationFn: async (chapterId: string) =>
      (await api.delete(`/chapters/${chapterId}`)).data,
    onSuccess: () => {
      toast.success("Chapitre supprimé");
      qc.invalidateQueries({ queryKey: ["chapters", id] });
      qc.invalidateQueries({ queryKey: ["course", id] });
    },
  });

  const deleteLesson = useMutation({
    mutationFn: async (lessonId: string) => (await api.delete(`/lessons/${lessonId}`)).data,
    onSuccess: () => {
      toast.success("Leçon supprimée");
      qc.invalidateQueries({ queryKey: ["course", id] });
    },
  });

  const fetchQuizFull = async (quizId: string) => {
    const { data } = await api.get(`/quizzes/${quizId}/full`);
    return data;
  };

  if (isLoading || !data) return <Spinner />;
  const { course, lessons, quizzes } = data;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <Link to="/teach" className="text-sm text-slate-600 dark:text-slate-400 hover:text-ht-red dark:hover:text-ht-yellow flex items-center gap-1 mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Mes cours
      </Link>

      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{course.title}</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">{course.description}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link to={`/teach/courses/${id}/students`} className="btn-ghost">
            <Users className="w-4 h-4" /> Étudiants
          </Link>
          <button
            onClick={() => setChapterModal({ open: true })}
            className="btn-secondary"
          >
            <Plus className="w-4 h-4" /> Chapitre
          </button>
          <button onClick={() => setLessonModal({ open: true })} className="btn-primary">
            <Plus className="w-4 h-4" /> Leçon
          </button>
        </div>
      </div>

      {chapters.length > 0 && (
        <>
          <h2 className="text-xl font-semibold mb-4">
            Chapitres ({chapters.length})
          </h2>
          <div className="space-y-3 mb-10">
            {chapters.map((ch: any, ci: number) => {
              const chLessons = lessons.filter(
                (l: any) => String(l.chapter) === String(ch._id)
              );
              const chExam = quizzes.find(
                (q: any) =>
                  q.kind === "chapter" && String(q.chapter) === String(ch._id)
              );
              return (
                <div key={ch._id} className="card p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-lg bg-ht-yellow/20 text-ht-yellow flex items-center justify-center font-bold shrink-0">
                      C{ci + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {ch.title}
                      </div>
                      {ch.description && (
                        <div className="text-xs text-slate-500 mt-0.5">
                          {ch.description}
                        </div>
                      )}
                      <div className="text-xs text-slate-500 mt-1">
                        {chLessons.length} leçon{chLessons.length > 1 ? "s" : ""}
                        {chExam && (
                          <>
                            {" "}· Examen : {chExam.questionCount} questions
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={async () => {
                          const full = chExam
                            ? await fetchQuizFull(chExam._id)
                            : undefined;
                          setQuizModal({ chapterId: ch._id, initial: full });
                        }}
                        className="btn-ghost text-xs"
                        title={chExam ? "Modifier l'examen" : "Créer l'examen de chapitre"}
                      >
                        <Award className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setChapterModal({ open: true, initial: ch })}
                        className="btn-ghost text-xs"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (
                            confirm(
                              "Supprimer ce chapitre ? Les leçons seront détachées et l'examen de chapitre supprimé."
                            )
                          ) {
                            deleteChapter.mutate(ch._id);
                          }
                        }}
                        className="btn-ghost text-xs text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <h2 className="text-xl font-semibold mb-4">Leçons ({lessons.length})</h2>
      <div className="space-y-3">
        {lessons.length === 0 && (
          <div className="card p-8 text-center text-slate-500 text-sm flex flex-col items-center gap-3">
            <BookOpen className="w-8 h-8 text-slate-400" />
            Aucune leçon. Ajoutez-en une pour commencer.
          </div>
        )}
        {lessons.map((lesson: any, i: number) => {
          const lq = quizzes.find((q: any) => String(q.lesson) === String(lesson._id));
          return (
            <div key={lesson._id} className="card p-4">
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-full bg-ht-yellow text-ht-black flex items-center justify-center font-extrabold shrink-0 ring-1 ring-ht-black/10">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-900 dark:text-white">{lesson.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 badge bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {KIND_ICON[(lesson.kind as LessonKind) || "text"]}
                      {(lesson.kind || "text").toUpperCase()}
                    </span>
                    <span>{lesson.duration} min</span>
                    {lq && <span>• Quiz : {lq.questionCount} questions</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={async () => {
                      const full = lq ? await fetchQuizFull(lq._id) : undefined;
                      setQuizModal({ lessonId: lesson._id, initial: full });
                    }}
                    className="btn-ghost text-xs"
                    title={lq ? "Modifier le quiz" : "Ajouter un quiz"}
                  >
                    <ClipboardCheck className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setLessonModal({ open: true, initial: lesson })}
                    className="btn-ghost text-xs"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Supprimer cette leçon ?")) deleteLesson.mutate(lesson._id);
                    }}
                    className="btn-ghost text-xs text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {(() => {
        const finalExam = quizzes.find((q: any) => q.kind === "final");
        return (
          <div className="mt-10">
            <h2 className="text-xl font-semibold mb-4">Examen final</h2>
            <div className="card p-4 flex items-center gap-4">
              <div className="w-9 h-9 rounded-lg bg-ht-red/20 text-ht-red flex items-center justify-center font-bold shrink-0">
                F
              </div>
              <div className="flex-1 min-w-0">
                {finalExam ? (
                  <>
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {finalExam.title}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {finalExam.questionCount} questions ·{" "}
                      {Math.round((finalExam.timeLimitSec || 0) / 60)} min · Score requis{" "}
                      {finalExam.passingScore}%
                    </div>
                  </>
                ) : (
                  <>
                    <div className="font-semibold text-slate-900 dark:text-white">
                      Pas encore configuré
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      L'examen final est chronométré et débloqué après tous les
                      examens de chapitre réussis (≥60%).
                    </div>
                  </>
                )}
              </div>
              <button
                onClick={async () => {
                  const full = finalExam ? await fetchQuizFull(finalExam._id) : undefined;
                  setQuizModal({ finalCourseId: id, initial: full });
                }}
                className={finalExam ? "btn-secondary text-xs" : "btn-primary text-xs"}
              >
                {finalExam ? (
                  <><Edit className="w-4 h-4" /> Modifier</>
                ) : (
                  <><Plus className="w-4 h-4" /> Créer</>
                )}
              </button>
            </div>
          </div>
        );
      })()}

      {lessonModal.open && (
        <LessonModal
          courseId={id}
          chapters={chapters}
          initial={lessonModal.initial}
          onClose={() => setLessonModal({ open: false })}
          onSaved={() => qc.invalidateQueries({ queryKey: ["course", id] })}
        />
      )}
      {quizModal && (
        <QuizModal
          lessonId={quizModal.lessonId}
          chapterId={quizModal.chapterId}
          finalCourseId={quizModal.finalCourseId}
          initial={quizModal.initial}
          onClose={() => setQuizModal(null)}
          onSaved={() => qc.invalidateQueries({ queryKey: ["course", id] })}
        />
      )}
      {chapterModal.open && (
        <ChapterModal
          courseId={id}
          initial={chapterModal.initial}
          onClose={() => setChapterModal({ open: false })}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ["chapters", id] });
            qc.invalidateQueries({ queryKey: ["course", id] });
          }}
        />
      )}
    </div>
  );
};
