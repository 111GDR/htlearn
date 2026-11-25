import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Filter, BookOpen, Sparkles, Search as SearchIcon } from "lucide-react";
import { api } from "@/lib/api";
import { CourseCard } from "@/components/CourseCard";
import { Spinner, EmptyState } from "@/components/Spinner";
import { cn } from "@/lib/utils";

const categories = ["all", "Informatique", "Mathématiques", "Sciences", "Langues"];

export const CoursesPage = () => {
  const [params] = useSearchParams();
  const search = params.get("search") || "";
  const [category, setCategory] = useState("all");

  const { data: courses, isLoading } = useQuery({
    queryKey: ["courses", search, category],
    queryFn: async () => {
      const { data } = await api.get("/courses", { params: { search, category } });
      return data;
    },
  });

  const total = courses?.length ?? 0;

  return (
    <div>
      {/* ============ HERO BAND ============ */}
      <section className="relative overflow-hidden border-b border-slate-200 dark:border-slate-800">
        <div className="absolute inset-0 bg-gradient-to-br from-ht-yellow/20 via-white to-white dark:from-ht-yellow/5 dark:via-slate-950 dark:to-slate-950" />
        <div className="absolute inset-0 bg-ht-grid [background-size:40px_40px] opacity-30 dark:opacity-10" />
        <div className="absolute -top-24 -right-10 w-[360px] h-[360px] bg-ht-yellow/30 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <span className="chip-ribbon">
                <Sparkles className="w-3 h-3" />
                Catalogue
              </span>
              <h1 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
                Tous les <span className="relative inline-block">
                  <span className="relative z-10">cours</span>
                  <span className="absolute inset-x-0 bottom-1 h-3 sm:h-4 bg-ht-yellow -z-0 -skew-x-3" />
                </span>
              </h1>
              <p className="mt-3 text-slate-600 dark:text-slate-400 max-w-xl">
                Découvrez et apprenez à votre rythme. Explorez par catégorie pour trouver ce qui vous correspond.
              </p>
            </div>
            {!isLoading && (
              <div className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ht-black text-white text-sm font-semibold">
                <BookOpen className="w-4 h-4 text-ht-yellow" />
                {total} cours {search && <span className="opacity-70">pour "{search}"</span>}
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-8 -mx-1 px-1">
          <div className="flex items-center gap-1.5 shrink-0 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 pr-1">
            <Filter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Catégorie</span>
          </div>
          {categories.map((c) => {
            const active = category === c;
            return (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all cursor-pointer border",
                  active
                    ? "bg-ht-black text-white border-ht-black dark:bg-white dark:text-ht-black dark:border-white shadow-ink"
                    : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-ht-yellow hover:text-ht-black dark:hover:text-ht-yellow"
                )}
              >
                {c === "all" ? "Tout" : c}
              </button>
            );
          })}
        </div>

        {/* Results */}
        {isLoading ? (
          <Spinner />
        ) : courses?.length === 0 ? (
          <EmptyState
            icon={search ? <SearchIcon className="w-7 h-7" /> : <BookOpen className="w-7 h-7" />}
            title={search ? "Aucun résultat" : "Aucun cours trouvé"}
            message={
              search
                ? `Aucun cours ne correspond à "${search}". Essayez d'autres mots-clés.`
                : "Essayez d'ajuster vos filtres ou revenez plus tard."
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {courses?.map((c: any) => (
              <CourseCard key={c._id} course={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
