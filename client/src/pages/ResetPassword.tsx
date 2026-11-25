import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ShieldCheck, Check, X, AlertCircle } from "lucide-react";
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

export const ResetPasswordPage = () => {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const checks = useMemo(() => rules.map((r) => ({ ...r, ok: r.test(password) })), [password]);
  const mismatch = confirm.length > 0 && confirm !== password;
  const allOk = checks.every((c) => c.ok) && !mismatch;

  if (!token) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
        <div className="card p-8 max-w-md text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-ht-red mx-auto" />
          <h1 className="text-xl font-bold">Lien invalide</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Ce lien ne contient pas de jeton de réinitialisation.
          </p>
          <Link to="/forgot-password" className="btn-primary">
            Demander un nouveau lien
          </Link>
        </div>
      </div>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allOk) return;
    setLoading(true);
    try {
      const { data } = await api.post("/auth/reset-password", { token, password });
      localStorage.setItem("token", data.token);
      setUser(data.user);
      toast.success("Mot de passe réinitialisé !");
      navigate(data.user.mustChangePassword ? "/change-password" : "/dashboard", { replace: true });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lien invalide ou expiré");
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
            Nouveau mot de passe
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Choisissez un mot de passe sûr — ce lien n'est utilisable qu'une fois.
          </p>
        </div>

        <form onSubmit={onSubmit} className="card p-8 space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1.5">Nouveau mot de passe</label>
            <div className="relative">
              <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input pl-10"
                placeholder="8 caractères minimum"
                autoFocus
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
            </ul>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Confirmer le mot de passe</label>
            <input
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="input"
              placeholder="Retapez le mot de passe"
              autoComplete="new-password"
            />
            {mismatch && (
              <p className="mt-1 text-xs text-ht-red">Les mots de passe ne correspondent pas.</p>
            )}
          </div>

          <button type="submit" disabled={!allOk || loading} className="btn-primary w-full py-2.5">
            {loading ? "Enregistrement..." : "Réinitialiser mon mot de passe"}
          </button>
        </form>
      </div>
    </div>
  );
};
