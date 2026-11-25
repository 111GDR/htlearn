import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Sparkles, X, Send, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const STARTERS = [
  "Explique-moi cette leçon en termes simples",
  "Donne-moi un exemple concret",
  "Quels sont les concepts clés à retenir ?",
];

export const LessonTutor = ({ lessonId }: { lessonId: string }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const send = useMutation({
    mutationFn: async (history: ChatMessage[]) => {
      const { data } = await api.post("/tutor/chat", { lessonId, messages: history });
      return data.reply as string;
    },
    onSuccess: (reply) => {
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.message || "Erreur du tuteur");
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, send.isPending]);

  useEffect(() => {
    setMessages([]);
    setInput("");
  }, [lessonId]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || send.isPending) return;
    const next = [...messages, { role: "user" as const, content: trimmed }];
    setMessages(next);
    setInput("");
    send.mutate(next);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-ht-black text-ht-yellow ring-1 ring-ht-yellow/40 hover:bg-slate-900 dark:bg-ht-yellow dark:text-ht-black dark:ring-ht-black/20 dark:hover:brightness-95 shadow-ht transition-all hover:scale-105 cursor-pointer"
        aria-label="Ouvrir l'assistant IA"
      >
        <Sparkles className="w-5 h-5" />
        <span className="font-medium text-sm hidden sm:inline">Assistant IA</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 w-[min(420px,calc(100vw-3rem))] h-[min(600px,calc(100vh-8rem))] flex flex-col card animate-slide-up overflow-hidden">
      <div className="relative flex items-center justify-between gap-2 p-4 border-b border-slate-200 dark:border-slate-700 bg-ht-black text-white overflow-hidden">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          <div>
            <div className="font-semibold text-sm">Assistant IA</div>
            <div className="text-xs text-white/80">Pose-moi des questions sur la leçon</div>
          </div>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="p-1 rounded hover:bg-white/20"
          aria-label="Fermer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div>
            <div className="text-sm text-slate-600 dark:text-slate-400 mb-3">
              Bonjour ! Quelques idées pour commencer :
            </div>
            <div className="space-y-1.5">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="block w-full text-left text-sm p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-slate-700 dark:text-slate-300"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                m.role === "user"
                  ? "bg-ht-black text-white dark:bg-white dark:text-ht-black rounded-br-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-sm"
              )}
            >
              {m.role === "assistant" ? (
                <div className="markdown-body [&_p]:my-1 [&_p]:leading-relaxed [&_h1]:text-base [&_h1]:mt-2 [&_h2]:text-sm [&_h2]:mt-2 [&_pre]:my-2 [&_pre]:text-xs">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              ) : (
                <span className="whitespace-pre-wrap">{m.content}</span>
              )}
            </div>
          </div>
        ))}
        {send.isPending && (
          <div className="flex justify-start">
            <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-bl-sm px-3 py-2 text-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-ht-red dark:text-ht-yellow" />
              <span className="text-slate-500">Réflexion…</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-end gap-2">
          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Pose ta question…"
            className="input flex-1 resize-none max-h-32"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || send.isPending}
            className="btn-primary p-2.5 shrink-0"
            aria-label="Envoyer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mt-2"
          >
            Nouveau dialogue
          </button>
        )}
      </div>
    </div>
  );
};
