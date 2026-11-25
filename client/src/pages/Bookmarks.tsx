import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { BookmarkCheck, BookOpen, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { CourseCard } from "@/components/CourseCard";
import { Spinner, EmptyState } from "@/components/Spinner";

interface BookmarkRow {
  _id: string;
  course: any;
  createdAt: string;
}

export const BookmarksPage = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["my-bookmarks"],
    queryFn: async () => (await api.get("/bookmarks")).data as BookmarkRow[],
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <BookmarkCheck className="w-7 h-7 text-ht-yellow" /> Mes favoris
          </h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            Les cours que vous avez mis de côté pour plus tard.
          </p>
        </div>
        <Link to="/courses" className="btn-ghost text-sm">
          Explorer le catalogue <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {isLoading ? (
        <Spinner />
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="w-7 h-7" />}
          title="Aucun favori pour le moment"
          message="Cliquez sur l'icône en haut à droite d'un cours pour l'ajouter ici."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {data.map((b) => (
            <CourseCard key={b._id} course={b.course} />
          ))}
        </div>
      )}
    </div>
  );
};
