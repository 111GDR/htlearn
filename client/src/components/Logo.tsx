import { cn } from "@/lib/utils";

interface LogoProps {
  size?: number;
  className?: string;
  withWordmark?: boolean;
}

/** HtLearn brand mark — yellow tile, black rooftop chevron, bold "Ht" wordmark.
 *  Inspired by the École High-Tech logo. */
export const Logo = ({ size = 36, className, withWordmark = false }: LogoProps) => (
  <span className={cn("inline-flex items-center gap-2", className)}>
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
      className="shrink-0 rounded-xl shadow-ht"
    >
      <rect width="64" height="64" rx="12" fill="#F1D302" />
      {/* roof / chevron */}
      <path d="M10 30 L32 12 L54 30 L54 32 L10 32 Z" fill="#161925" />
      <path d="M22 32 L32 24 L42 32 Z" fill="#F1D302" />
      {/* Ht wordmark */}
      <text
        x="32"
        y="52"
        textAnchor="middle"
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight="900"
        fontSize="20"
        fill="#161925"
      >
        Ht
      </text>
    </svg>
    {withWordmark && (
      <span className="flex items-baseline gap-0.5 leading-none">
        <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">
          Ht
        </span>
        <span className="font-extrabold text-lg tracking-tight text-ht-red">
          Learn
        </span>
      </span>
    )}
  </span>
);
