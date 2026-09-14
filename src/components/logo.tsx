import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("size-6 text-fg", className)}
      aria-hidden
    >
      <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
        <path d="M12 4.2 L5.4 19.2 H18.6 Z" />
      </g>
      <circle cx="12" cy="4.4" r="1.6" fill="currentColor" />
      <circle cx="5.4" cy="19.2" r="1.3" fill="currentColor" opacity="0.7" />
      <circle cx="18.6" cy="19.2" r="1.3" fill="currentColor" opacity="0.7" />
    </svg>
  );
}
