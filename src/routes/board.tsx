import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { getBoard } from "@/lib/board";
import { getGame } from "@/lib/games";
import { useI18n } from "@/lib/locale";

export const Route = createFileRoute("/board")({
  loader: () =>
    getBoard().catch(() => ({
      weekGames: [],
      reviewers: [],
      voices: [],
      generated_at: new Date().toISOString(),
    })),
  component: BoardPage,
});

function BoardPage() {
  const { t } = useI18n();
  const initial = Route.useLoaderData();
  const board = useQuery({ queryKey: ["board"], queryFn: () => getBoard(), initialData: initial });
  const data = board.data;

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 space-y-8 px-4 py-8 sm:px-6">
      <header className="space-y-2">
        <p className="text-xs font-medium tracking-[0.18em] text-muted uppercase">
          {t("navBoard")}
        </p>
        <h1 className="font-display text-4xl tracking-tight text-fg">{t("boardTitle")}</h1>
        <p className="max-w-2xl text-sm leading-normal text-muted">{t("boardBlurb")}</p>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        <section className="space-y-3">
          <h2 className="font-display text-xl text-fg">{t("boardGames")}</h2>
          <ol className="divide-y divide-border overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]">
            {(data?.weekGames ?? []).map((g, i) => (
              <li key={g.game_slug} className="flex items-baseline justify-between gap-3 px-5 py-4">
                <Link
                  to="/games/$slug"
                  params={{ slug: g.game_slug }}
                  className="text-sm text-fg hover:underline"
                >
                  <span className="mr-2 tabular-nums text-subtle">{i + 1}</span>
                  {getGame(g.game_slug)?.title ?? g.game_slug}
                </Link>
                <span className="tabular-nums text-xs text-muted">
                  {g.count} · {g.avg.toFixed(1)}
                </span>
              </li>
            ))}
          </ol>
        </section>
        <section className="space-y-3">
          <h2 className="font-display text-xl text-fg">{t("boardReviewers")}</h2>
          <ol className="divide-y divide-border overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]">
            {(data?.reviewers ?? []).map((p, i) => (
              <li key={p.user_id} className="flex items-baseline justify-between gap-3 px-5 py-4">
                <Link
                  to="/u/$id"
                  params={{ id: p.user_id }}
                  className="text-sm text-fg hover:underline"
                >
                  <span className="mr-2 tabular-nums text-subtle">{i + 1}</span>
                  {p.name}
                </Link>
                <span className="tabular-nums text-xs text-muted">
                  {p.reviews} · {p.avg.toFixed(1)}
                </span>
              </li>
            ))}
          </ol>
        </section>
        <section className="space-y-3">
          <h2 className="font-display text-xl text-fg">{t("boardVoices")}</h2>
          <ol className="divide-y divide-border overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]">
            {(data?.voices ?? []).map((p, i) => (
              <li key={p.user_id} className="flex items-baseline justify-between gap-3 px-5 py-4">
                <Link
                  to="/u/$id"
                  params={{ id: p.user_id }}
                  className="text-sm text-fg hover:underline"
                >
                  <span className="mr-2 tabular-nums text-subtle">{i + 1}</span>
                  {p.name}
                </Link>
                <span className="tabular-nums text-xs text-muted">{p.posts}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </main>
  );
}
