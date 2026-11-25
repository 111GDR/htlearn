import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, Edit, Trash2, Loader2, MessageSquare, Save } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { useAuth } from "@/store/auth";
import { cn } from "@/lib/utils";

interface ReviewItem {
  _id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  student: { _id?: string; name: string; avatar?: string };
}

interface ReviewSummary {
  count: number;
  average: number;
  distribution: { star: number; count: number }[];
  reviews: ReviewItem[];
}

const StarRow = ({
  value,
  onChange,
  size = 5,
  readOnly = false,
}: {
  value: number;
  onChange?: (n: number) => void;
  size?: number;
  readOnly?: boolean;
}) => {
  const [hover, setHover] = useState<number | null>(null);
  const sizeCls = size === 5 ? "w-6 h-6" : size === 4 ? "w-5 h-5" : "w-4 h-4";
  return (
    <div
      className="inline-flex items-center gap-0.5"
      onMouseLeave={() => !readOnly && setHover(null)}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const active = (hover ?? value) >= n;
        return (
          <button
            key={n}
            type="button"
            disabled={readOnly}
            onMouseEnter={() => !readOnly && setHover(n)}
            onClick={() => !readOnly && onChange?.(n)}
            className={cn(
              "transition-transform",
              !readOnly && "hover:scale-110 cursor-pointer",
              readOnly && "cursor-default"
            )}
            aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
          >
            <Star
              className={cn(
                sizeCls,
                active ? "text-ht-yellow fill-ht-yellow" : "text-slate-300 dark:text-slate-700"
              )}
            />
          </button>
        );
      })}
    </div>
  );
};

const ReviewForm = ({
  courseId,
  existing,
  onSaved,
}: {
  courseId: string;
  existing: ReviewItem | null;
  onSaved: () => void;
}) => {
  const [rating, setRating] = useState(existing?.rating || 0);
  const [comment, setComment] = useState(existing?.comment || "");
  const [editing, setEditing] = useState(!existing);

  useEffect(() => {
    setRating(existing?.rating || 0);
    setComment(existing?.comment || "");
    setEditing(!existing);
  }, [existing?._id]);

  const save = useMutation({
    mutationFn: async () => {
      const { data } = await api.put(`/reviews/course/${courseId}`, {
        rating,
        comment: comment.trim() || undefined,
      });
      return data.review as ReviewItem;
    },
    onSuccess: () => {
      toast.success(existing ? "Avis mis à jour" : "Merci pour votre avis !");
      setEditing(false);
      onSaved();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Erreur"),
  });

  const remove = useMutation({
    mutationFn: async () => (await api.delete(`/reviews/course/${courseId}`)).data,
    onSuccess: () => {
      toast.success("Avis supprimé");
      setRating(0);
      setComment("");
      setEditing(true);
      onSaved();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Erreur"),
  });

  if (!editing && existing) {
    return (
      <div className="card p-4 border-l-4 border-ht-yellow">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <StarRow value={existing.rating} readOnly size={4} />
            <span className="text-xs text-slate-500">Votre avis</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setEditing(true)}
              className="btn-ghost text-xs"
              aria-label="Modifier"
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                if (confirm("Supprimer votre avis ?")) remove.mutate();
              }}
              className="btn-ghost text-xs text-red-600"
              aria-label="Supprimer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        {existing.comment && (
          <p className="text-sm text-slate-700 dark:text-slate-300">{existing.comment}</p>
        )}
      </div>
    );
  }

  return (
    <div className="card p-4 border-l-4 border-ht-yellow">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          Votre note :
        </span>
        <StarRow value={rating} onChange={setRating} size={4} />
      </div>
      <textarea
        rows={3}
        className="input text-sm"
        placeholder="Partagez votre expérience avec ce cours (optionnel)."
        value={comment}
        onChange={(e) => setComment(e.target.value.slice(0, 1000))}
        maxLength={1000}
      />
      <div className="flex items-center justify-between mt-2">
        <span className="text-[11px] text-slate-400">{1000 - comment.length} caractères restants</span>
        <div className="flex items-center gap-2">
          {existing && (
            <button onClick={() => setEditing(false)} className="btn-ghost text-xs">
              Annuler
            </button>
          )}
          <button
            onClick={() => save.mutate()}
            disabled={rating < 1 || save.isPending}
            className="btn-primary text-xs"
          >
            {save.isPending ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> …</>
            ) : (
              <><Save className="w-3.5 h-3.5" /> {existing ? "Mettre à jour" : "Publier"}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export const CourseReviews = ({
  courseId,
  canReview,
}: {
  courseId: string;
  canReview: boolean;
}) => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: summary, isLoading } = useQuery({
    queryKey: ["reviews", courseId],
    queryFn: async () =>
      (await api.get(`/reviews/course/${courseId}`)).data as ReviewSummary,
  });

  const { data: mine } = useQuery({
    queryKey: ["my-review", courseId],
    enabled: !!user && user.role === "student" && canReview,
    queryFn: async () =>
      ((await api.get(`/reviews/course/${courseId}/me`)).data as { review: ReviewItem | null })
        .review,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["reviews", courseId] });
    qc.invalidateQueries({ queryKey: ["my-review", courseId] });
    qc.invalidateQueries({ queryKey: ["courses"] });
  };

  if (isLoading || !summary) return null;

  const max = Math.max(1, ...summary.distribution.map((d) => d.count));

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-ht-red" /> Avis
          <span className="text-base font-normal text-slate-500">
            ({summary.count})
          </span>
        </h2>
      </div>

      {summary.count > 0 ? (
        <div className="grid sm:grid-cols-3 gap-5 card p-5">
          <div className="sm:col-span-1 text-center sm:text-left">
            <div className="text-5xl font-black text-slate-900 dark:text-white">
              {summary.average.toFixed(1)}
            </div>
            <StarRow value={Math.round(summary.average)} readOnly size={4} />
            <div className="text-xs text-slate-500 mt-1">
              sur {summary.count} avis
            </div>
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            {[...summary.distribution].reverse().map((d) => (
              <div key={d.star} className="flex items-center gap-2 text-xs">
                <span className="w-6 text-slate-500 tabular-nums">{d.star}★</span>
                <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-ht-yellow transition-all"
                    style={{ width: `${(d.count / max) * 100}%` }}
                  />
                </div>
                <span className="w-8 text-right text-slate-500 tabular-nums">
                  {d.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card p-6 text-center text-sm text-slate-500">
          Aucun avis pour le moment. {canReview && "Soyez le premier à donner le vôtre !"}
        </div>
      )}

      {canReview && (
        <ReviewForm
          courseId={courseId}
          existing={mine ?? null}
          onSaved={invalidate}
        />
      )}

      {summary.reviews.length > 0 && (
        <ul className="space-y-3">
          {summary.reviews
            .filter((r) => !mine || r._id !== mine._id) // own review already shown above
            .map((r) => (
              <li key={r._id} className="card p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-ht-yellow text-ht-black flex items-center justify-center font-bold shrink-0 overflow-hidden">
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
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {r.student.name}
                      </span>
                      <StarRow value={r.rating} readOnly size={3} />
                      <span className="text-xs text-slate-400">
                        {new Date(r.createdAt).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    {r.comment && (
                      <p className="mt-1.5 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line">
                        {r.comment}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            ))}
        </ul>
      )}
    </section>
  );
};
