import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { useAuth } from "@/store/auth";
import { cn } from "@/lib/utils";

export const BookmarkButton = ({
  courseId,
  variant = "icon",
}: {
  courseId: string;
  variant?: "icon" | "full";
}) => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: ids } = useQuery({
    queryKey: ["bookmark-ids"],
    queryFn: async () => (await api.get("/bookmarks/ids")).data.ids as string[],
    enabled: !!user,
    staleTime: 60_000,
  });

  const isMarked = useMemo(
    () => (ids || []).includes(courseId),
    [ids, courseId]
  );

  const toggle = useMutation({
    mutationFn: async () => {
      if (isMarked) {
        await api.delete(`/bookmarks/${courseId}`);
        return false;
      } else {
        await api.post(`/bookmarks/${courseId}`);
        return true;
      }
    },
    onSuccess: (added) => {
      qc.invalidateQueries({ queryKey: ["bookmark-ids"] });
      qc.invalidateQueries({ queryKey: ["my-bookmarks"] });
      toast.success(added ? "Ajouté à vos favoris" : "Retiré de vos favoris");
    },
    onError: (e: any) => toast.error(e.response?.data?.message || "Erreur"),
  });

  if (!user || user.role !== "student") return null;

  const handle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle.mutate();
  };

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={handle}
        disabled={toggle.isPending}
        className={cn(
          "p-2 rounded-full backdrop-blur-sm transition-all",
          isMarked
            ? "bg-ht-yellow text-ht-black hover:bg-ht-yellow/90"
            : "bg-black/50 text-white hover:bg-black/70"
        )}
        aria-pressed={isMarked}
        aria-label={isMarked ? "Retirer des favoris" : "Ajouter aux favoris"}
        title={isMarked ? "Retirer des favoris" : "Ajouter aux favoris"}
      >
        {toggle.isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isMarked ? (
          <BookmarkCheck className="w-4 h-4" />
        ) : (
          <Bookmark className="w-4 h-4" />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handle}
      disabled={toggle.isPending}
      className={cn(
        "btn",
        isMarked
          ? "bg-ht-yellow text-ht-black hover:bg-ht-yellow/90"
          : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
      )}
    >
      {toggle.isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isMarked ? (
        <BookmarkCheck className="w-4 h-4" />
      ) : (
        <Bookmark className="w-4 h-4" />
      )}
      {isMarked ? "Favori" : "Ajouter aux favoris"}
    </button>
  );
};
