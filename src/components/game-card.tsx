import { Link } from "@tanstack/react-router";
import { GameCover } from "@/components/game-cover";
import { Badge } from "@/components/ui/badge";
import { getGame, genreLabel, type Game } from "@/lib/games";
import { cn } from "@/lib/utils";

export function GameCard({
  game,
  communityScore,
  className,
}: {
  game: Game;
  communityScore?: number;
  className?: string;
}) {
  const resolved = getGame(game.slug) ?? game;
  const score = communityScore ?? resolved.score;
  return (
    <Link
      to="/games/$slug"
      params={{ slug: resolved.slug }}
      className={cn(
        "group flex flex-col overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]",
        "transition-[transform,box-shadow] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)]",
        "hover:-translate-y-0.5 hover:shadow-[var(--shadow-border-hover)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <GameCover game={resolved} className="aspect-[3/4]" />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-lg leading-snug text-fg">{resolved.title}</h3>
          <span className="tabular-nums text-sm text-accent">
            {score ? Math.round(score) : "—"}
          </span>
        </div>
        {resolved.summary ? (
          <p className="line-clamp-2 text-sm leading-normal text-muted">{resolved.summary}</p>
        ) : null}
        <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
          {resolved.genres.slice(0, 2).map((g) => (
            <Badge key={g}>{genreLabel(g)}</Badge>
          ))}
        </div>
      </div>
    </Link>
  );
}
