import { useState, useSyncExternalStore } from "react";
import { Link } from "@tanstack/react-router";
import { authEnabled, signOut } from "@/lib/auth/client";
import { hasGateSessionMarker } from "@/lib/auth/gate-session-marker";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/locale";

const subscribeToNothing = () => () => {};
const noGateSessionOnServer = () => false;

export function AuthSlot() {
  const { t } = useI18n();
  const { user, isPending } = useCurrentUserState();
  const [signingOut, setSigningOut] = useState(false);
  const gateSession = useSyncExternalStore(
    subscribeToNothing,
    hasGateSessionMarker,
    noGateSessionOnServer,
  );

  if (isPending) {
    return <Skeleton className="h-11 w-28 rounded-md" />;
  }

  if (user) {
    const label = user.displayName ?? user.primaryEmail ?? "Тоглогч";
    return (
      <div className="flex items-center gap-2">
        {user.profileImageUrl ? (
          <img
            src={user.profileImageUrl}
            alt=""
            className="size-8 rounded-full object-cover outline outline-1 -outline-offset-1 outline-fg/10"
          />
        ) : (
          <span className="grid size-8 place-items-center rounded-full bg-raised text-xs font-medium text-fg">
            {label.charAt(0).toUpperCase()}
          </span>
        )}
        <Link
          to="/me"
          className="hidden max-w-28 truncate text-sm text-fg hover:underline sm:inline"
        >
          {label}
        </Link>
        {authEnabled && !gateSession ? (
          <Button
            variant="ghost"
            size="sm"
            disabled={signingOut}
            onClick={() => {
              setSigningOut(true);
              void signOut().catch(() => setSigningOut(false));
            }}
          >
            {signingOut ? t("signingOut") : t("signOut")}
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <Button asChild size="sm">
      <Link to="/login">{t("signIn")}</Link>
    </Button>
  );
}
