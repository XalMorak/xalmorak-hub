import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Outlet, createFileRoute, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SignInGate } from "@/lib/auth/gates";
import {
  createGroup,
  listConversations,
  openDirect,
  searchPeople,
} from "@/lib/chat";
import { useI18n } from "@/lib/locale";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/messages")({
  component: MessagesLayout,
});

function MessagesLayout() {
  const { t } = useI18n();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const inThread = /^\/messages\/\d+$/.test(pathname);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <header className={cn("space-y-2", inThread && "hidden lg:block")}>
        <p className="text-xs font-medium tracking-[0.18em] text-muted uppercase">
          {t("navChat")}
        </p>
        <h1 className="font-display text-4xl tracking-tight text-fg">{t("chatTitle")}</h1>
        <p className="max-w-2xl text-sm leading-normal text-muted">{t("chatBlurb")}</p>
      </header>

      <SignInGate
        fallback={
          <div className="rounded-xl bg-surface p-6 shadow-[var(--shadow-border)]">
            <p className="text-sm text-muted">{t("needChatSignIn")}</p>
            <Button asChild className="mt-4">
              <Link to="/login">{t("signIn")}</Link>
            </Button>
          </div>
        }
      >
        <div className="grid min-h-[32rem] flex-1 overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)] lg:grid-cols-[18rem_1fr]">
          <aside className={cn("border-border lg:border-r", inThread && "hidden lg:block")}>
            <ConversationPanel />
          </aside>
          <div className={cn("min-h-[28rem]", !inThread && "hidden lg:block")}>
            <Outlet />
          </div>
        </div>
      </SignInGate>
    </main>
  );
}

function ConversationPanel() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const queryClient = useQueryClient();
  const [peopleQ, setPeopleQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [groupTitle, setGroupTitle] = useState("");

  useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(peopleQ.trim()), 300);
    return () => window.clearTimeout(handle);
  }, [peopleQ]);

  const convos = useQuery({
    queryKey: ["conversations"],
    queryFn: () => listConversations(),
    refetchInterval: 8000,
  });

  const people = useQuery({
    queryKey: ["people", debounced],
    queryFn: () => searchPeople({ data: { q: debounced } }),
    enabled: debounced.length >= 2,
  });

  const openMut = useMutation({
    mutationFn: (userId: string) => openDirect({ data: { userId } }),
    onSuccess: (res) => {
      setPeopleQ("");
      void queryClient.invalidateQueries({ queryKey: ["conversations"] });
      void navigate({ to: "/messages/$id", params: { id: String(res.id) } });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const groupMut = useMutation({
    mutationFn: () => createGroup({ data: { title: groupTitle } }),
    onSuccess: (res) => {
      setGroupTitle("");
      void queryClient.invalidateQueries({ queryKey: ["conversations"] });
      void navigate({ to: "/messages/$id", params: { id: String(res.id) } });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function onGroup(e: FormEvent) {
    e.preventDefault();
    if (groupTitle.trim().length < 2) return;
    groupMut.mutate();
  }

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <Input
        value={peopleQ}
        onChange={(e) => setPeopleQ(e.target.value)}
        placeholder={t("searchPeople")}
        aria-label={t("searchPeople")}
      />
      {debounced.length >= 2 ? (
        <ul className="space-y-1">
          {(people.data ?? []).map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => openMut.mutate(p.id)}
                className="flex h-11 w-full items-center rounded-md px-3 text-left text-sm text-fg hover:bg-raised"
              >
                {p.name}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <form onSubmit={onGroup} className="flex gap-2">
        <Input
          value={groupTitle}
          onChange={(e) => setGroupTitle(e.target.value)}
          placeholder={t("groupName")}
          maxLength={48}
          aria-label={t("groupName")}
        />
        <Button type="submit" size="sm" disabled={groupMut.isPending || groupTitle.trim().length < 2}>
          {t("create")}
        </Button>
      </form>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {(convos.data ?? []).length === 0 ? (
          <p className="px-1 text-sm text-muted">{t("noConversations")}</p>
        ) : (
          <ul className="space-y-1">
            {(convos.data ?? []).map((c) => {
              const href = `/messages/${c.id}`;
              const active = pathname === href;
              return (
                <li key={c.id}>
                  <Link
                    to="/messages/$id"
                    params={{ id: String(c.id) }}
                    className={cn(
                      "block rounded-md px-3 py-3 transition-colors duration-150",
                      active ? "bg-raised text-fg" : "text-muted hover:bg-raised hover:text-fg",
                    )}
                  >
                    <p className="truncate text-sm font-medium text-fg">{c.title}</p>
                    <p className="mt-0.5 truncate text-xs text-subtle">
                      {c.kind === "group" ? t("newGroup") : t("startDm")}
                      {c.preview ? ` · ${c.preview}` : ""}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
