import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, ShieldCheck, Check, X } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { useAuth } from "@/store/auth";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";

const rules = [
  { label: "Au moins 8 caractères", test: (p: string) => p.length >= 8 },
  { label: "Au moins une majuscule", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Au moins un chiffre", test: (p: string) => /[0-9]/.test(p) },
];

export const ChangePasswordPage = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNew] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const forced = !!user?.mustChangePassword;

  const checks = useMemo(
    () => rules.map((r) => ({ ...r, ok: r.test(newPassword) })),
    [newPassword]
  );
  const sameAsOld = newPassword.length > 0 && newPassword === currentPassword;
  const mismatch = confirm.length > 0 && confirm !== newPassword;
  const allOk = checks.every((c) => c.ok) && !sameAsOld && !mismatch && currentPassword.length > 0;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allOk) return;
    setLoading(true);
    try {
      const { data } = await api.post("/auth/change-password", {
        currentPassword,
        newPassword,
      });
      setUser(data.user);
      toast.success("Mot de passe mis à jour !");
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erreur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 overflow-hidden">
      <div className="absolute -top-32 -right-20 w-[360px] h-[360px] bg-ht-yellow/30 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 -left-20 w-[320px] h-[320px] bg-ht-red/10 rounded-full blur-3xl" />

      <div className="relative w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex mb-4">
            <Logo size={56} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            {forced ? "Choisissez votre mot de passe" : "Changer de mot de passe"}
          </h1>
          {forced && (
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              Avant d'accéder à votre espace, vous devez définir un mot de passe personnel.
            </p>
          )}
        </div>

        <form onSubmit={onSubmit} className="card p-8 space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              {forced ? "Mot de passe temporaire (reçu par email)" : "Mot de passe actuel"}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrent(e.target.value)}
                className="input pl-10"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Nouveau mot de passe</label>
            <div className="relative">
              <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNew(e.target.value)}
                className="input pl-10"
                placeholder="8 caractères minimum"
                autoComplete="new-password"
              />
            </div>
            <ul className="mt-3 space-y-1">
              {checks.map((c) => (
                <li
                  key={c.label}
                  className={cn(
                    "flex items-center gap-2 text-xs",
                    c.ok ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500"
                  )}
                >
                  {c.ok ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  {c.label}
                </li>
              ))}
              {sameAsOld && (
                <li className="flex items-center gap-2 text-xs text-ht-red">
                  <X className="w-3.5 h-3.5" />
                  Doit être différent de l'ancien
                </li>
              )}
            </ul>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Confirmer le mot de passe</label>
            <div className="relative">
              <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="input pl-10"
                placeholder="Retapez le nouveau mot de passe"
                autoComplete="new-password"
              />
            </div>
            {mismatch && (
              <p className="mt-1 text-xs text-ht-red">Les mots de passe ne correspondent pas.</p>
            )}
          </div>

          <button
            type="submit"
            disabled={!allOk || loading}
            className="btn-primary w-full py-2.5"
          >
            {loading ? "Enregistrement..." : "Définir mon mot de passe"}
          </button>
        </form>
      </div>
    </div>
  );
};
