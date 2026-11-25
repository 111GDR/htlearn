import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Flag } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { useAuth } from "@/store/auth";

type TargetType = "user" | "course" | "lesson" | "quiz" | "other";

const REASONS = [
  "Contenu inapproprié",
  "Informations incorrectes",
  "Plagiat",
  "Spam",
  "Autre",
];

export const ReportButton = ({
  targetType,
  targetId,
  label = "Signaler",
}: {
  targetType: TargetType;
  targetId?: string;
  label?: string;
}) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [message, setMessage] = useState("");

  const submit = useMutation({
    mutationFn: async () =>
      (
        await api.post("/reports", {
          targetType,
          targetId,
          reason,
          message: message.trim() || undefined,
        })
      ).data,
    onSuccess: () => {
      toast.success("Signalement envoyé. Merci !");
      setOpen(false);
      setMessage("");
      setReason(REASONS[0]);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Erreur"),
  });

  if (!user) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-slate-500 hover:text-rose-600 inline-flex items-center gap-1"
      >
        <Flag className="w-3.5 h-3.5" /> {label}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="card w-full max-w-md p-6 animate-slide-up">
            <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
              <Flag className="w-5 h-5 text-rose-600" /> Signaler
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Votre signalement sera examiné par un administrateur.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Motif</label>
                <select
                  className="input"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                >
                  {REASONS.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Détails (optionnel)
                </label>
                <textarea
                  rows={4}
                  className="input"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Décrivez le problème…"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setOpen(false)} className="btn-ghost">
                Annuler
              </button>
              <button
                onClick={() => submit.mutate()}
                disabled={submit.isPending}
                className="btn-primary"
              >
                {submit.isPending ? "..." : "Envoyer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
