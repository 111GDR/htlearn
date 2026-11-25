import { useRef, useState } from "react";
import { UploadCloud, Loader2, X, FileText, Video, Music, Link as LinkIcon } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export type MediaKind = "pdf" | "video" | "audio";
export type MediaSource = "upload" | "url";

const ENDPOINTS: Record<MediaKind, string> = {
  pdf: "/uploads/pdf",
  video: "/uploads/video",
  audio: "/uploads/audio",
};

const ACCEPT: Record<MediaKind, string> = {
  pdf: "application/pdf",
  video: "video/*",
  audio: "audio/*",
};

const ICONS: Record<MediaKind, React.ReactNode> = {
  pdf: <FileText className="w-8 h-8 text-slate-400" />,
  video: <Video className="w-8 h-8 text-slate-400" />,
  audio: <Music className="w-8 h-8 text-slate-400" />,
};

export const MediaPicker = ({
  kind,
  url,
  source,
  allowUrl = true,
  onChange,
  compact = false,
}: {
  kind: MediaKind;
  url: string;
  source?: MediaSource;
  allowUrl?: boolean;
  compact?: boolean;
  onChange: (next: { url: string; source?: MediaSource; transcript?: string }) => void;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [mode, setMode] = useState<MediaSource>(source || "upload");

  const upload = async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    setUploading(true);
    try {
      const { data } = await api.post(ENDPOINTS[kind], fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onChange({ url: data.url, source: "upload", transcript: data.transcript });
      if (data.transcriptError) {
        toast(data.transcriptError, { icon: "⚠️" });
      } else if (data.transcript) {
        toast.success("Fichier transcrit automatiquement");
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Échec de l'upload");
    } finally {
      setUploading(false);
    }
  };

  const renderPreview = () => {
    if (!url) return null;
    if (kind === "pdf") {
      return (
        <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <FileText className="w-5 h-5 text-red-500 shrink-0" />
          <a href={url} target="_blank" rel="noreferrer" className="text-sm truncate text-ht-red dark:text-ht-yellow hover:underline flex-1">
            {url.split("/").pop()}
          </a>
          <button onClick={() => onChange({ url: "" })} className="text-slate-400 hover:text-red-500" type="button">
            <X className="w-4 h-4" />
          </button>
        </div>
      );
    }
    if (kind === "video") {
      return (
        <div className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
          <video src={url} controls className="w-full max-h-64 bg-black" />
          <button
            type="button"
            onClick={() => onChange({ url: "" })}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
        <Music className="w-5 h-5 text-ht-red dark:text-ht-yellow shrink-0" />
        <audio src={url} controls className="flex-1 h-8" />
        <button onClick={() => onChange({ url: "" })} className="text-slate-400 hover:text-red-500" type="button">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  };

  if (url) return <div>{renderPreview()}</div>;

  return (
    <div className="space-y-2">
      {allowUrl && (kind === "video" || kind === "audio") && (
        <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setMode("upload")}
            className={cn(
              "px-3 py-1 rounded-md transition-colors",
              mode === "upload" ? "bg-ht-black text-white dark:bg-white dark:text-ht-black" : "text-slate-600 dark:text-slate-300"
            )}
          >
            <UploadCloud className="w-3.5 h-3.5 inline mr-1" /> Téléverser
          </button>
          <button
            type="button"
            onClick={() => setMode("url")}
            className={cn(
              "px-3 py-1 rounded-md transition-colors",
              mode === "url" ? "bg-ht-black text-white dark:bg-white dark:text-ht-black" : "text-slate-600 dark:text-slate-300"
            )}
          >
            <LinkIcon className="w-3.5 h-3.5 inline mr-1" /> URL externe
          </button>
        </div>
      )}

      {mode === "url" && (kind === "video" || kind === "audio") ? (
        <input
          className="input"
          placeholder={kind === "video" ? "https://youtube.com/watch?v=… ou MP4 direct" : "https://… (MP3, etc.)"}
          onBlur={(e) => {
            const v = e.target.value.trim();
            if (v) onChange({ url: v, source: "url" });
          }}
        />
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
            "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed cursor-pointer transition-colors text-center",
            compact ? "p-4" : "p-6",
            dragOver
              ? "border-ht-yellow bg-ht-yellow/10 dark:bg-ht-yellow/5"
              : "border-slate-300 dark:border-slate-700 hover:border-ht-yellow hover:bg-slate-50 dark:hover:bg-slate-800/50",
            uploading && "opacity-60 pointer-events-none"
          )}
        >
          {uploading ? <Loader2 className="w-7 h-7 text-ht-red dark:text-ht-yellow animate-spin" /> : ICONS[kind]}
          <div className="text-sm text-slate-700 dark:text-slate-300">
            {uploading ? (
              kind === "video" || kind === "audio"
                ? "Téléversement et transcription automatique…"
                : "Téléversement…"
            ) : (
              <>
                <span className="font-semibold text-ht-red dark:text-ht-yellow">Cliquez</span> ou glissez-déposez un fichier {kind.toUpperCase()}
              </>
            )}
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT[kind]}
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

export const isYouTubeUrl = (url: string) =>
  /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]+)/.test(url);

export const youTubeEmbedUrl = (url: string) => {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]+)/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : url;
};
