import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export const ScrollTopButton = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Remonter en haut"
      title="Remonter (g g)"
      className={cn(
        // Sits above the AI Assistant pill (which lives at bottom-6 right-6)
        "fixed z-40 bottom-20 right-5 sm:bottom-24 sm:right-6",
        "w-12 h-12 rounded-full bg-ht-yellow text-ht-black",
        "shadow-ht border border-ht-black/10",
        "flex items-center justify-center",
        "transition-all duration-300 hover:brightness-95 hover:scale-105 active:scale-95",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ht-yellow focus-visible:ring-offset-2",
        visible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-3 pointer-events-none"
      )}
    >
      <ArrowUp className="w-5 h-5" strokeWidth={2.5} />
    </button>
  );
};
