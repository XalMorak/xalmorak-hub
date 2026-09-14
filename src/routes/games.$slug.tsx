import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { GameCover } from "@/components/game-cover";
import { TimeAgo } from "@/components/time-ago";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SignInGate } from "@/lib/auth/gates";
import { getDeals, getSteamGame, parseSteamSlug, steamDetailToGame } from "@/lib/catalog";
import { listReviews, postReview } from "@/lib/community";
import { genreLabel, getGame, platformLabel, type Game } from "@/lib/games";
import { useI18n } from "@/lib/locale";
import { SafeMedia, fileToDataUrl, IMAGE_MAX, VIDEO_MAX } from "@/components/safe-media";
import { listClips, postClip } from "@/lib/gallery";
import { listWishlist, toggleWishlist } from "@/lib/wishlist";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/games/$slug")({
  loader: async ({ params }) => {
    const steamId = parseSteamSlug(params.slug);
    const local = getGame(params.slug);
    const reviews = await listReviews({ data: { slug: params.slug } });
    let steam = null;
    let deals: Awaited<ReturnType<typeof getDeals>> = [];
    try {
      if (!local && steamId) {
        steam = await getSteamGame({ data: { steamId } });
      }
    } catch {
      steam = null;
    }
    try {
      if (steamId) deals = await getDeals({ data: { steamId } });
    } catch {
      deals = [];
    }
    return { reviews, steam, deals };
  },
  component: GameDetail,
});

