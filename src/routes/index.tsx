import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { GameCard } from "@/components/game-card";
import { GameCover } from "@/components/game-cover";
import { TimeAgo } from "@/components/time-ago";
import { Button } from "@/components/ui/button";
import { listFeaturedSteam, steamHitToGame } from "@/lib/catalog";
import { CHANNELS } from "@/lib/channels";
import { listRecentMessages, listReviewStats } from "@/lib/community";
import { GAMES, getGame } from "@/lib/games";
import { useI18n } from "@/lib/locale";

export const Route = createFileRoute("/")({
  loader: async () => {
    const [stats, recent, steam] = await Promise.all([
      listReviewStats(),
      listRecentMessages(),
      listFeaturedSteam(),
    ]);
    return { stats, recent, steam };
  },
  component: Home,
});

function Home() {
  const { t, locale } = useI18n();
  const { stats, recent, steam } = Route.useLoaderData();
  const featuredRaw = GAMES.find((g) => g.featured) ?? GAMES[0];
  const featured = featuredRaw ? (getGame(featuredRaw.slug) ?? featuredRaw) : undefined;
  const spotlight = GAMES.filter((g) => g.featured).slice(0, 4);
  const rest = GAMES.filter((g) => !g.featured).slice(0, 8);

  const liveStats = useQuery({
    queryKey: ["review-stats"],
    queryFn: () => listReviewStats(),
    initialData: stats,
  });
  const liveRecent = useQuery({
    queryKey: ["recent-messages"],
    queryFn: () => listRecentMessages(),
    initialData: recent,
  });
  const liveSteam = useQuery({
    queryKey: ["steam-featured"],
    queryFn: () => listFeaturedSteam(),
    initialData: steam,
  });

  const avgBySlug = new Map(
    (liveStats.data ?? []).map((s) => [s.game_slug, s.avg * 10]),
  );

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-16 px-4 py-10 sm:px-6 sm:py-14">
      {featured ? (
        <section className="grid items-stretch gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col justify-center gap-6">
            <p className="text-xs font-medium tracking-[0.18em] text-muted uppercase">
              {t("featured")}
            </p>
            <h1 className="font-display text-4xl leading-tight tracking-tight text-fg sm:text-5xl">
              {t("heroTitle")}
              <span className="mt-2 block text-muted">{t("heroSub")}</span>
            </h1>
            <p className="max-w-xl text-base leading-normal text-muted">
              {t("heroBody")}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/games">
                  {t("seeGames")}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/lounge">{t("enterLounge")}</Link>
              </Button>
            </div>
          </div>
          <Link
            to="/games/$slug"
            params={{ slug: featured.slug }}
            className="group relative overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <GameCover game={featured} className="min-h-72 sm:min-h-80" />
            <div className="absolute inset-x-0 bottom-0 space-y-2 p-6">
              <p className="text-xs tracking-[0.16em] text-muted uppercase">
                {featured.developer} · {featured.year}
              </p>
              <h2 className="font-display text-3xl text-fg">{featured.title}</h2>
              <p className="max-w-md text-sm text-muted">{featured.summary}</p>
            </div>
          </Link>
        </section>
      ) : null}

      <section className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-2xl text-fg">{t("collection")}</h2>
          <Link to="/games" className="text-sm text-muted hover:text-fg">
            {t("seeAll")}
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {spotlight.map((game) => (
            <GameCard
              key={game.slug}
              game={game}
              communityScore={avgBySlug.get(game.slug)}
            />
          ))}
        </div>
      </section>

      {(liveSteam.data ?? []).length > 0 ? (
        <section className="space-y-6">
          <h2 className="font-display text-2xl text-fg">{t("steamFeatured")}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(liveSteam.data ?? []).slice(0, 8).map((hit) => (
              <GameCard key={hit.slug} game={steamHitToGame(hit)} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <h2 className="font-display text-2xl text-fg">{t("moreGames")}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {rest.map((game) => (
              <GameCard
                key={game.slug}
                game={game}
                communityScore={avgBySlug.get(game.slug)}
              />
            ))}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="flex items-end justify-between">
            <h2 className="font-display text-2xl text-fg">{t("loungeVoices")}</h2>
            <Link to="/lounge" className="text-sm text-muted hover:text-fg">
              {t("open")}
            </Link>
          </div>
          <div className="overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]">
            {(liveRecent.data ?? []).length === 0 ? (
              <p className="p-5 text-sm text-muted">{t("emptyLounge")}</p>
            ) : (
              <ul className="divide-y divide-border">
                {(liveRecent.data ?? []).map((msg) => {
                  const channel = CHANNELS.find((c) => c.id === msg.channel);
                  return (
                    <li key={msg.id} className="px-5 py-4">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="text-sm font-medium text-fg">{msg.author_name}</p>
                        <TimeAgo value={msg.created_at} />
                      </div>
                      <p className="mt-1 text-xs text-subtle">
                        {channel?.label[locale]}
                      </p>
                      <p className="mt-2 text-sm leading-normal text-muted">{msg.body}</p>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>
      </section>
    </main>
  );
}
