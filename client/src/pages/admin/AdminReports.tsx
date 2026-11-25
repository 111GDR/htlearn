import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Flag, Trash2, CheckCircle2, XCircle, Clock } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { Spinner } from "@/components/Spinner";
import { cn } from "@/lib/utils";

type Status = "open" | "resolved" | "dismissed";
type TargetType = "user" | "course" | "lesson" | "quiz" | "other";

interface Report {
  _id: string;
  reporter: { _id: string; name: string; email: string; role: string } | null;
  targetType: TargetType;
  targetId?: string;
  reason: string;
  message?: string;
  status: Status;
  resolution?: string;
  resolvedBy?: { _id: string; name: string } | null;
  resolvedAt?: string;
  createdAt: string;
}

const STATUS_LABEL: Record<Status, string> = {
  open: "Ouvert",
  resolved: "Résolu",
  dismissed: "Rejeté",
};

const STATUS_COLOR: Record<Status, string> = {
  open: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  resolved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  dismissed: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

const TARGET_LABEL: Record<TargetType, string> = {
  user: "Utilisateur",
  course: "Cours",
  lesson: "Leçon",
  quiz: "Quiz",
  other: "Autre",
};

const ResolveModal = ({
  report,
  onClose,
  onSaved,
}: {
  report: Report;
  onClose: () => void;
  onSaved: () => void;
}) => {
  const [status, setStatus] = useState<Status>(report.status === "open" ? "resolved" : report.status);
  const [resolution, setResolution] = useState(report.resolution || "");

  const save = useMutation({
    mutationFn: async () =>
      (await api.patch(`/admin/reports/${report._id}`, { status, resolution })).data,
    onSuccess: () => {
      toast.success("Signalement mis à jour");
      onSaved();
      onClose();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Erreur"),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="card w-full max-w-lg p-6 animate-slide-up">
        <h2 className="text-xl font-bold mb-4">Traiter le signalement</h2>
        <div className="space-y-4">
          <div className="rounded-lg bg-slate-50 dark:bg-slate-900/50 p-3 text-sm">
            <div className="font-semibold">{report.reason}</div>
            {report.message && (
              <p className="text-slate-600 dark:text-slate-400 mt-1 whitespace-pre-wrap">
                {report.message}
              </p>
            )}
            <div className="mt-2 text-xs text-slate-500">
              {TARGET_LABEL[report.targetType]}
              {report.targetId ? ` · ${report.targetId}` : ""} · par{" "}
              {report.reporter?.name || "—"}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Statut</label>
            <div className="grid grid-cols-3 gap-2">
              {(["open", "resolved", "dismissed"] as const).map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setStatus(s)}
                  className={cn(
                    "px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all",
                    status === s
                      ? "border-ht-yellow bg-ht-yellow/20 dark:bg-ht-yellow/10 text-ht-black dark:text-ht-yellow"
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-ht-yellow/60"
                  )}
                >
                  {STATUS_LABEL[s]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Note de résolution (optionnel)
            </label>
            <textarea
              rows={3}
              className="input"
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              placeholder="Action prise, explication…"
            />
          </div>
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

export const AdminReportsPage = () => {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<"all" | Status>("open");
  const [editing, setEditing] = useState<Report | null>(null);

  const { data: reports, isLoading } = useQuery({
    queryKey: ["admin-reports", statusFilter],
    queryFn: async () => {
      const params: any = {};
      if (statusFilter !== "all") params.status = statusFilter;
      const { data } = await api.get("/admin/reports", { params });
      return data as Report[];
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/admin/reports/${id}`)).data,
    onSuccess: () => {
      toast.success("Signalement supprimé");
      qc.invalidateQueries({ queryKey: ["admin-reports"] });
    },
  });

  const StatusIcon = ({ s }: { s: Status }) =>
    s === "open" ? <Clock className="w-3 h-3" /> : s === "resolved" ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Flag className="w-7 h-7 text-rose-600" /> Signalements
        </h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Examinez les signalements soumis par les utilisateurs.
        </p>
      </div>

      <div className="card p-3 mb-4 flex flex-wrap items-center gap-1.5">
        {(["all", "open", "resolved", "dismissed"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm border transition-colors",
              statusFilter === s
                ? "bg-ht-black text-white border-ht-black dark:bg-white dark:text-ht-black dark:border-white shadow-ink"
                : "border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-ht-yellow hover:text-ht-black dark:hover:text-ht-yellow"
            )}
          >
            {s === "all" ? "Tous" : STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Spinner />
      ) : !reports || reports.length === 0 ? (
        <div className="card p-10 text-center text-slate-500">Aucun signalement.</div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <div key={r._id} className="card p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium",
                        STATUS_COLOR[r.status]
                      )}
                    >
                      <StatusIcon s={r.status} />
                      {STATUS_LABEL[r.status]}
                    </span>
                    <span className="badge bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs">
                      {TARGET_LABEL[r.targetType]}
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(r.createdAt).toLocaleString("fr-FR")}
                    </span>
                  </div>
                  <div className="mt-2 font-medium text-slate-900 dark:text-white">
                    {r.reason}
                  </div>
                  {r.message && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 whitespace-pre-wrap">
                      {r.message}
                    </p>
                  )}
                  <div className="mt-2 text-xs text-slate-500">
                    Par {r.reporter?.name || "—"}{" "}
                    {r.reporter?.email && <span>({r.reporter.email})</span>}
                    {r.targetId && <> · cible : <code>{r.targetId}</code></>}
                  </div>
                  {r.resolution && (
                    <div className="mt-2 rounded-md bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-2 text-xs">
                      <span className="font-medium">Résolution :</span> {r.resolution}
                      {r.resolvedBy?.name && <> — {r.resolvedBy.name}</>}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setEditing(r)}
                    className="btn-secondary text-xs"
                  >
                    Traiter
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Supprimer ce signalement ?")) remove.mutate(r._id);
                    }}
                    className="btn-ghost text-xs text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <ResolveModal
          report={editing}
          onClose={() => setEditing(null)}
          onSaved={() => qc.invalidateQueries({ queryKey: ["admin-reports"] })}
        />
      )}
    </div>
  );
};
