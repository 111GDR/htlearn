import { isYouTubeUrl, youTubeEmbedUrl } from "./MediaPicker";

export const MediaViewer = ({
  kind,
  url,
}: {
  kind: "pdf" | "video" | "audio";
  url: string;
}) => {
  if (!url) return null;

  if (kind === "pdf") {
    return (
      <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
        <iframe src={url} className="w-full h-[70vh] bg-slate-50 dark:bg-slate-900" title="PDF" />
        <div className="p-2 text-center text-xs text-slate-500 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700">
          <a href={url} target="_blank" rel="noreferrer" className="text-ht-red dark:text-ht-yellow hover:underline">
            Ouvrir le PDF dans un nouvel onglet
          </a>
        </div>
      </div>
    );
  }

  if (kind === "video") {
    if (isYouTubeUrl(url)) {
      return (
        <div className="rounded-xl overflow-hidden aspect-video border border-slate-200 dark:border-slate-700">
          <iframe
            src={youTubeEmbedUrl(url)}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Vidéo"
          />
        </div>
      );
    }
    return (
      <video src={url} controls className="w-full max-h-[70vh] rounded-xl bg-black" />
    );
  }

  return (
    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
      <audio src={url} controls className="w-full" />
    </div>
  );
};
