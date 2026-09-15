import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { LogoMark } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/locale";

/** Grok's Google/X broker only accepts `*.grok-sandbox.com` callbacks. */
function brokerOAuthAllowed(host: string): boolean {
  return (
    host.endsWith(".grok-sandbox.com") ||
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "[::1]"
  );
}

export const Route = createFileRoute("/login")({
  component: Login,
});

/** Same key the auth client uses for the live-preview bearer. */
const BEARER_KEY = "grok-auth.bearer-token";

function persistSessionToken(token: unknown) {
  if (typeof token !== "string" || !token || typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(BEARER_KEY, token);
  } catch {
    /* storage unavailable */
  }
}

function Login() {
  const { t } = useI18n();
  const { user, isPending } = useCurrentUserState();
  const [brokerOAuth, setBrokerOAuth] = useState(false);
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    setBrokerOAuth(brokerOAuthAllowed(window.location.hostname));
  }, []);

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

  async function onEmail(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy("email");
    try {
      if (mode === "up") {
        const { data, error: err } = await authClient.signUp.email({
          email: email.trim(),
          password,
          name: name.trim() || email.trim().split("@")[0] || "Player",
        });
        if (err) throw new Error(err.message || t("signUpFailed"));
        persistSessionToken((data as { token?: string } | null)?.token);
      } else {
        const { data, error: err } = await authClient.signIn.email({
          email: email.trim(),
          password,
        });
        if (err) throw new Error(err.message || t("loginFailed"));
        persistSessionToken((data as { token?: string } | null)?.token);
      }
      try {
        await authClient.getSession();
      } catch {
        /* session store recovers on next fetch */
      }
      window.location.assign("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("loginFailed"));
      setBusy(null);
    }
  }

  async function onOAuth(providerId: string) {
    setError(null);
    setBusy(providerId);
    try {
      await signIn(providerId, { callbackURL: "/" });
    } catch (err) {
      const raw = err instanceof Error ? err.message : "";
      setError(raw.includes("Pop-up") ? t("popupBlocked") : raw || t("loginFailed"));
      setBusy(null);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 items-center px-4 py-16 sm:px-6">
      <div className="mx-auto grid w-full max-w-lg gap-8 rounded-xl bg-surface p-8 shadow-[var(--shadow-border)] sm:p-10">
        <div className="space-y-3">
          <LogoMark className="size-8" />
          <h1 className="font-display text-3xl tracking-tight text-fg">
            {mode === "up" ? t("createAccount") : t("loginTitle")}
          </h1>
          <p className="text-sm leading-normal text-muted">
            {t(brokerOAuth ? "loginBody" : "loginBodyPublic")}
          </p>
        </div>

        {authEnabled ? (
          <div className="grid gap-6">
            <form onSubmit={onEmail} className="grid gap-3">
              {mode === "up" ? (
                <label className="grid gap-1.5">
                  <span className="text-xs font-medium text-muted">{t("nameLabel")}</span>
                  <Input
                    name="name"
                    autoComplete="nickname"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={60}
                  />
                </label>
              ) : null}
              <label className="grid gap-1.5">
                <span className="text-xs font-medium text-muted">{t("emailLabel")}</span>
                <Input
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              <label className="grid gap-1.5">
                <span className="text-xs font-medium text-muted">{t("passwordLabel")}</span>
                <Input
                  type="password"
                  name="password"
                  autoComplete={mode === "up" ? "new-password" : "current-password"}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <span className="text-xs text-subtle">{t("passwordHint")}</span>
              </label>
              {error ? (
                <p className="text-sm text-fg" role="alert">
                  {error}
                </p>
              ) : null}
              <Button type="submit" className="w-full" disabled={Boolean(busy)}>
                {busy === "email"
                  ? t("signingIn")
                  : mode === "up"
                    ? t("createAccount")
                    : t("signIn")}
              </Button>
              <button
                type="button"
                className="text-sm text-muted hover:text-fg"
                onClick={() => {
                  setMode(mode === "in" ? "up" : "in");
                  setError(null);
                }}
              >
                {mode === "in" ? t("needAccount") : t("haveAccount")}
              </button>
            </form>

            {brokerOAuth ? (
              <>
                <div className="flex items-center gap-3">
                  <span className="h-px flex-1 bg-border" />
                  <span className="text-xs uppercase tracking-wide text-subtle">{t("orDivider")}</span>
                  <span className="h-px flex-1 bg-border" />
                </div>

                <div className="grid gap-3">
                  {GROK_PROVIDERS.map((p) => (
                    <Button
                      key={p.providerId}
                      type="button"
                      variant="outline"
                      className="w-full"
                      disabled={Boolean(busy)}
                      onClick={() => onOAuth(p.providerId)}
                    >
                      {busy === p.providerId
                        ? t("signingIn")
                        : p.idp === "google"
                          ? t("continueGoogle")
                          : t("continueX")}
                    </Button>
                  ))}
                </div>
              </>
            ) : null}
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
