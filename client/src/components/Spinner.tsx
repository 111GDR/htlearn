import { Loader2 } from "lucide-react";

export const Spinner = ({ size = 24 }: { size?: number }) => (
  <div className="flex items-center justify-center py-12">
    <Loader2 className="animate-spin text-ht-red dark:text-ht-yellow" size={size} />
  </div>
);

export const EmptyState = ({ title, message, icon }: { title: string; message?: string; icon?: React.ReactNode }) => (
  <div className="text-center py-16">
    {icon && (
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 rounded-2xl bg-ht-yellow/20 text-ht-black dark:bg-ht-yellow/10 dark:text-ht-yellow flex items-center justify-center">
          {icon}
        </div>
      </div>
    )}
    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
    {message && <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto">{message}</p>}
  </div>
);
