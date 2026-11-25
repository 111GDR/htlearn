import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, MailCheck } from "lucide-react";
import { api } from "@/lib/api";
import { Logo } from "@/components/Logo";

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
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
            Mot de passe oublié ?
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Saisissez votre email scolaire — nous vous enverrons un lien de réinitialisation.
          </p>
        </div>

        {sent ? (
          <div className="card p-8 text-center space-y-4 animate-fade-in">
            <div className="inline-flex w-14 h-14 rounded-2xl bg-ht-yellow text-ht-black items-center justify-center">
              <MailCheck className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Email envoyé !</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Si un compte existe pour <strong>{email}</strong>, un lien de réinitialisation vient
              d'être envoyé. Il est valable <strong>30 minutes</strong>.
            </p>
            <p className="text-xs text-slate-500">
              Pensez à vérifier votre dossier spam si vous ne le voyez pas.
            </p>
            <Link to="/login" className="btn-ghost w-full">
              <ArrowLeft className="w-4 h-4" /> Retour à la connexion
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="card p-8 space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-10"
                  placeholder="prenom.nom@hightech.edu"
                  autoFocus
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
              {loading ? "Envoi..." : "Envoyer le lien"}
            </button>

            <Link
              to="/login"
              className="flex items-center justify-center gap-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-ht-red"
            >
              <ArrowLeft className="w-4 h-4" /> Retour à la connexion
            </Link>
          </form>
        )}
      </div>
    </div>
  );
};
