import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, CheckCircle2, AlertTriangle, Trophy, Bug, ClipboardList } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface NotificationItem {
  _id: string;
  kind: "final-graded" | "final-pending-grading" | "report-resolved" | "report-dismissed";
  title: string;
  body?: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

const iconFor = (kind: NotificationItem["kind"]) => {
  if (kind === "final-graded") return <Trophy className="w-4 h-4 text-ht-yellow" />;
  if (kind === "final-pending-grading") return <ClipboardList className="w-4 h-4 text-ht-red dark:text-ht-yellow" />;
  if (kind === "report-resolved") return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
  return <AlertTriangle className="w-4 h-4 text-slate-400" />;
};

const fmtAgo = (iso: string) => {
  const d = new Date(iso).getTime();
  const now = Date.now();
  const sec = Math.floor((now - d) / 1000);
  if (sec < 60) return "à l'instant";
  if (sec < 3600) return `il y a ${Math.floor(sec / 60)} min`;
  if (sec < 86400) return `il y a ${Math.floor(sec / 3600)} h`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
};

export const NotificationsBell = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  const { data: countData } = useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: async () =>
      (await api.get("/notifications/unread-count")).data as { count: number },
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });
  const unread = countData?.count ?? 0;

  const { data: list = [] } = useQuery({
    queryKey: ["notifications", "list"],
    queryFn: async () => (await api.get("/notifications")).data as NotificationItem[],
    enabled: open,
  });

  const markOne = useMutation({
    mutationFn: async (id: string) => (await api.post(`/notifications/${id}/read`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAll = useMutation({
    mutationFn: async () => (await api.post("/notifications/read-all")).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const onItemClick = async (n: NotificationItem) => {
    if (!n.read) markOne.mutate(n._id);
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
        aria-label="Notifications"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-ht-red text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-80 max-h-[28rem] overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl shadow-slate-900/10 dark:shadow-black/40 animate-fade-in"
        >
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-sm font-semibold">Notifications</span>
            {unread > 0 && (
              <button
                onClick={() => markAll.mutate()}
                className="text-xs text-ht-red dark:text-ht-yellow hover:underline flex items-center gap-1 font-semibold"
              >
                <Check className="w-3.5 h-3.5" /> Tout marquer lu
              </button>
            )}
          </div>

          {list.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-slate-500 flex flex-col items-center gap-2">
              <Bug className="w-6 h-6 text-slate-300" />
              Aucune notification pour le moment.
            </div>
          ) : (
            <ul>
              {list.map((n) => (
                <li key={n._id}>
                  <button
                    onClick={() => onItemClick(n)}
                    className={cn(
                      "w-full text-left px-3 py-3 flex items-start gap-3 border-b border-slate-50 dark:border-slate-800/60 last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors",
                      !n.read && "bg-ht-yellow/5"
                    )}
                  >
                    <span className="mt-0.5 shrink-0">{iconFor(n.kind)}</span>
                    <span className="flex-1 min-w-0">
                      <span className="flex items-start justify-between gap-2">
                        <span className={cn("text-sm leading-snug", !n.read ? "font-semibold" : "font-medium text-slate-700 dark:text-slate-300")}>
                          {n.title}
                        </span>
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-ht-red shrink-0 mt-1.5" />
                        )}
                      </span>
                      {n.body && (
                        <span className="block mt-0.5 text-xs text-slate-500 line-clamp-2">
                          {n.body}
                        </span>
                      )}
                      <span className="block mt-1 text-[10px] text-slate-400">
                        {fmtAgo(n.createdAt)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
