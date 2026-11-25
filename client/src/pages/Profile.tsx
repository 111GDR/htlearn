import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  UserCircle,
  Camera,
  Save,
  Loader2,
  KeyRound,
  Mail,
  GraduationCap,
  Shield,
  BadgeCheck,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { useAuth } from "@/store/auth";
import { cn } from "@/lib/utils";

const ROLE_LABEL = {
  admin: "Administrateur",
  teacher: "Enseignant",
  student: "Étudiant",
} as const;

export const ProfilePage = () => {
  const user = useAuth((s) => s.user);
  const setUser = useAuth((s) => s.setUser);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [uploading, setUploading] = useState(false);

  if (!user) return null;

  const dirty = name !== user.name || bio !== (user.bio || "") || avatar !== (user.avatar || "");

  const save = useMutation({
    mutationFn: async () => {
      const { data } = await api.patch("/auth/me", {
        name: name.trim(),
        bio: bio.trim(),
        avatar: avatar.trim(),
      });
      return data.user;
    },
    onSuccess: (u) => {
      setUser(u);
      toast.success("Profil mis à jour");
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Erreur"),
  });

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    setUploading(true);
    try {
      const { data } = await api.post("/uploads/avatar", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setAvatar(data.url);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Échec de l'upload");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <UserCircle className="w-8 h-8 text-ht-yellow" /> Mon profil
        </h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Mettez à jour vos informations personnelles.
        </p>
      </div>

      <div className="card p-6 sm:p-8 space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-ht-yellow text-ht-black flex items-center justify-center text-3xl font-extrabold overflow-hidden ring-2 ring-ht-yellow/40">
              {avatar ? (
                <img src={avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user.name[0]?.toUpperCase()
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-ht-black text-ht-yellow flex items-center justify-center shadow-ink hover:scale-105 transition-transform disabled:opacity-60"
              aria-label="Changer la photo"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={onPickFile}
            />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-lg text-slate-900 dark:text-white">{user.name}</div>
            <div className="text-sm text-slate-500 truncate flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" /> {user.email}
            </div>
            <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-ht-yellow/30 text-ht-black dark:bg-ht-yellow/20 dark:text-ht-yellow">
              {user.role === "admin" && <Shield className="w-3 h-3" />}
              {user.role === "teacher" && <GraduationCap className="w-3 h-3" />}
              {ROLE_LABEL[user.role]}
            </div>
            {avatar && (
              <button
                type="button"
                onClick={() => setAvatar("")}
                className="ml-2 text-xs text-slate-500 hover:text-red-500 inline-flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> Retirer
              </button>
            )}
          </div>
        </div>

        {/* Editable fields */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
              Nom complet
            </label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
              Email
            </label>
            <input className="input opacity-70 cursor-not-allowed" value={user.email} readOnly />
            <p className="text-[11px] text-slate-500 mt-1">
              L'email est géré par l'administration scolaire.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
              Rôle
            </label>
            <input
              className="input opacity-70 cursor-not-allowed"
              value={ROLE_LABEL[user.role]}
              readOnly
            />
          </div>
          {user.role === "student" && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <BadgeCheck className="w-3.5 h-3.5" /> Identifiant étudiant
                </label>
                <input
                  className="input opacity-70 cursor-not-allowed"
                  value={user.studentId || "—"}
                  readOnly
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
                  Classe / niveau
                </label>
                <input
                  className="input opacity-70 cursor-not-allowed"
                  value={user.grade || "—"}
                  readOnly
                />
              </div>
            </>
          )}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">
              Bio
              <span className="text-xs text-slate-400 ml-1 font-normal">
                ({500 - bio.length} caractères restants)
              </span>
            </label>
            <textarea
              rows={4}
              className="input resize-y"
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 500))}
              placeholder={
                user.role === "teacher"
                  ? "Parlez de votre parcours et de vos domaines d'expertise."
                  : "Quelques mots à propos de vous."
              }
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          <Link
            to="/change-password"
            className="btn-ghost text-sm"
          >
            <KeyRound className="w-4 h-4" /> Changer le mot de passe
          </Link>
          <button
            onClick={() => save.mutate()}
            disabled={!dirty || save.isPending || uploading || name.trim().length < 2}
            className={cn(
              "btn-primary",
              (!dirty || save.isPending) && "opacity-60 cursor-not-allowed"
            )}
          >
            {save.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement…</>
            ) : (
              <><Save className="w-4 h-4" /> Enregistrer</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
