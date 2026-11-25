import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ScrollText,
  ArrowLeft,
  UserPlus,
  Edit3,
  Trash2,
  KeyRound,
  Ban,
  CheckCircle,
  FileSpreadsheet,
  ShieldAlert,
  ShieldCheck,
  XCircle,
  Filter,
} from "lucide-react";
import { api } from "@/lib/api";
import { Spinner, EmptyState } from "@/components/Spinner";
import { cn } from "@/lib/utils";

type Action =
  | "user.create"
  | "user.update"
  | "user.delete"
  | "user.reset-password"
  | "user.disable"
  | "user.enable"
  | "user.import"
  | "report.update"
  | "report.delete"
  | "course.delete";

interface AuditEntry {
  _id: string;
  actor: { _id: string; name: string; email: string; avatar?: string; role: string };
  actorName: string;
  action: Action;
  targetType: "user" | "report" | "course" | "other";
  targetId?: string;
  targetLabel?: string;
  meta?: Record<string, any>;
  ip?: string;
  createdAt: string;
}

const ACTION_META: Record<
  Action,
  { label: string; icon: any; cls: string }
> = {
  "user.create": {
    label: "Création utilisateur",
    icon: UserPlus,
    cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  },
  "user.update": {
    label: "Modification utilisateur",
    icon: Edit3,
    cls: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  },
  "user.delete": {
    label: "Suppression utilisateur",
    icon: Trash2,
    cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  },
  "user.reset-password": {
    label: "Réinit. mot de passe",
    icon: KeyRound,
    cls: "bg-ht-yellow/30 text-ht-black dark:bg-ht-yellow/20 dark:text-ht-yellow",
  },
  "user.disable": {
    label: "Désactivation",
    icon: Ban,
    cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  },
  "user.enable": {
    label: "Réactivation",
    icon: CheckCircle,
    cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  },
  "user.import": {
    label: "Import CSV",
    icon: FileSpreadsheet,
    cls: "bg-ht-yellow/30 text-ht-black dark:bg-ht-yellow/20 dark:text-ht-yellow",
  },
  "report.update": {
    label: "Signalement traité",
    icon: ShieldCheck,
    cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  },
  "report.delete": {
    label: "Signalement supprimé",
    icon: ShieldAlert,
    cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  },
  "course.delete": {
    label: "Cours supprimé",
    icon: XCircle,
    cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  },
};

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const AdminAuditPage = () => {
  const [filter, setFilter] = useState<"all" | Action>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["audit-log", filter],
    queryFn: async () => {
      const params: any = { limit: 200 };
      if (filter !== "all") params.action = filter;
      const { data } = await api.get("/admin/audit", { params });
      return data as AuditEntry[];
    },
  });

  const allActions: ("all" | Action)[] = [
    "all",
    "user.create",
    "user.update",
    "user.delete",
    "user.disable",
    "user.enable",
    "user.reset-password",
    "user.import",
    "report.update",
    "report.delete",
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <Link
        to="/admin/users"
        className="text-sm text-slate-600 dark:text-slate-400 hover:text-ht-red dark:hover:text-ht-yellow flex items-center gap-1 mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Utilisateurs
      </Link>

      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <ScrollText className="w-7 h-7 text-ht-yellow" /> Journal d'audit
          </h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            Historique des actions administratives — les 200 entrées les plus récentes.
          </p>
        </div>
      </div>

      <div className="card p-3 mb-4 flex items-center gap-2 overflow-x-auto">
        <div className="flex items-center gap-1 text-xs uppercase font-bold tracking-wider text-slate-500 shrink-0 pr-2">
          <Filter className="w-3.5 h-3.5" /> Filtrer
        </div>
        {allActions.map((a) => {
          const active = filter === a;
          const meta = a === "all" ? null : ACTION_META[a];
          return (
            <button
              key={a}
              onClick={() => setFilter(a)}
              className={cn(
                "px-3 py-1 rounded-md text-xs whitespace-nowrap border transition-colors",
                active
                  ? "bg-ht-black text-white border-ht-black dark:bg-white dark:text-ht-black dark:border-white"
                  : "border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              {a === "all" ? "Tous" : meta?.label}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <Spinner />
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={<ScrollText className="w-7 h-7" />}
          title="Journal vide"
          message="Aucune action administrative n'a encore été enregistrée pour ce filtre."
        />
      ) : (
        <ul className="space-y-2">
          {data.map((e) => {
            const meta = ACTION_META[e.action] || {
              label: e.action,
              icon: ScrollText,
              cls: "bg-slate-100 text-slate-700",
            };
            const Icon = meta.icon;
            return (
              <li key={e._id} className="card p-4 flex items-start gap-3">
                <div
                  className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                    meta.cls
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap text-sm">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {e.actor?.name || e.actorName}
                    </span>
                    <span className="text-slate-500">a effectué</span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium",
                        meta.cls
                      )}
                    >
                      {meta.label}
                    </span>
                    {e.targetLabel && (
                      <>
                        <span className="text-slate-500">sur</span>
                        <span className="font-mono text-xs text-slate-700 dark:text-slate-200">
                          {e.targetLabel}
                        </span>
                      </>
                    )}
                  </div>
                  {e.meta && Object.keys(e.meta).length > 0 && (
                    <div className="mt-1 text-[11px] text-slate-500 font-mono bg-slate-50 dark:bg-slate-900/50 rounded px-2 py-1 inline-block">
                      {Object.entries(e.meta)
                        .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`)
                        .join(" · ")}
                    </div>
                  )}
                  <div className="mt-1 text-xs text-slate-400 flex items-center gap-2">
                    <span>{fmtDate(e.createdAt)}</span>
                    {e.ip && <span className="font-mono">IP {e.ip}</span>}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
