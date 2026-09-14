import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SignInGate } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { openDirect } from "@/lib/chat";
import { useI18n } from "@/lib/locale";
import {
  listBlocked,
  listFriends,
  removeFriend,
  respondFriend,
  unblockUser,
} from "@/lib/social";

export const Route = createFileRoute("/friends")({
  component: FriendsPage,
});

function FriendsPage() {
  const { t } = useI18n();
  const { user } = useCurrentUserState();
  const queryClient = useQueryClient();
  const friends = useQuery({
    queryKey: ["friends"],
    queryFn: () => listFriends(),
    enabled: Boolean(user),
  });
  const blocked = useQuery({
    queryKey: ["blocked"],
    queryFn: () => listBlocked(),
    enabled: Boolean(user),
  });

  const respondMut = useMutation({
    mutationFn: (input: { userId: string; accept: boolean }) => respondFriend({ data: input }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["friends"] }),
    onError: (err: Error) => toast.error(err.message),
  });
  const removeMut = useMutation({
    mutationFn: (userId: string) => removeFriend({ data: { userId } }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["friends"] }),
    onError: (err: Error) => toast.error(err.message),
  });
  const dmMut = useMutation({
    mutationFn: (userId: string) => openDirect({ data: { userId } }),
    onSuccess: (row) => {
      window.location.href = `/messages/${row.id}`;
    },
    onError: (err: Error) => toast.error(err.message),
  });
  const unblockMut = useMutation({
    mutationFn: (userId: string) => unblockUser({ data: { userId } }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["blocked"] }),
    onError: (err: Error) => toast.error(err.message),
  });

  const incoming = (friends.data ?? []).filter((f) => f.incoming);
  const accepted = (friends.data ?? []).filter((f) => f.status === "accepted");
  const outgoing = (friends.data ?? []).filter((f) => f.status === "pending" && !f.incoming);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 space-y-8 px-4 py-8 sm:px-6">
      <header className="space-y-2">
        <p className="text-xs font-medium tracking-[0.18em] text-muted uppercase">
          {t("navFriends")}
        </p>
        <h1 className="font-display text-4xl tracking-tight text-fg">{t("friendsTitle")}</h1>
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
        <div className="space-y-8">
          {incoming.length > 0 ? (
            <section className="space-y-3">
              <h2 className="font-display text-xl text-fg">{t("friendAccept")}</h2>
              <ul className="divide-y divide-border overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]">
                {incoming.map((f) => (
                  <li key={f.id} className="flex items-center justify-between gap-3 px-5 py-4">
                    <Link to="/u/$id" params={{ id: f.id }} className="text-sm text-fg hover:underline">
                      {f.name}
                    </Link>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => respondMut.mutate({ userId: f.id, accept: true })}>
                        {t("friendAccept")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => respondMut.mutate({ userId: f.id, accept: false })}
                      >
                        {t("friendDecline")}
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="space-y-3">
            <h2 className="font-display text-xl text-fg">{t("friendsTitle")}</h2>
            {accepted.length === 0 && outgoing.length === 0 ? (
              <p className="text-sm text-muted">{t("emptyFriends")}</p>
            ) : (
              <ul className="divide-y divide-border overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]">
                {accepted.map((f) => (
                  <li key={f.id} className="flex items-center justify-between gap-3 px-5 py-4">
                    <Link to="/u/$id" params={{ id: f.id }} className="text-sm text-fg hover:underline">
                      {f.name}
                    </Link>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => dmMut.mutate(f.id)}>
                        {t("startDm")}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => removeMut.mutate(f.id)}>
                        {t("friendRemove")}
                      </Button>
                    </div>
                  </li>
                ))}
                {outgoing.map((f) => (
                  <li key={f.id} className="flex items-center justify-between gap-3 px-5 py-4">
                    <Link to="/u/$id" params={{ id: f.id }} className="text-sm text-fg hover:underline">
                      {f.name}
                    </Link>
                    <span className="text-xs text-subtle">{t("friendPending")}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {(blocked.data ?? []).length > 0 ? (
            <section className="space-y-3">
              <h2 className="font-display text-xl text-fg">{t("blockedList")}</h2>
              <ul className="divide-y divide-border overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]">
                {(blocked.data ?? []).map((b) => (
                  <li key={b.id} className="flex items-center justify-between gap-3 px-5 py-4">
                    <span className="text-sm text-fg">{b.name}</span>
                    <Button size="sm" variant="outline" onClick={() => unblockMut.mutate(b.id)}>
                      {t("unblock")}
                    </Button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </SignInGate>
    </main>
  );
}
