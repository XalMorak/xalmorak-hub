import { useEffect, useRef, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { TimeAgo } from "@/components/time-ago";
import { Button } from "@/components/ui/button";
import { SignInGate } from "@/lib/auth/gates";
import { CHANNELS, type ChannelId } from "@/lib/channels";
import { listMessages, postMessage } from "@/lib/community";
import { useI18n } from "@/lib/locale";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/lounge")({ component: LoungePage });

function LoungePage() {
  const { t, locale } = useI18n();
  const [channel, setChannel] = useState<ChannelId>("general");
  const [body, setBody] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const current = CHANNELS.find((c) => c.id === channel) ?? CHANNELS[0];

  const messages = useQuery({
    queryKey: ["lounge", channel],
    queryFn: () => listMessages({ data: { channel } }),
    refetchInterval: 4000,
  });

  const mutation = useMutation({
    mutationFn: () => postMessage({ data: { channel, body } }),
    onSuccess: () => {
      setBody("");
      void queryClient.invalidateQueries({ queryKey: ["lounge", channel] });
      void queryClient.invalidateQueries({ queryKey: ["recent-messages"] });
    },
    onError: (err: Error) => {
      if (err.message === "Unauthorized") {
        toast.error(t("needChatSignIn"));
        return;
      }
      toast.error(err.message || "Илгээгдсэнгүй");
    },
  });

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.data, channel]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    mutation.mutate();
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
      <header className="space-y-3">
        <p className="text-xs font-medium tracking-[0.18em] text-muted uppercase">
          {t("loungeChannels")}
        </p>
        <h1 className="font-display text-4xl tracking-tight text-fg">{t("lounge")}</h1>
        <p className="max-w-2xl text-sm leading-normal text-muted">{t("loungeBlurb")}</p>
      </header>

      <div className="flex flex-wrap gap-2">
        {CHANNELS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setChannel(c.id)}
            className={cn(
              "inline-flex h-11 items-center rounded-full px-4 text-sm transition-colors duration-150",
              c.id === channel
                ? "bg-accent text-accent-fg"
                : "bg-raised text-muted hover:text-fg",
            )}
          >
            {c.label[locale]}
          </button>
        ))}
      </div>

      <p className="text-sm text-muted">{current.blurb[locale]}</p>

      <div className="flex min-h-[28rem] flex-1 flex-col overflow-hidden rounded-xl bg-surface shadow-[var(--shadow-border)]">
        <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {messages.isPending ? (
            <p className="text-sm text-muted">{t("loading")}</p>
          ) : (messages.data ?? []).length === 0 ? (
            <p className="text-sm text-muted">{t("emptyLounge")}</p>
          ) : (
            (messages.data ?? []).map((msg) => (
              <article key={msg.id} className="max-w-xl">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium text-fg">{msg.author_name}</span>
                  <TimeAgo value={msg.created_at} />
                </div>
                <p className="mt-1 text-sm leading-normal text-muted">{msg.body}</p>
              </article>
            ))
          )}
        </div>

        <div className="border-t border-border p-4">
          <SignInGate
            fallback={
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted">{t("needChatSignIn")}</p>
                <Button asChild>
                  <Link to="/login">{t("signIn")}</Link>
                </Button>
              </div>
            }
          >
            <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
              <label className="sr-only" htmlFor="lounge-body">
                {t("chatPlaceholder")}
              </label>
              <input
                id="lounge-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={400}
                placeholder={t("loungePlaceholder")}
                className="h-11 flex-1 rounded-md bg-raised px-3.5 text-sm text-fg shadow-[var(--shadow-border)] placeholder:text-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <Button type="submit" disabled={mutation.isPending || !body.trim()}>
                {mutation.isPending ? t("saving") : t("send")}
              </Button>
            </form>
          </SignInGate>
        </div>
      </div>
    </main>
  );
}
