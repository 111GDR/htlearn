import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Shield,
  Users as UsersIcon,
  KeyRound,
  MailCheck,
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Download,
  Loader2,
  Ban,
  CheckCircle,
  ScrollText,
} from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { Spinner } from "@/components/Spinner";
import { useAuth } from "@/store/auth";
import { cn } from "@/lib/utils";

interface ImportResult {
  createdCount: number;
  errorCount: number;
  mailFailures: number;
  errors: { line: number; email?: string; reason: string }[];
}

const SAMPLE_CSV = `name,email,role,studentId,grade,bio
Taha Mhoumadi,taha.mhoumadi@hightech.edu,student,HT-2025-001,L2,
Karima Bennani,karima.bennani@hightech.edu,teacher,,,Enseignante en algorithmique
`;

const ImportModal = ({
  onClose,
  onDone,
}: {
  onClose: () => void;
  onDone: () => void;
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [filename, setFilename] = useState<string>("");

  const importMut = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/admin/users/import", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data as ImportResult;
    },
    onSuccess: (data) => {
      setResult(data);
      if (data.createdCount > 0) onDone();
      if (data.createdCount > 0 && data.errorCount === 0) {
        toast.success(`${data.createdCount} compte${data.createdCount > 1 ? "s" : ""} créé${data.createdCount > 1 ? "s" : ""}`);
      } else if (data.createdCount > 0) {
        toast(`${data.createdCount} créé(s), ${data.errorCount} erreur(s)`, { icon: "⚠️" });
      } else {
        toast.error(`Aucun compte créé (${data.errorCount} erreur(s))`);
      }
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Échec de l'import"),
  });

  const onPick = (file: File) => {
    setFilename(file.name);
    setResult(null);
    importMut.mutate(file);
  };

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modele-utilisateurs.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="card w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto animate-slide-up">
        <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-ht-yellow" /> Import CSV
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          Importez plusieurs utilisateurs d'un coup. Chaque compte créé reçoit un
          mot de passe temporaire par email.
        </p>

        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-3 text-xs space-y-1 mb-4">
          <div className="font-semibold text-slate-700 dark:text-slate-200">
            Colonnes attendues (1<sup>ère</sup> ligne) :
          </div>
          <code className="block font-mono text-[11px] text-slate-600 dark:text-slate-300 break-words">
            name, email, role, studentId, grade, bio
          </code>
          <div className="text-slate-500">
            • <strong>role</strong> = <code>student</code>, <code>teacher</code> ou <code>admin</code>
            <br />
            • <strong>studentId</strong> et <strong>grade</strong> ne s'appliquent qu'aux étudiants
            <br />
            • Les emails déjà existants sont ignorés (signalés dans les erreurs)
          </div>
          <button
            type="button"
            onClick={downloadSample}
            className="mt-1 text-ht-red dark:text-ht-yellow hover:underline inline-flex items-center gap-1 font-semibold"
          >
            <Download className="w-3 h-3" /> Télécharger un modèle CSV
          </button>
        </div>

        {!result && (
          <div
            onClick={() => fileRef.current?.click()}
            className={cn(
              "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 cursor-pointer text-center transition-colors",
              importMut.isPending
                ? "opacity-60 pointer-events-none border-slate-300 dark:border-slate-700"
                : "border-slate-300 dark:border-slate-700 hover:border-ht-yellow hover:bg-slate-50 dark:hover:bg-slate-900/50"
            )}
          >
            {importMut.isPending ? (
              <Loader2 className="w-8 h-8 text-ht-yellow animate-spin" />
            ) : (
              <Upload className="w-8 h-8 text-slate-400" />
            )}
            <div className="text-sm text-slate-700 dark:text-slate-300">
              {importMut.isPending ? (
                <>Import en cours…{filename && <span className="block text-xs text-slate-500">{filename}</span>}</>
              ) : (
                <>
                  <span className="font-semibold text-ht-red dark:text-ht-yellow">
                    Cliquez pour choisir
                  </span>{" "}
                  un fichier .csv (max 2 Mo)
                </>
              )}
            </div>
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) onPick(f);
          }}
        />

        {result && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 p-3">
                <div className="text-2xl font-extrabold">{result.createdCount}</div>
                <div className="text-[10px] uppercase tracking-wider font-semibold">Créés</div>
              </div>
              <div className="rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 p-3">
                <div className="text-2xl font-extrabold">{result.errorCount}</div>
                <div className="text-[10px] uppercase tracking-wider font-semibold">Erreurs</div>
              </div>
              <div className="rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 p-3">
                <div className="text-2xl font-extrabold">{result.mailFailures}</div>
                <div className="text-[10px] uppercase tracking-wider font-semibold">Email KO</div>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10 p-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-red-700 dark:text-red-300 mb-2">
                  <AlertTriangle className="w-4 h-4" /> Erreurs
                </div>
                <ul className="space-y-1 max-h-48 overflow-y-auto text-xs">
                  {result.errors.map((er, i) => (
                    <li key={i} className="text-slate-700 dark:text-slate-300">
                      <span className="font-mono text-slate-500">L{er.line}</span>{" "}
                      {er.email && <span className="font-medium">{er.email} —</span>}{" "}
                      <span className="text-red-600 dark:text-red-400">{er.reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.createdCount > 0 && (
              <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4" />
                Les utilisateurs créés ont reçu leur mot de passe temporaire par email.
              </div>
            )}

            <button
              onClick={() => {
                setResult(null);
                setFilename("");
              }}
              className="btn-ghost w-full text-sm"
            >
              Importer un autre fichier
            </button>
          </div>
        )}

        <div className="flex justify-end pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
          <button onClick={onClose} className="btn-primary">
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

type Role = "admin" | "teacher" | "student";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  studentId?: string;
  grade?: string;
  mustChangePassword?: boolean;
  disabled?: boolean;
  disabledReason?: string;
  bio?: string;
  createdAt: string;
}

const ROLE_LABEL: Record<Role, string> = {
  admin: "Admin",
  teacher: "Enseignant",
  student: "Étudiant",
};

const ROLE_COLOR: Record<Role, string> = {
  admin: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  teacher: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  student: "bg-ht-yellow/30 text-ht-black dark:bg-ht-yellow/20 dark:text-ht-yellow",
};

const UserModal = ({
  initial,
  onClose,
  onSaved,
}: {
  initial?: AdminUser;
  onClose: () => void;
  onSaved: () => void;
}) => {
  const isEdit = !!initial;
  const [form, setForm] = useState({
    name: initial?.name || "",
    email: initial?.email || "",
    role: (initial?.role as Role) || "student",
    studentId: initial?.studentId || "",
    grade: initial?.grade || "",
    bio: initial?.bio || "",
  });

  const save = useMutation({
    mutationFn: async () => {
      if (isEdit) {
        const payload: any = {
          name: form.name,
          email: form.email,
          role: form.role,
          bio: form.bio,
        };
        if (form.role === "student") {
          payload.studentId = form.studentId;
          payload.grade = form.grade;
        }
        return (await api.patch(`/admin/users/${initial!.id}`, payload)).data;
      }
      const payload: any = {
        name: form.name,
        email: form.email,
        role: form.role,
        bio: form.bio,
      };
      if (form.role === "student") {
        payload.studentId = form.studentId || undefined;
        payload.grade = form.grade || undefined;
      }
      return (await api.post("/admin/users", payload)).data;
    },
    onSuccess: () => {
      if (isEdit) {
        toast.success("Utilisateur modifié");
      } else {
        toast.success(
          "Compte créé — un email avec le mot de passe temporaire a été envoyé.",
          { duration: 5000 }
        );
      }
      onSaved();
      onClose();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Erreur"),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="card w-full max-w-md p-6 animate-slide-up">
        <h2 className="text-xl font-bold mb-1">
          {isEdit ? "Modifier l'utilisateur" : "Nouvel utilisateur"}
        </h2>
        {!isEdit && (
          <p className="text-xs text-slate-500 mb-4 flex items-start gap-1.5">
            <MailCheck className="w-3.5 h-3.5 mt-0.5 shrink-0 text-ht-yellow" />
            <span>
              Un mot de passe temporaire sera généré automatiquement et envoyé par email.
              L'utilisateur devra le changer à sa première connexion.
            </span>
          </p>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nom complet</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Prénom Nom"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email scolaire</label>
            <input
              type="email"
              className="input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="prenom.nom@hightech.edu"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Rôle</label>
            <div className="grid grid-cols-3 gap-2">
              {(["student", "teacher", "admin"] as const).map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setForm({ ...form, role: r })}
                  className={cn(
                    "px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all",
                    form.role === r
                      ? "border-ht-yellow bg-ht-yellow/20 text-ht-black dark:text-ht-yellow"
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                  )}
                >
                  {ROLE_LABEL[r]}
                </button>
              ))}
            </div>
          </div>

          {form.role === "student" && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Identifiant étudiant
                </label>
                <input
                  className="input"
                  value={form.studentId}
                  onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                  placeholder="HT-2025-001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Classe / niveau</label>
                <input
                  className="input"
                  value={form.grade}
                  onChange={(e) => setForm({ ...form, grade: e.target.value })}
                  placeholder="L1, L2, M1…"
                />
              </div>
            </>
          )}

          {form.role === "teacher" && (
            <div>
              <label className="block text-sm font-medium mb-1">Bio (optionnel)</label>
              <textarea
                rows={3}
                className="input"
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="btn-ghost">
            Annuler
          </button>
          <button
            onClick={() => save.mutate()}
            disabled={save.isPending || !form.name || !form.email}
            className="btn-primary"
          >
            {save.isPending
              ? "..."
              : isEdit
              ? "Enregistrer"
              : "Créer le compte"}
          </button>
        </div>
      </div>
    </div>
  );
};

export const AdminUsersPage = () => {
  const { user: me } = useAuth();
  const qc = useQueryClient();
  const [roleFilter, setRoleFilter] = useState<"all" | Role>("all");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<{ open: boolean; initial?: AdminUser }>({ open: false });
  const [importOpen, setImportOpen] = useState(false);

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users", roleFilter, search],
    queryFn: async () => {
      const params: any = {};
      if (roleFilter !== "all") params.role = roleFilter;
      if (search.trim()) params.search = search.trim();
      const { data } = await api.get("/admin/users", { params });
      return data as AdminUser[];
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/admin/users/${id}`)).data,
    onSuccess: () => {
      toast.success("Utilisateur supprimé");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Erreur"),
  });

  const resetPwd = useMutation({
    mutationFn: async (id: string) =>
      (await api.post(`/admin/users/${id}/reset-password`)).data,
    onSuccess: () => {
      toast.success(
        "Mot de passe réinitialisé — un email avec le nouveau mot de passe a été envoyé.",
        { duration: 5000 }
      );
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Erreur"),
  });

  const setDisabled = useMutation({
    mutationFn: async ({
      id,
      disabled,
      reason,
    }: {
      id: string;
      disabled: boolean;
      reason?: string;
    }) =>
      (await api.post(`/admin/users/${id}/disable`, { disabled, reason })).data,
    onSuccess: (_data, vars) => {
      toast.success(vars.disabled ? "Compte désactivé" : "Compte réactivé");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Erreur"),
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UsersIcon className="w-7 h-7 text-ht-yellow" /> Utilisateurs
          </h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            Créez et gérez les comptes de l'École High-Tech.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link to="/admin/audit" className="btn-ghost">
            <ScrollText className="w-4 h-4" /> Audit
          </Link>
          <button onClick={() => setImportOpen(true)} className="btn-secondary">
            <FileSpreadsheet className="w-4 h-4" /> Import CSV
          </button>
          <button onClick={() => setModal({ open: true })} className="btn-primary">
            <Plus className="w-4 h-4" /> Nouvel utilisateur
          </button>
        </div>
      </div>

      <div className="card p-4 mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
            placeholder="Rechercher par nom, email ou ID étudiant…"
          />
        </div>
        <div className="flex items-center gap-1.5">
          {(["all", "admin", "teacher", "student"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm border transition-colors",
                roleFilter === r
                  ? "bg-ht-black text-white border-ht-black dark:bg-white dark:text-ht-black"
                  : "border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              {r === "all" ? "Tous" : ROLE_LABEL[r]}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <Spinner />
      ) : !users || users.length === 0 ? (
        <div className="card p-10 text-center text-slate-500">Aucun utilisateur trouvé.</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Utilisateur</th>
                <th className="px-4 py-3">Rôle</th>
                <th className="px-4 py-3 hidden lg:table-cell">Détails</th>
                <th className="px-4 py-3 hidden md:table-cell">Inscrit le</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {users.map((u) => (
                <tr
                  key={u.id}
                  className={cn(
                    "hover:bg-slate-50 dark:hover:bg-slate-900/30",
                    u.disabled && "opacity-60"
                  )}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-ht-yellow flex items-center justify-center text-ht-black font-bold text-sm ring-1 ring-ht-black/10">
                        {u.name[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                          <span className={cn(u.disabled && "line-through")}>{u.name}</span>
                          {u.disabled && (
                            <span
                              title={u.disabledReason || "Compte désactivé"}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                            >
                              <Ban className="w-2.5 h-2.5" /> désactivé
                            </span>
                          )}
                          {u.mustChangePassword && (
                            <span
                              title="Doit changer son mot de passe à la prochaine connexion"
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-ht-yellow/30 text-ht-black dark:bg-ht-yellow/20 dark:text-ht-yellow"
                            >
                              <KeyRound className="w-2.5 h-2.5" /> temp
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 truncate">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium",
                        ROLE_COLOR[u.role]
                      )}
                    >
                      {u.role === "admin" && <Shield className="w-3 h-3" />}
                      {ROLE_LABEL[u.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 hidden lg:table-cell">
                    {u.role === "student" ? (
                      <>
                        {u.studentId && <div>ID : {u.studentId}</div>}
                        {u.grade && <div>Classe : {u.grade}</div>}
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500 hidden md:table-cell">
                    {new Date(u.createdAt).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => {
                        if (
                          confirm(
                            `Réinitialiser le mot de passe de ${u.name} ? Un nouveau mot de passe temporaire lui sera envoyé par email.`
                          )
                        )
                          resetPwd.mutate(u.id);
                      }}
                      className="btn-ghost text-xs"
                      title="Réinitialiser le mot de passe"
                    >
                      <KeyRound className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setModal({ open: true, initial: u })}
                      className="btn-ghost text-xs"
                      title="Modifier"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {u.id !== me?.id &&
                      (u.disabled ? (
                        <button
                          onClick={() =>
                            setDisabled.mutate({ id: u.id, disabled: false })
                          }
                          className="btn-ghost text-xs text-emerald-600"
                          title="Réactiver le compte"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            const reason = prompt(
                              `Désactiver le compte de ${u.name} ?\n\nMotif (optionnel — visible dans l'audit) :`
                            );
                            if (reason === null) return; // cancelled
                            setDisabled.mutate({
                              id: u.id,
                              disabled: true,
                              reason: reason.trim() || undefined,
                            });
                          }}
                          className="btn-ghost text-xs text-amber-600"
                          title="Désactiver le compte"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      ))}
                    <button
                      onClick={() => {
                        if (u.id === me?.id) {
                          toast.error("Vous ne pouvez pas supprimer votre propre compte");
                          return;
                        }
                        if (confirm(`Supprimer ${u.name} ?`)) remove.mutate(u.id);
                      }}
                      className="btn-ghost text-xs text-red-600"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal.open && (
        <UserModal
          initial={modal.initial}
          onClose={() => setModal({ open: false })}
          onSaved={() => qc.invalidateQueries({ queryKey: ["admin-users"] })}
        />
      )}
      {importOpen && (
        <ImportModal
          onClose={() => setImportOpen(false)}
          onDone={() => qc.invalidateQueries({ queryKey: ["admin-users"] })}
        />
      )}
    </div>
  );
};
