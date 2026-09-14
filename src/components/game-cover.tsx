import type { Game, Motif } from "@/lib/games";
import { cn } from "@/lib/utils";

function MotifArt({ motif }: { motif: Motif }) {
  const stroke = "currentColor";
  switch (motif) {
    case "rings":
      return (
        <svg viewBox="0 0 200 260" className="size-full" aria-hidden>
          <circle cx="100" cy="110" r="78" fill="none" stroke={stroke} strokeWidth="1.2" />
          <circle cx="100" cy="110" r="52" fill="none" stroke={stroke} strokeWidth="1.2" />
          <circle cx="100" cy="110" r="26" fill="none" stroke={stroke} strokeWidth="1.2" />
          <circle cx="100" cy="110" r="4" fill={stroke} />
        </svg>
      );
    case "grid":
      return (
        <svg viewBox="0 0 200 260" className="size-full" aria-hidden>
          {Array.from({ length: 6 }, (_, i) => (
            <line
              key={`v${i}`}
              x1={20 + i * 32}
              y1="16"
              x2={20 + i * 32}
              y2="244"
              stroke={stroke}
              strokeWidth="0.8"
            />
          ))}
          {Array.from({ length: 8 }, (_, i) => (
            <line
              key={`h${i}`}
              x1="12"
              y1={20 + i * 30}
              x2="188"
              y2={20 + i * 30}
              stroke={stroke}
              strokeWidth="0.8"
            />
          ))}
        </svg>
      );
    case "slash":
      return (
        <svg viewBox="0 0 200 260" className="size-full" aria-hidden>
          <line x1="24" y1="240" x2="176" y2="20" stroke={stroke} strokeWidth="18" />
          <line x1="8" y1="200" x2="140" y2="20" stroke={stroke} strokeWidth="2" />
          <line x1="60" y1="240" x2="192" y2="52" stroke={stroke} strokeWidth="2" />
        </svg>
      );
    case "orbit":
      return (
        <svg viewBox="0 0 200 260" className="size-full" aria-hidden>
          <ellipse cx="100" cy="120" rx="80" ry="36" fill="none" stroke={stroke} strokeWidth="1.2" />
          <ellipse
            cx="100"
            cy="120"
            rx="80"
            ry="36"
            fill="none"
            stroke={stroke}
            strokeWidth="1.2"
            transform="rotate(60 100 120)"
          />
          <ellipse
            cx="100"
            cy="120"
            rx="80"
            ry="36"
            fill="none"
            stroke={stroke}
            strokeWidth="1.2"
            transform="rotate(120 100 120)"
          />
          <circle cx="100" cy="120" r="10" fill={stroke} />
        </svg>
      );
    case "bars":
      return (
        <svg viewBox="0 0 200 260" className="size-full" aria-hidden>
          {[40, 72, 104, 136, 168].map((x, i) => (
            <rect
              key={x}
              x={x}
              y={30 + (i % 3) * 18}
              width="18"
              height={180 - (i % 3) * 28}
              fill={stroke}
              opacity={0.35 + i * 0.1}
            />
          ))}
        </svg>
      );
    case "plus":
      return (
        <svg viewBox="0 0 200 260" className="size-full" aria-hidden>
          {[-1, 0, 1].flatMap((gx) =>
            [-1, 0, 1].map((gy) => (
              <g key={`${gx}${gy}`} transform={`translate(${100 + gx * 56} ${120 + gy * 56})`}>
                <rect x="-18" y="-4" width="36" height="8" fill={stroke} />
                <rect x="-4" y="-18" width="8" height="36" fill={stroke} />
              </g>
            )),
          )}
        </svg>
      );
    case "arc":
      return (
        <svg viewBox="0 0 200 260" className="size-full" aria-hidden>
          <path d="M20 210 C40 80, 160 80, 180 210" fill="none" stroke={stroke} strokeWidth="2" />
          <path d="M40 210 C55 110, 145 110, 160 210" fill="none" stroke={stroke} strokeWidth="2" />
          <path d="M62 210 C74 140, 126 140, 138 210" fill="none" stroke={stroke} strokeWidth="2" />
          <circle cx="100" cy="78" r="8" fill={stroke} />
        </svg>
      );
    case "steps":
      return (
        <svg viewBox="0 0 200 260" className="size-full" aria-hidden>
          {[0, 1, 2, 3, 4].map((i) => (
            <rect
              key={i}
              x={20 + i * 32}
              y={200 - i * 32}
              width={160 - i * 32}
              height="24"
              fill={stroke}
              opacity={0.25 + i * 0.12}
            />
          ))}
        </svg>
      );
    case "diamond":
      return (
        <svg viewBox="0 0 200 260" className="size-full" aria-hidden>
          <path d="M100 28 L176 120 L100 212 L24 120 Z" fill="none" stroke={stroke} strokeWidth="1.4" />
          <path d="M100 58 L148 120 L100 182 L52 120 Z" fill="none" stroke={stroke} strokeWidth="1.4" />
          <path d="M100 88 L120 120 L100 152 L80 120 Z" fill={stroke} opacity="0.5" />
        </svg>
      );
    case "wave":
      return (
        <svg viewBox="0 0 200 260" className="size-full" aria-hidden>
          {[0, 1, 2, 3, 4].map((i) => (
            <path
              key={i}
              d={`M0 ${70 + i * 32} C50 ${40 + i * 32}, 150 ${100 + i * 32}, 200 ${70 + i * 32}`}
              fill="none"
              stroke={stroke}
              strokeWidth="1.4"
            />
          ))}
        </svg>
      );
    case "cross":
      return (
        <svg viewBox="0 0 200 260" className="size-full" aria-hidden>
          <line x1="20" y1="40" x2="180" y2="220" stroke={stroke} strokeWidth="1.2" />
          <line x1="180" y1="40" x2="20" y2="220" stroke={stroke} strokeWidth="1.2" />
          <circle cx="100" cy="130" r="46" fill="none" stroke={stroke} strokeWidth="1.2" />
          <circle cx="100" cy="130" r="6" fill={stroke} />
        </svg>
      );
    case "stack":
      return (
        <svg viewBox="0 0 200 260" className="size-full" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <rect
              key={i}
              x={28 + i * 10}
              y={48 + i * 28}
              width={144 - i * 20}
              height="88"
              fill="none"
              stroke={stroke}
              strokeWidth="1.4"
            />
          ))}
        </svg>
      );
    case "dice":
      return (
        <svg viewBox="0 0 200 260" className="size-full" aria-hidden>
          <rect x="46" y="70" width="108" height="108" rx="14" fill="none" stroke={stroke} strokeWidth="1.6" />
          <circle cx="76" cy="100" r="7" fill={stroke} />
          <circle cx="124" cy="100" r="7" fill={stroke} />
          <circle cx="100" cy="124" r="7" fill={stroke} />
          <circle cx="76" cy="148" r="7" fill={stroke} />
          <circle cx="124" cy="148" r="7" fill={stroke} />
        </svg>
      );
  }
}

export function GameCover({
  game,
  className,
  title,
}: {
  game: Game;
  className?: string;
  title?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-raised text-fg/40",
        className,
      )}
    >
      {game.coverUrl ? (
        <img
          src={game.coverUrl}
          alt=""
          referrerPolicy="no-referrer"
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <div className="absolute inset-0">
          <MotifArt motif={game.motif} />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-bg/80 via-transparent to-transparent" />
      {title ? (
        <div className="absolute inset-x-0 bottom-0 p-4">
          <p className="font-display text-lg leading-tight text-fg">{game.title}</p>
          <p className="mt-1 text-xs tabular-nums text-muted">{game.year}</p>
        </div>
      ) : null}
    </div>
  );
}
