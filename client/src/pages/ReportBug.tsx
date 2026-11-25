import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Bug,
  Send,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowLeft,
} from "lucide-react";
import { api } from "@/lib/api";
import { Spinner, EmptyState } from "@/components/Spinner";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { value: "ui", label: "Interface / Affichage" },
  { value: "performance", label: "Performance / Lenteur" },
  { value: "content", label: "Erreur de contenu" },
  { value: "auth", label: "Compte / Connexion" },
  { value: "other", label: "Autre" },
];

const statusMeta: Record<
  string,
  { label: string; cls: string; icon: typeof Clock }
> = {
  open: {
    label: "En cours",
    cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    icon: Clock,
  },
  resolved: {
    label: "Résolu",
    cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    icon: CheckCircle2,
  },
  dismissed: {
    label: "Rejeté",
    cls: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    icon: XCircle,
  },
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export const ReportBugPage = () => {
  const [category, setCategory] = useState("ui");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");

  const qc = useQueryClient();

  const { data: mine, isLoading } = useQuery({
    queryKey: ["reports", "mine"],
    queryFn: async () => (await api.get("/reports/mine")).data,
  });

  const submit = useMutation({
    mutationFn: async () => {
      const categoryLabel =
        CATEGORIES.find((c) => c.value === category)?.label || "Autre";
      const fullMessage = [
        `Catégorie : ${categoryLabel}`,
        `Page : ${window.location.pathname}`,
        message ? `\n${message}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      return api.post("/reports", {
        targetType: "other",
        reason: reason.trim(),
        message: fullMessage,
      });
    },
    onSuccess: () => {
      toast.success("Merci ! Votre signalement a bien été envoyé.");
      setReason("");
      setMessage("");
      setCategory("ui");
      qc.invalidateQueries({ queryKey: ["reports", "mine"] });
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message || "Impossible d'envoyer le signalement.";
      toast.error(msg);
    },
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim().length < 2) {
      toast.error("Merci de saisir un sujet d'au moins 2 caractères.");
      return;
    }
    submit.mutate();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      <div>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-ht-red mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Retour au tableau de bord
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Bug className="w-7 h-7 text-ht-red" /> Signaler un bug
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Décrivez le problème rencontré. L'équipe sera notifiée et reviendra
          vers vous si nécessaire.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <form onSubmit={onSubmit} className="card p-6 space-y-5 lg:col-span-3">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Catégorie
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Sujet <span className="text-ht-red">*</span>
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={120}
              required
              minLength={2}
              className="input"
              placeholder="Ex. Le bouton « Suivant » ne réagit pas dans le quiz X"
            />
            <div className="text-xs text-slate-400 mt-1 text-right">
              {reason.length}/120
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Description détaillée
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={2000}
              rows={6}
              className="input resize-y"
              placeholder="Étapes pour reproduire, comportement attendu vs. observé, navigateur..."
            />
            <div className="text-xs text-slate-400 mt-1 text-right">
              {message.length}/2000
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 text-xs text-amber-900 dark:text-amber-200">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              N'incluez pas d'informations sensibles (mot de passe, données
              personnelles d'autres utilisateurs).
            </span>
          </div>

          <button
            type="submit"
            disabled={submit.isPending}
            className="btn-primary w-full py-2.5"
          >
            <Send className="w-4 h-4" />
            {submit.isPending ? "Envoi..." : "Envoyer le signalement"}
          </button>
        </form>

        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-semibold text-slate-900 dark:text-white">
            Mes signalements
          </h2>
          {isLoading ? (
            <Spinner />
          ) : !mine?.length ? (
            <EmptyState
              icon={<Bug className="w-10 h-10" />}
              title="Aucun signalement"
              message="Vos signalements apparaîtront ici."
            />
          ) : (
            <ul className="space-y-3">
              {mine.map((r: any) => {
                const meta = statusMeta[r.status] || statusMeta.open;
                const Icon = meta.icon;
                return (
                  <li key={r._id} className="card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-2">
                        {r.reason}
                      </div>
                      <span
                        className={cn(
                          "shrink-0 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md",
                          meta.cls
                        )}
                      >
                        <Icon className="w-3 h-3" />
                        {meta.label}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {fmtDate(r.createdAt)}
                    </div>
                    {r.resolution && (
                      <div className="mt-2 text-xs text-slate-600 dark:text-slate-400 italic border-l-2 border-ht-yellow pl-2">
                        Réponse : {r.resolution}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
