import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SignInGate } from "@/lib/auth/gates";
import { getGame } from "@/lib/games";
import { useI18n } from "@/lib/locale";
import { listParty, postParty } from "@/lib/party";
import { REGIONS, regionLabel } from "@/lib/regions";

export const Route = createFileRoute("/party")({
  loader: () => listParty({ data: { region: "" } }).catch(() => []),
  component: PartyPage,
});

function PartyPage() {
  const { t, locale } = useI18n();
  const initialPosts = Route.useLoaderData();
  const queryClient = useQueryClient();
  const [region, setRegion] = useState("");
  const posts = useQuery({
    queryKey: ["party", region],
    queryFn: () => listParty({ data: { region } }),
    initialData: region === "" ? initialPosts : undefined,
  });
  const [game, setGame] = useState("elden-ring");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [postRegion, setPostRegion] = useState("mn");
  const [slots, setSlots] = useState(4);
  const [when, setWhen] = useState("");

  const create = useMutation({
    mutationFn: () =>
      postParty({
        data: {
          game,
          title,
          body,
          region: postRegion,
          slots,
          scheduledAt: when || undefined,
        },
      }),
    onSuccess: () => {
      setTitle("");
      setBody("");
      toast.success(t("send"));
      void queryClient.invalidateQueries({ queryKey: ["party"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    create.mutate();
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 space-y-8 px-4 py-8 sm:px-6">
      <header className="space-y-2">
        <p className="text-xs font-medium tracking-[0.18em] text-muted uppercase">
          {t("navParty")}
        </p>
        <h1 className="font-display text-4xl tracking-tight text-fg">{t("partyTitle")}</h1>
        <p className="max-w-2xl text-sm leading-normal text-muted">{t("partyBlurb")}</p>
      </header>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setRegion("")}
          className={`h-11 rounded-md px-3 text-sm ${region === "" ? "bg-accent text-accent-fg" : "bg-raised text-muted"}`}
        >
          {t("allPlatforms")}
        </button>
        {REGIONS.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setRegion(r.id)}
            className={`h-11 rounded-md px-3 text-sm ${region === r.id ? "bg-accent text-accent-fg" : "bg-raised text-muted"}`}
          >
            {locale === "mn" ? r.mn : r.en}
          </button>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-3">
          {(posts.data ?? []).length === 0 ? (
            <p className="text-sm text-muted">{t("emptyParty")}</p>
          ) : (
            <ul className="divide-y divide-border overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]">
              {(posts.data ?? []).map((p) => {
                const gameTitle = getGame(p.game_slug)?.title ?? p.game_slug;
                return (
                  <li key={p.id} className="space-y-2 px-5 py-4">
                    <div className="flex items-baseline justify-between gap-3">
                      <Link
                        to="/u/$id"
                        params={{ id: p.user_id }}
                        className="text-sm font-medium text-fg hover:underline"
                      >
                        {p.author_name}
                      </Link>
                      <span className="text-xs text-subtle">
                        {regionLabel(p.region, locale)} · {p.slots}
                      </span>
                    </div>
                    <p className="font-display text-lg text-fg">{p.title}</p>
                    <p className="text-sm text-muted">{p.body}</p>
                    <Link
                      to="/games/$slug"
                      params={{ slug: p.game_slug }}
                      className="text-sm text-accent hover:underline"
                    >
                      {gameTitle}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <SignInGate
          fallback={
            <div className="rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]">
              <p className="text-sm text-muted">{t("needSignIn")}</p>
              <Button asChild className="mt-4">
                <Link to="/login">{t("signIn")}</Link>
              </Button>
            </div>
          }
        >
          <form
            onSubmit={onSubmit}
            className="space-y-3 rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]"
          >
            <Input
              value={game}
              onChange={(e) => setGame(e.target.value)}
              placeholder={t("partyGame")}
              aria-label={t("partyGame")}
            />
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("groupName")}
              maxLength={80}
            />
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={t("loungePlaceholder")}
              maxLength={400}
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                value={postRegion}
                onChange={(e) => setPostRegion(e.target.value)}
                className="h-11 rounded-md bg-raised px-3 text-sm text-fg shadow-[var(--shadow-border)]"
              >
                {REGIONS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {locale === "mn" ? r.mn : r.en}
                  </option>
                ))}
              </select>
              <Input
                type="number"
                min={2}
                max={10}
                value={slots}
                onChange={(e) => setSlots(Number(e.target.value))}
                aria-label={t("partySlots")}
              />
            </div>
            <Input
              type="datetime-local"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
              aria-label={t("partyWhen")}
            />
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? t("saving") : t("create")}
            </Button>
          </form>
        </SignInGate>
      </div>
    </main>
  );
}
