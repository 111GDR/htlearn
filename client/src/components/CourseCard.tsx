import { Link } from "react-router-dom";
import { BookOpen, BarChart3, User, ArrowUpRight, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { BookmarkButton } from "@/components/BookmarkButton";

interface Props {
  course: any;
  progress?: number;
}

const levelColor: Record<string, string> = {
  Débutant: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  Intermédiaire: "bg-ht-yellow/40 text-ht-black dark:bg-ht-yellow/20 dark:text-ht-yellow",
  Avancé: "bg-ht-red/15 text-ht-red dark:bg-ht-red/20 dark:text-ht-red",
};

export const CourseCard = ({ course, progress }: Props) => {
  return (
    <Link
      to={`/courses/${course._id}`}
      className="card overflow-hidden hover:shadow-ink hover:-translate-y-1 transition-all duration-300 group flex flex-col cursor-pointer"
    >
      {/* Thumbnail */}
      <div className="relative h-48 sm:h-52 overflow-hidden bg-ht-black">
        {course.thumbnail ? (
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="relative w-full h-full">
            {/* HtLearn-style placeholder: yellow corner + grid + book icon */}
            <div className="absolute inset-0 bg-gradient-to-br from-ht-black via-slate-900 to-ht-black" />
            <div className="absolute inset-0 bg-ht-grid [background-size:24px_24px] opacity-30" />
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-ht-yellow rounded-bl-[80px] opacity-90" />
            <div className="absolute inset-0 flex items-center justify-center">
              <BookOpen className="w-14 h-14 text-white/70" />
            </div>
          </div>
        )}

        {/* level badge */}
        <div className="absolute top-3 left-3">
          <span className={cn("badge backdrop-blur-sm", levelColor[course.level] || levelColor.Débutant)}>
            {course.level}
          </span>
        </div>

        {/* bookmark toggle (student-only, renders null otherwise) */}
        <div className="absolute top-2 right-2">
          <BookmarkButton courseId={String(course._id)} variant="icon" />
        </div>

        {/* hover arrow */}
        <div className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-ht-yellow text-ht-black flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all">
          <ArrowUpRight className="w-4 h-4" />
        </div>
      </div>

      {/* Body */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="text-[11px] font-bold uppercase tracking-wider text-ht-red dark:text-ht-yellow mb-1.5">
          {course.category}
        </div>
        <h3 className="font-bold text-lg text-slate-900 dark:text-white line-clamp-2 mb-2 group-hover:text-ht-red dark:group-hover:text-ht-yellow transition-colors">
          {course.title}
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-4 flex-1">
          {course.description}
        </p>

        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800 gap-2">
          <span className="flex items-center gap-1.5 min-w-0">
            <User className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{course.teacher?.name || "—"}</span>
          </span>
          <span className="flex items-center gap-2 shrink-0">
            {course.rating?.count > 0 ? (
              <span className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-200">
                <Star className="w-3.5 h-3.5 fill-ht-yellow text-ht-yellow" />
                {course.rating.average.toFixed(1)}
                <span className="text-slate-400 font-normal">({course.rating.count})</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-slate-400">
                <Star className="w-3.5 h-3.5" />
                <span className="text-[11px]">Nouveau</span>
              </span>
            )}
            {typeof progress === "number" && (
              <span className="flex items-center gap-1.5 font-bold text-ht-black dark:text-ht-yellow">
                <BarChart3 className="w-3.5 h-3.5" />
                {progress}%
              </span>
            )}
          </span>
        </div>

        {typeof progress === "number" && (
          <div className="mt-3 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-ht-yellow to-ht-red transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    </Link>
  );
};
