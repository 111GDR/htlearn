import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/store/theme";
import { useAuth } from "@/store/auth";

const isTyping = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
};

const smoothTo = (top: number) => window.scrollTo({ top, behavior: "smooth" });

/**
 * Global vim-style shortcuts.
 *  - g g  → top      ·  Shift+G → bottom
 *  - j    → page down·  k       → page up
 *  - /    → focus search (id="navbar-search")
 *  - h    → /        ·  c → /courses · d → /dashboard · t → toggle theme
 *  - ?    → toggle help · Esc → cancel pending g / close help
 *
 * `onToggleHelp` lets a parent show/hide the cheatsheet modal.
 */
export const useKeyboardShortcuts = (onToggleHelp: () => void, onCloseHelp: () => void) => {
  const navigate = useNavigate();
  const { toggle } = useTheme();
  const user = useAuth((s) => s.user);
  const pendingG = useRef<number | null>(null);

  useEffect(() => {
    const clearPending = () => {
      if (pendingG.current !== null) {
        window.clearTimeout(pendingG.current);
        pendingG.current = null;
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (isTyping(e.target)) {
        // Allow Esc to blur inputs even while typing.
        if (e.key === "Escape" && e.target instanceof HTMLElement) e.target.blur();
        return;
      }

      // Shift combos
      if (e.shiftKey) {
        if (e.key === "G") {
          e.preventDefault();
          smoothTo(document.documentElement.scrollHeight);
          clearPending();
          return;
        }
        if (e.key === "?") {
          e.preventDefault();
          onToggleHelp();
          clearPending();
          return;
        }
        return;
      }

      switch (e.key) {
        case "Escape":
          clearPending();
          onCloseHelp();
          return;

        case "g": {
          e.preventDefault();
          if (pendingG.current !== null) {
            // Second "g" — scroll to top
            clearPending();
            smoothTo(0);
          } else {
            pendingG.current = window.setTimeout(clearPending, 700);
          }
          return;
        }

        case "j":
        case "ArrowDown":
          e.preventDefault();
          smoothTo(window.scrollY + window.innerHeight * 0.85);
          clearPending();
          return;

        case "k":
        case "ArrowUp":
          e.preventDefault();
          smoothTo(window.scrollY - window.innerHeight * 0.85);
          clearPending();
          return;

        case "PageDown":
        case " ":
          e.preventDefault();
          smoothTo(window.scrollY + window.innerHeight * 0.9);
          clearPending();
          return;

        case "PageUp":
          e.preventDefault();
          smoothTo(window.scrollY - window.innerHeight * 0.9);
          clearPending();
          return;

        case "Home":
          e.preventDefault();
          smoothTo(0);
          clearPending();
          return;

        case "End":
          e.preventDefault();
          smoothTo(document.documentElement.scrollHeight);
          clearPending();
          return;

        case "/": {
          e.preventDefault();
          const search = document.getElementById("navbar-search") as HTMLInputElement | null;
          if (search) {
            search.focus();
            search.select();
          } else {
            navigate("/courses");
          }
          clearPending();
          return;
        }

        case "h":
          clearPending();
          navigate("/");
          return;

        case "c":
          clearPending();
          navigate("/courses");
          return;

        case "d":
          if (user) {
            clearPending();
            navigate("/dashboard");
          }
          return;

        case "t":
          clearPending();
          toggle();
          return;
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      clearPending();
    };
  }, [navigate, toggle, user, onToggleHelp, onCloseHelp]);
};

export const SHORTCUTS: { keys: string[]; label: string }[] = [
  { keys: ["↑"], label: "Remonter" },
  { keys: ["↓"], label: "Descendre" },
  { keys: ["Espace"], label: "Page suivante" },
  { keys: ["g", "g"], label: "Aller en haut" },
  { keys: ["⇧", "G"], label: "Aller en bas" },
  { keys: ["j", "k"], label: "Pages haut / bas (vim)" },
  { keys: ["/"], label: "Recherche" },
  { keys: ["h"], label: "Accueil" },
  { keys: ["c"], label: "Cours" },
  { keys: ["d"], label: "Tableau de bord" },
  { keys: ["t"], label: "Changer de thème" },
  { keys: ["?"], label: "Afficher cette aide" },
  { keys: ["Esc"], label: "Fermer / annuler" },
];
