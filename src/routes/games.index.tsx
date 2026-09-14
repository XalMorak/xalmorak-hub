import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { GameCard } from "@/components/game-card";
import { Input } from "@/components/ui/input";
import { searchCatalog, steamHitToGame } from "@/lib/catalog";
import { listReviewStats } from "@/lib/community";
import { GAMES, GENRES, PLATFORMS, STEAM_IDS, type GenreId, type PlatformId } from "@/lib/games";
import { useI18n } from "@/lib/locale";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/games/")({
  loader: () => listReviewStats(),
  component: GamesPage,
});

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-11 items-center rounded-full px-4 text-sm transition-colors duration-150",
        active ? "bg-accent text-accent-fg" : "bg-raised text-muted hover:text-fg",
      )}
    >
      {children}
    </button>
  );
}

function GamesPage() {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [steamQ, setSteamQ] = useState("");
  const [genre, setGenre] = useState<GenreId | "all">("all");
  const [platform, setPlatform] = useState<PlatformId | "all">("all");

  const initialStats = Route.useLoaderData();
  const stats = useQuery({
    queryKey: ["review-stats"],
    queryFn: () => listReviewStats(),
    initialData: initialStats,
  });
  const avgBySlug = new Map(
    (stats.data ?? []).map((s) => [s.game_slug, s.avg * 10]),
  );

  useEffect(() => {
    const handle = window.setTimeout(() => setSteamQ(query.trim()), 400);
    return () => window.clearTimeout(handle);
  }, [query]);

  const steam = useQuery({
    queryKey: ["steam-search", steamQ],
    queryFn: () => searchCatalog({ data: { q: steamQ } }),
    enabled: steamQ.length >= 2,
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return GAMES.filter((game) => {
      if (genre !== "all" && !game.genres.includes(genre)) return false;
      if (platform !== "all" && !game.platforms.includes(platform)) return false;
      if (!q) return true;
      return (
        game.title.toLowerCase().includes(q) ||
        game.developer.toLowerCase().includes(q) ||
        game.summary.toLowerCase().includes(q)
      );
    });
  }, [genre, platform, query]);

  const localSteam = new Set(Object.values(STEAM_IDS));
  const extraSteam = (steam.data ?? []).filter(
    (hit) => !localSteam.has(hit.steamId) && !filtered.some((g) => g.steamId === hit.steamId),
  );

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6">
      <header className="space-y-3">
        <p className="text-xs font-medium tracking-[0.18em] text-muted uppercase">
          {t("catalog")}
        </p>
        <h1 className="font-display text-4xl tracking-tight text-fg">{t("gamesTitle")}</h1>
        <p className="max-w-2xl text-sm leading-normal text-muted">{t("gamesBlurb")}</p>
      </header>

      <div className="space-y-4">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchGames")}
          aria-label={t("searchGames")}
        />
        <div className="flex flex-wrap gap-2">
          <Chip active={genre === "all"} onClick={() => setGenre("all")}>
            {t("allGenres")}
          </Chip>
          {GENRES.map((g) => (
            <Chip
              key={g.id}
              active={genre === g.id}
              onClick={() => setGenre(g.id)}
            >
              {g.label}
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Chip active={platform === "all"} onClick={() => setPlatform("all")}>
            {t("allPlatforms")}
          </Chip>
          {PLATFORMS.map((p) => (
            <Chip
              key={p.id}
              active={platform === p.id}
              onClick={() => setPlatform(p.id)}
            >
              {p.label}
            </Chip>
          ))}
        </div>
      </div>

      {filtered.length === 0 && extraSteam.length === 0 ? (
        <p className="py-12 text-sm text-muted">{t("noGames")}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((game) => (
            <GameCard
              key={game.slug}
              game={game}
              communityScore={avgBySlug.get(game.slug)}
            />
          ))}
        </div>
      )}

      {extraSteam.length > 0 ? (
        <section className="space-y-4">
          <h2 className="font-display text-2xl text-fg">{t("steamResults")}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {extraSteam.map((hit) => (
              <GameCard
                key={hit.slug}
                game={steamHitToGame(hit)}
                communityScore={avgBySlug.get(hit.slug)}
              />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
