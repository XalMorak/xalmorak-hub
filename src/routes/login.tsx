import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { LogoMark } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/locale";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const { t } = useI18n();
  const { user, isPending } = useCurrentUserState();

  if (isPending) {
    return (
      <main className="mx-auto flex w-full max-w-6xl flex-1 items-center px-4 py-16 sm:px-6">
        <div className="mx-auto w-full max-w-lg space-y-4 rounded-xl bg-surface p-8">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      </main>
    );
  }

  if (user) {
    return <Navigate to="/" />;
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 items-center px-4 py-16 sm:px-6">
      <div className="mx-auto grid w-full max-w-lg gap-8 rounded-xl bg-surface p-8 shadow-[var(--shadow-border)] sm:p-10">
        <div className="space-y-3">
          <LogoMark className="size-8" />
          <h1 className="font-display text-3xl tracking-tight text-fg">{t("loginTitle")}</h1>
          <p className="text-sm leading-normal text-muted">{t("loginBody")}</p>
        </div>
        {authEnabled ? (
          <div className="grid gap-3">
            {GROK_PROVIDERS.map((p) => (
              <Button
                key={p.providerId}
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => signIn(p.providerId, { callbackURL: "/" })}
              >
                {p.label}
                {t("continueWith")}
              </Button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">{t("needSignIn")}</p>
        )}
        <Link to="/" className="text-sm text-muted hover:text-fg">
          {t("backHome")}
        </Link>
      </div>
    </main>
  );
}
