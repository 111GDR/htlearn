import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, BookOpen, Eye, EyeOff, UploadCloud, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { Spinner, EmptyState } from "@/components/Spinner";
import { cn } from "@/lib/utils";

const ThumbnailDropzone = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Le fichier doit être une image");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image trop lourde (max 5 Mo)");
      return;
    }
    const fd = new FormData();
    fd.append("file", file);
    setUploading(true);
    try {
      const { data } = await api.post("/uploads/image", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onChange(data.url);
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Échec de l'upload");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-1">Image du cours (optionnel)</label>
      {value ? (
        <div className="relative group rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
          <img src={value} alt="Aperçu" className="w-full h-40 object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
            title="Retirer l'image"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files?.[0];
            if (file) upload(file);
          }}
          className={cn(
            "flex flex-col items-center justify-center gap-2 p-6 rounded-lg border-2 border-dashed cursor-pointer transition-colors text-center",
            dragOver
              ? "border-ht-yellow bg-ht-yellow/10 dark:bg-ht-yellow/5"
              : "border-slate-300 dark:border-slate-700 hover:border-ht-yellow hover:bg-slate-50 dark:hover:bg-slate-800/50",
            uploading && "opacity-60 pointer-events-none"
          )}
        >
          {uploading ? (
            <Loader2 className="w-8 h-8 text-ht-red dark:text-ht-yellow animate-spin" />
          ) : (
            <UploadCloud className="w-8 h-8 text-slate-400" />
          )}
          <div className="text-sm text-slate-700 dark:text-slate-300">
            <span className="font-semibold text-ht-red dark:text-ht-yellow">Cliquez</span> ou glissez-déposez une image
          </div>
          <p className="text-xs text-slate-500">PNG, JPG, WEBP ou GIF — max 5 Mo</p>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
          e.target.value = "";
        }}
      />
    </div>
  );
};

const CourseFormModal = ({
  initial,
  onClose,
  onSaved,
}: {
  initial?: any;
  onClose: () => void;
  onSaved: () => void;
}) => {
  const [form, setForm] = useState({
    title: initial?.title || "",
    description: initial?.description || "",
    category: initial?.category || "Informatique",
    level: initial?.level || "Débutant",
    thumbnail: initial?.thumbnail || "",
    published: initial?.published || false,
  });

  const save = useMutation({
    mutationFn: async () =>
      initial
        ? (await api.put(`/courses/${initial._id}`, form)).data
        : (await api.post("/courses", form)).data,
    onSuccess: () => {
      toast.success(initial ? "Cours mis à jour" : "Cours créé");
      onSaved();
      onClose();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Erreur"),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="card w-full max-w-lg p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">{initial ? "Modifier" : "Nouveau cours"}</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Titre</label>
            <input
              className="input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              rows={3}
              className="input"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Catégorie</label>
              <select
                className="input"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {["Informatique", "Mathématiques", "Sciences", "Langues"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Niveau</label>
              <select
                className="input"
                value={form.level}
                onChange={(e) => setForm({ ...form, level: e.target.value })}
              >
                {["Débutant", "Intermédiaire", "Avancé"].map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>
          <ThumbnailDropzone
            value={form.thumbnail}
            onChange={(url) => setForm({ ...form, thumbnail: url })}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => setForm({ ...form, published: e.target.checked })}
              className="w-4 h-4 rounded border-slate-300 text-ht-black focus:ring-ht-yellow"
            />
            Publier ce cours (visible par les étudiants)
          </label>
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

export const TeacherCoursesPage = () => {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<any | null>(null);
  const [creating, setCreating] = useState(false);

  const { data: courses, isLoading } = useQuery({
    queryKey: ["my-courses"],
    queryFn: async () => (await api.get("/courses/mine")).data,
  });

  const remove = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/courses/${id}`)).data,
    onSuccess: () => {
      toast.success("Cours supprimé");
      qc.invalidateQueries({ queryKey: ["my-courses"] });
    },
  });

  const togglePublish = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) =>
      (await api.put(`/courses/${id}`, { published })).data,
    onSuccess: (data: any) => {
      toast.success(data.published ? "Cours publié" : "Cours masqué (brouillon)");
      qc.invalidateQueries({ queryKey: ["my-courses"] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Erreur"),
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Mes cours</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Créez et gérez vos cours
          </p>
        </div>
        <button onClick={() => setCreating(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Nouveau cours
        </button>
      </div>

      {isLoading ? (
        <Spinner />
      ) : courses?.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="w-12 h-12" />}
          title="Aucun cours créé"
          message="Cliquez sur « Nouveau cours » pour commencer."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses?.map((c: any) => (
            <div key={c._id} className="card p-5 hover:shadow-md transition-all">
              <div className="flex items-start gap-4">
                <div className="relative w-16 h-16 rounded-lg bg-ht-black shrink-0 overflow-hidden">
                  {c.thumbnail ? (
                    <img src={c.thumbnail} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-ht-yellow rounded-bl-2xl" />
                      <BookOpen className="absolute inset-0 m-auto w-6 h-6 text-white/70" />
                    </>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                      {c.title}
                    </h3>
                    <button
                      type="button"
                      onClick={() =>
                        togglePublish.mutate({ id: c._id, published: !c.published })
                      }
                      disabled={togglePublish.isPending}
                      className={cn(
                        "badge cursor-pointer transition-colors",
                        c.published
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/50"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/50"
                      )}
                      title={
                        c.published
                          ? "Cliquez pour repasser en brouillon"
                          : "Cliquez pour publier ce cours"
                      }
                    >
                      {c.published ? (
                        <><Eye className="w-3 h-3 mr-1" />publié</>
                      ) : (
                        <><EyeOff className="w-3 h-3 mr-1" />brouillon</>
                      )}
                    </button>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                    {c.description}
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <Link to={`/teach/courses/${c._id}`} className="btn-secondary text-xs">
                      Gérer le contenu
                    </Link>
                    <button onClick={() => setEditing(c)} className="btn-ghost text-xs">
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Supprimer ce cours et tout son contenu ?")) {
                          remove.mutate(c._id);
                        }
                      }}
                      className="btn-ghost text-xs text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <CourseFormModal
          initial={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => qc.invalidateQueries({ queryKey: ["my-courses"] })}
        />
      )}
    </div>
  );
};
