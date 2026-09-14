import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { GameCard } from "@/components/game-card";
import { Button } from "@/components/ui/button";
import { SignInGate } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getSteamGame, parseSteamSlug, steamDetailToGame } from "@/lib/catalog";
import { getGame } from "@/lib/games";
import { useI18n } from "@/lib/locale";
import { listWishlist } from "@/lib/wishlist";

export const Route = createFileRoute("/wishlist")({
  component: WishlistPage,
});

function WishlistPage() {
  const { t } = useI18n();
  const { user } = useCurrentUserState();
  const wish = useQuery({
    queryKey: ["wishlist"],
    queryFn: () => listWishlist(),
    enabled: !!user,
  });

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6">
      <header className="space-y-3">
        <p className="text-xs font-medium tracking-[0.18em] text-muted uppercase">
          {t("navWish")}
        </p>
        <h1 className="font-display text-4xl tracking-tight text-fg">
          {t("wishlistTitle")}
        </h1>
      </header>

      <SignInGate
        fallback={
          <div className="rounded-xl bg-surface p-6 shadow-[var(--shadow-border)]">
            <p className="text-sm text-muted">{t("needSignIn")}</p>
            <Button asChild className="mt-4">
              <Link to="/login">{t("signIn")}</Link>
            </Button>
          </div>
        }
      >
        {wish.isPending ? (
          <p className="text-sm text-muted">{t("loading")}</p>
        ) : (wish.data ?? []).length === 0 ? (
          <p className="text-sm text-muted">{t("emptyWish")}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(wish.data ?? []).map((slug) => (
              <WishCard key={slug} slug={slug} />
            ))}
          </div>
        )}
      </SignInGate>
    </main>
  );
}

function WishCard({ slug }: { slug: string }) {
  const local = getGame(slug);
  const steamId = parseSteamSlug(slug);
  const remote = useQuery({
    queryKey: ["steam-game", steamId],
    queryFn: () => getSteamGame({ data: { steamId: steamId! } }),
    enabled: !local && !!steamId,
  });
  const game = local ?? (remote.data ? steamDetailToGame(remote.data) : null);
  if (!game) return null;
  return <GameCard game={game} />;
}
