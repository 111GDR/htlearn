import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, RotateCcw, Shuffle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Flashcard {
  front: string;
  back: string;
}

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export const Flashcards = ({ cards }: { cards: Flashcard[] }) => {
  const [order, setOrder] = useState<number[]>(() => cards.map((_, i) => i));
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const ordered = useMemo(() => order.map((i) => cards[i]).filter(Boolean), [order, cards]);
  const card = ordered[idx];

  if (!cards.length) return null;

  const next = () => {
    setFlipped(false);
    setIdx((i) => (i + 1) % ordered.length);
  };
  const prev = () => {
    setFlipped(false);
    setIdx((i) => (i - 1 + ordered.length) % ordered.length);
  };
  const reshuffle = () => {
    setOrder(shuffle(cards.map((_, i) => i)));
    setIdx(0);
    setFlipped(false);
  };
  const reset = () => {
    setOrder(cards.map((_, i) => i));
    setIdx(0);
    setFlipped(false);
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-5 bg-gradient-to-br from-ht-yellow/20 via-white to-white dark:from-ht-yellow/10 dark:via-slate-900 dark:to-slate-900">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
          <Sparkles className="w-4 h-4 text-ht-red dark:text-ht-yellow" />
          Flashcards d'étude
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={reshuffle}
            className="btn-ghost text-xs"
            title="Mélanger"
          >
            <Shuffle className="w-3.5 h-3.5" />
          </button>
          <button onClick={reset} className="btn-ghost text-xs" title="Réinitialiser">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <button
        onClick={() => setFlipped((f) => !f)}
        className={cn(
          "w-full min-h-[180px] rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 flex flex-col items-center justify-center text-center transition-all hover:border-ht-yellow hover:shadow-md cursor-pointer",
          flipped && "border-ht-yellow"
        )}
        aria-label="Retourner la carte"
      >
        <div className="text-xs uppercase tracking-wide text-slate-400 mb-2">
          {flipped ? "Réponse" : "Question"} • Clique pour {flipped ? "voir la question" : "voir la réponse"}
        </div>
        <div className={cn("text-base", flipped ? "text-slate-700 dark:text-slate-300" : "font-semibold text-slate-900 dark:text-white")}>
          {flipped ? card.back : card.front}
        </div>
      </button>

      <div className="flex items-center justify-between mt-4">
        <button
          onClick={prev}
          disabled={ordered.length <= 1}
          className="btn-secondary text-xs"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Précédente
        </button>
        <span className="text-xs text-slate-500">
          {idx + 1} / {ordered.length}
        </span>
        <button
          onClick={next}
          disabled={ordered.length <= 1}
          className="btn-secondary text-xs"
        >
          Suivante <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
