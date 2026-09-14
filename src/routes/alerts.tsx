import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { TimeAgo } from "@/components/time-ago";
import { Button } from "@/components/ui/button";
import { SignInGate } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useI18n } from "@/lib/locale";
import { listNotices, markNoticesRead } from "@/lib/social";

export const Route = createFileRoute("/alerts")({
  component: AlertsPage,
});

function AlertsPage() {
  const { t } = useI18n();
  const { user } = useCurrentUserState();
  const queryClient = useQueryClient();
  const notices = useQuery({
    queryKey: ["notices"],
    queryFn: () => listNotices(),
    enabled: Boolean(user),
  });
  const readMut = useMutation({
    mutationFn: () => markNoticesRead(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notices"] });
      void queryClient.invalidateQueries({ queryKey: ["notice-count"] });
    },
  });

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-4 py-8 sm:px-6">
      <header className="flex items-end justify-between gap-3">
        <div className="space-y-2">
          <p className="text-xs font-medium tracking-[0.18em] text-muted uppercase">
            {t("navAlerts")}
          </p>
          <h1 className="font-display text-4xl tracking-tight text-fg">{t("alertsTitle")}</h1>
        </div>
        <Button variant="outline" size="sm" onClick={() => readMut.mutate()}>
          {t("markRead")}
        </Button>
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
        {(notices.data ?? []).length === 0 ? (
          <p className="text-sm text-muted">{t("emptyAlerts")}</p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]">
            {(notices.data ?? []).map((n) => (
              <li key={n.id}>
                <a href={n.href} className="block px-5 py-4 hover:bg-raised/60">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className={n.read ? "text-sm text-muted" : "text-sm font-medium text-fg"}>
                      {n.title}
                    </p>
                    <TimeAgo value={n.created_at} />
                  </div>
                  {n.body ? (
                    <p className="mt-1 text-sm text-muted">{n.body}</p>
                  ) : null}
                </a>
              </li>
            ))}
          </ul>
        )}
      </SignInGate>
    </main>
  );
}
