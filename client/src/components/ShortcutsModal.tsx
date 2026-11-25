import { X, Keyboard } from "lucide-react";
import { SHORTCUTS } from "@/lib/useKeyboardShortcuts";

interface Props {
  open: boolean;
  onClose: () => void;
}

export const ShortcutsModal = ({ open, onClose }: Props) => {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
    >
      <div
        className="absolute inset-0 bg-ht-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md card p-6 shadow-ink">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-ht-yellow flex items-center justify-center text-ht-black">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="shortcuts-title"
                className="font-bold text-lg text-slate-900 dark:text-white"
              >
                Raccourcis clavier
              </h2>
              <p className="text-xs text-slate-500">
                Naviguez sans toucher la souris
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {SHORTCUTS.map((s) => (
            <li key={s.label} className="flex items-center justify-between py-2.5">
              <span className="text-sm text-slate-700 dark:text-slate-300">
                {s.label}
              </span>
              <span className="flex items-center gap-1">
                {s.keys.map((k, i) => (
                  <kbd
                    key={i}
                    className="px-2 py-0.5 min-w-[1.75rem] text-center rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-semibold text-slate-700 dark:text-slate-200 shadow-sm"
                  >
                    {k}
                  </kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>

        <p className="mt-4 text-[11px] text-slate-500 text-center">
          Astuce : appuyez sur <kbd className="px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-[10px]">?</kbd> à tout moment.
        </p>
      </div>
    </div>
  );
};