function GameDetail() {
  const { t } = useI18n();
  const { slug } = Route.useParams();
  const { reviews: initialReviews, steam: initialSteam, deals: initialDeals } =
    Route.useLoaderData();
  const local = getGame(slug);
  const steamId = parseSteamSlug(slug);
  const queryClient = useQueryClient();

  const steam = useQuery({
    queryKey: ["steam-game", steamId],
    queryFn: () => getSteamGame({ data: { steamId: steamId! } }),
    initialData: initialSteam ?? undefined,
    enabled: !local && !!steamId,
  });

  const game: Game | undefined = local
    ?? (steam.data ? steamDetailToGame(steam.data) : undefined);

  const reviews = useQuery({
    queryKey: ["reviews", slug],
    queryFn: () => listReviews({ data: { slug } }),
    initialData: initialReviews,
  });

  const deals = useQuery({
    queryKey: ["deals", steamId],
    queryFn: () => getDeals({ data: { steamId: steamId! } }),
    initialData: initialDeals,
    enabled: !!steamId,
  });

  const wish = useQuery({
    queryKey: ["wishlist"],
    queryFn: async () => {
      try {
        return await listWishlist();
      } catch {
        return [] as string[];
      }
    },
  });

  const [clipUrl, setClipUrl] = useState("");
  const [showClipUrl, setShowClipUrl] = useState(false);
  const [rating, setRating] = useState(8);
  const [body, setBody] = useState("");

  const mutation = useMutation({
    mutationFn: () => postReview({ data: { slug, rating, body } }),
    onSuccess: () => {
      setBody("");
      toast.success(t("reviewSaved"));
      void queryClient.invalidateQueries({ queryKey: ["reviews", slug] });
      void queryClient.invalidateQueries({ queryKey: ["review-stats"] });
    },
    onError: (err: Error) => {
      if (err.message === "Unauthorized") {
        toast.error(t("needReviewSignIn"));
        return;
      }
      toast.error(err.message || "Амжилтгүй боллоо");
    },
  });

  const clips = useQuery({
    queryKey: ["clips", slug],
    queryFn: () => listClips({ data: { slug } }),
  });

  const clipMut = useMutation({
    mutationFn: (payload: { image?: string; video?: string; videoUrl?: string }) =>
      postClip({ data: { slug, ...payload } }),
    onSuccess: () => {
      setClipUrl("");
      void queryClient.invalidateQueries({ queryKey: ["clips", slug] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const wishMut = useMutation({
    mutationFn: () => toggleWishlist({ data: { slug } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
    onError: (err: Error) => {
      if (err.message === "Unauthorized") {
        toast.error(t("needSignIn"));
        return;
      }
      toast.error(err.message);
    },
  });

  if (!local && steamId && steam.isPending) {
    return (
      <main className="mx-auto flex w-full max-w-6xl flex-1 px-4 py-16 sm:px-6">
        <p className="text-sm text-muted">{t("loading")}</p>
      </main>
    );
  }

  if (!game) {
    return (
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-start gap-4 px-4 py-16 sm:px-6">
        <h1 className="font-display text-3xl text-fg">{t("notFound")}</h1>
        <p className="text-sm text-muted">{t("notFoundBody")}</p>
        <Button asChild variant="outline">
          <Link to="/games">{t("backCatalog")}</Link>
        </Button>
      </main>
    );
  }

  const communityAvg =
    reviews.data && reviews.data.length > 0
      ? reviews.data.reduce((sum, r) => sum + r.rating, 0) / reviews.data.length
      : null;

  const wished = (wish.data ?? []).includes(slug);
  const metacriticUrl = steam.data?.metacriticUrl ?? null;

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    mutation.mutate();
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-12 px-4 py-10 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.3fr]">
        <GameCover
          game={game}
          title
          className={
            game.coverUrl
              ? "aspect-video overflow-hidden rounded-xl lg:aspect-[3/4]"
              : "aspect-[3/4] max-h-[520px] overflow-hidden rounded-xl"
          }
        />
        <div className="flex flex-col gap-5">
          <div>
            <p className="text-xs tracking-[0.16em] text-muted uppercase">
              {game.developer}
            </p>
            <h1 className="mt-2 font-display text-4xl tracking-tight text-fg sm:text-5xl">
              {game.title}
            </h1>
          </div>
          <p className="text-base leading-normal text-muted">{game.body || game.summary}</p>
          <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-subtle">{t("year")}</dt>
              <dd className="mt-1 tabular-nums text-fg">{game.year || "—"}</dd>
            </div>
            <div>
              <dt className="text-subtle">{t("playtime")}</dt>
              <dd className="mt-1 text-fg">{game.playtime}</dd>
            </div>
            <div>
              <dt className="text-subtle">{t("catalogScore")}</dt>
              <dd className="mt-1 tabular-nums text-fg">
                {game.score ? game.score : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-subtle">{t("communityScore")}</dt>
              <dd className="mt-1 tabular-nums text-fg">
                {communityAvg ? communityAvg.toFixed(1) : "—"}
                {reviews.data && reviews.data.length > 0
                  ? ` / 10 · ${reviews.data.length}`
                  : ""}
              </dd>
            </div>
          </dl>
          <div className="flex flex-wrap gap-2">
            {game.genres.map((g) => (
              <Badge key={g}>{genreLabel(g)}</Badge>
            ))}
            {game.platforms.map((p) => (
              <Badge key={p}>{platformLabel(p)}</Badge>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <SignInGate
              fallback={
                <Button asChild variant="outline">
                  <Link to="/login">{t("wishAdd")}</Link>
                </Button>
              }
            >
              <Button
                type="button"
                variant={wished ? "outline" : "default"}
                disabled={wishMut.isPending}
                onClick={() => wishMut.mutate()}
              >
                {wished ? t("wishRemove") : t("wishAdd")}
              </Button>
            </SignInGate>
            <Button asChild variant="outline">
              <Link to="/party">{t("navParty")}</Link>
            </Button>
            {metacriticUrl ? (
              <Button asChild variant="outline">
                <a href={metacriticUrl} target="_blank" rel="noopener noreferrer">
                  {t("critic")}
                </a>
              </Button>
            ) : null}
          </div>
          {steamId ? (
            <div className="space-y-2 rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
              <h2 className="font-display text-lg text-fg">{t("deals")}</h2>
              {(deals.data ?? []).length === 0 ? (
                <p className="text-sm text-muted">{t("noDeals")}</p>
              ) : (
                <ul className="space-y-2">
                  {(deals.data ?? [])
                    .filter(
                      (deal) =>
                        Number(deal.salePrice) > 0 || Number(deal.normalPrice) === 0,
                    )
                    .map((deal) => (
                    <li key={deal.dealUrl} className="flex items-baseline justify-between gap-3 text-sm">
                      <a
                        href={deal.dealUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-fg hover:underline"
                      >
                        ${deal.salePrice}
                        {deal.normalPrice !== deal.salePrice ? (
                          <span className="ml-2 text-subtle line-through">
                            ${deal.normalPrice}
                          </span>
                        ) : null}
                      </a>
                      {Number(deal.savings) > 1 ? (
                        <span className="tabular-nums text-muted">
                          −{Math.round(Number(deal.savings))}%
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}
        </div>
      </div>

      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <h2 className="font-display text-2xl text-fg">{t("reviews")}</h2>
          {reviews.isPending ? (
            <p className="text-sm text-muted">{t("loading")}</p>
          ) : (reviews.data ?? []).length === 0 ? (
            <p className="text-sm text-muted">{t("emptyReviews")}</p>
          ) : (
            <ul className="divide-y divide-border overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]">
              {(reviews.data ?? []).map((review) => (
                <li key={review.id} className="px-5 py-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-sm font-medium text-fg">
                      <Link
                        to="/u/$id"
                        params={{ id: review.user_id }}
                        className="hover:underline"
                      >
                        {review.author_name}
                      </Link>
                    </p>
                    <span className="tabular-nums text-sm text-accent">
                      {review.rating}/10
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-normal text-muted">{review.body}</p>
                  <p className="mt-2 text-xs">
                    <TimeAgo value={review.created_at} />
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="font-display text-2xl text-fg">{t("rate")}</h2>
          <SignInGate
            fallback={
              <div className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
                <p className="text-sm text-muted">{t("needReviewSignIn")}</p>
                <Button asChild className="mt-4">
                  <Link to="/login">{t("signIn")}</Link>
                </Button>
              </div>
            }
          >
            <form
              onSubmit={onSubmit}
              className="space-y-4 rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]"
            >
              <div>
                <p className="mb-2 text-sm text-muted">
                  {t("reviewHint")} · {rating}/10
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRating(n)}
                      className={cn(
                        "grid size-11 place-items-center rounded-md text-sm tabular-nums transition-colors duration-150",
                        n === rating
                          ? "bg-accent text-accent-fg"
                          : "bg-raised text-muted hover:text-fg",
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={t("reviewPlaceholder")}
                maxLength={600}
              />
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs tabular-nums text-subtle">
                  {body.trim().length}/600
                </span>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? t("saving") : t("send")}
                </Button>
              </div>
            </form>
          </SignInGate>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl text-fg">{t("gallery")}</h2>
        <SignInGate
          fallback={
            <p className="text-sm text-muted">{t("needSignIn")}</p>
          }
        >
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "image/jpeg,image/png,image/webp";
                input.onchange = () => {
                  const file = input.files?.[0];
                  if (!file) return;
                  void fileToDataUrl(file, IMAGE_MAX)
                    .then((image) => clipMut.mutate({ image }))
                    .catch(() => toast.error(t("fileRejected")));
                };
                input.click();
              }}
            >
              {t("attachImage")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "video/mp4,video/webm";
                input.onchange = () => {
                  const file = input.files?.[0];
                  if (!file) return;
                  void fileToDataUrl(file, VIDEO_MAX)
                    .then((video) => clipMut.mutate({ video }))
                    .catch(() => toast.error(t("fileRejected")));
                };
                input.click();
              }}
            >
              {t("attachVideo")}
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowClipUrl((v) => !v)}>
              {t("videoUrl")}
            </Button>
          </div>
          {showClipUrl ? (
            <form
              className="mt-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!clipUrl.trim()) return;
                clipMut.mutate({ videoUrl: clipUrl.trim() });
              }}
            >
              <input
                value={clipUrl}
                onChange={(e) => setClipUrl(e.target.value)}
                placeholder={t("videoHint")}
                className="h-11 flex-1 rounded-md bg-raised px-3.5 text-sm text-fg shadow-[var(--shadow-border)]"
              />
              <Button type="submit">{t("addClip")}</Button>
            </form>
          ) : null}
        </SignInGate>
        {(clips.data ?? []).length === 0 ? (
          <p className="text-sm text-muted">{t("emptyGallery")}</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {(clips.data ?? []).map((clip) => (
              <li key={clip.id} className="rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
                <Link
                  to="/u/$id"
                  params={{ id: clip.user_id }}
                  className="text-sm font-medium text-fg hover:underline"
                >
                  {clip.author_name}
                </Link>
                <SafeMedia message={clip} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
