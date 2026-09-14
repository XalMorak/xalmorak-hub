import { useEffect, useRef, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { ArrowLeft, ImageIcon, Link2, Video } from "lucide-react";
import { SafeMedia, fileToDataUrl, IMAGE_MAX, VIDEO_MAX } from "@/components/safe-media";
import { TimeAgo } from "@/components/time-ago";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  getConversation,
  inviteToGroup,
  kickFromGroup,
  leaveGroup,
  listChatMessages,
  postChatMessage,
  searchPeople,
} from "@/lib/chat";
import { useI18n } from "@/lib/locale";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/messages/$id")({
  component: ThreadPage,
});

function ThreadPage() {
  const { t } = useI18n();
  const { id } = Route.useParams();
  const conversationId = Number(id);
  const valid = Number.isInteger(conversationId) && conversationId > 0;
  const queryClient = useQueryClient();
  const { user } = useCurrentUserState();
  const listRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  const [body, setBody] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [showUrl, setShowUrl] = useState(false);
  const [inviteQ, setInviteQ] = useState("");
  const [debounced, setDebounced] = useState("");

  const convo = useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: () => getConversation({ data: { conversationId } }),
    enabled: valid,
  });

  const messages = useQuery({
    queryKey: ["chat-messages", conversationId],
    queryFn: () => listChatMessages({ data: { conversationId } }),
    enabled: valid,
    refetchInterval: 4000,
  });

  useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(inviteQ.trim()), 300);
    return () => window.clearTimeout(handle);
  }, [inviteQ]);

  const people = useQuery({
    queryKey: ["people-invite", debounced],
    queryFn: () => searchPeople({ data: { q: debounced } }),
    enabled: debounced.length >= 2 && convo.data?.kind === "group",
  });

  const sendMut = useMutation({
    mutationFn: (payload: { image?: string; video?: string; videoUrl?: string }) =>
      postChatMessage({
        data: {
          conversationId,
          body,
          image: payload.image,
          video: payload.video,
          videoUrl: payload.videoUrl,
        },
      }),
    onSuccess: () => {
      setBody("");
      setVideoUrl("");
      setShowUrl(false);
      void queryClient.invalidateQueries({ queryKey: ["chat-messages", conversationId] });
      void queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const inviteMut = useMutation({
    mutationFn: (userId: string) =>
      inviteToGroup({ data: { conversationId, userId } }),
    onSuccess: () => {
      setInviteQ("");
      void queryClient.invalidateQueries({ queryKey: ["conversation", conversationId] });
      toast.success(t("invite"));
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const kickMut = useMutation({
    mutationFn: (userId: string) =>
      kickFromGroup({ data: { conversationId, userId } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["conversation", conversationId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const leaveMut = useMutation({
    mutationFn: () => leaveGroup({ data: { conversationId } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["conversations"] });
      window.location.href = "/messages";
    },
    onError: (err: Error) => toast.error(err.message),
  });

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.data]);

  if (!valid) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted">{t("notFound")}</p>
      </div>
    );
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!body.trim() && !videoUrl.trim()) return;
    sendMut.mutate({ videoUrl: videoUrl.trim() || undefined });
  }

  async function onPickImage(file: File | undefined) {
    if (!file) return;
    try {
      const image = await fileToDataUrl(file, IMAGE_MAX);
      sendMut.mutate({ image });
    } catch {
      toast.error(t("fileRejected"));
    }
  }

  async function onPickVideo(file: File | undefined) {
    if (!file) return;
    try {
      const video = await fileToDataUrl(file, VIDEO_MAX);
      sendMut.mutate({ video });
    } catch {
      toast.error(t("fileRejected"));
    }
  }

  return (
    <div className="flex h-full min-h-[28rem] flex-col">
      <header className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <Link
            to="/messages"
            className="mb-1 inline-flex h-11 items-center gap-1 text-sm text-muted hover:text-fg lg:hidden"
          >
            <ArrowLeft className="size-4" />
            {t("backChat")}
          </Link>
          <h2 className="truncate font-display text-xl text-fg">
            {convo.data?.title ?? t("loading")}
          </h2>
          <p className="mt-1 text-xs text-subtle">
            {t("members")}:{" "}
            {(convo.data?.members ?? []).map((m) => m.name).join(", ")}
          </p>
          {convo.data?.kind === "group" ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {(convo.data.members ?? []).map((m) => {
                const selfRole = convo.data?.members.find((x) => x.id === user?.id)?.role;
                return (
                  <span key={m.id} className="inline-flex items-center gap-1 text-xs text-muted">
                    <Link to="/u/$id" params={{ id: m.id }} className="hover:text-fg">
                      {m.name}
                    </Link>
                    {selfRole === "owner" && m.id !== user?.id ? (
                      <button
                        type="button"
                        className="h-11 px-1 text-subtle hover:text-fg"
                        onClick={() => kickMut.mutate(m.id)}
                      >
                        {t("kick")}
                      </button>
                    ) : null}
                  </span>
                );
              })}
              <button
                type="button"
                className="h-11 text-xs text-subtle hover:text-fg"
                onClick={() => leaveMut.mutate()}
              >
                {t("leaveGroup")}
              </button>
            </div>
          ) : null}
        </div>
        {convo.data?.kind === "group" ? (
          <div className="w-44 shrink-0">
            <Input
              value={inviteQ}
              onChange={(e) => setInviteQ(e.target.value)}
              placeholder={t("invitePlaceholder")}
              aria-label={t("invite")}
            />
            {debounced.length >= 2 ? (
              <ul className="mt-1 max-h-36 overflow-y-auto rounded-md bg-raised">
                {(people.data ?? [])
                  .filter((p) => !(convo.data?.members ?? []).some((m) => m.id === p.id))
                  .map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => inviteMut.mutate(p.id)}
                        className="flex h-11 w-full items-center px-3 text-left text-sm text-fg"
                      >
                        {p.name}
                      </button>
                    </li>
                  ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </header>

      <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.isPending ? (
          <p className="text-sm text-muted">{t("loading")}</p>
        ) : (messages.data ?? []).length === 0 ? (
          <p className="text-sm text-muted">{t("emptyThread")}</p>
        ) : (
          (messages.data ?? []).map((msg) => {
            const mine = user?.id === msg.user_id;
            return (
              <article
                key={msg.id}
                className={cn("max-w-md", mine && "ml-auto text-right")}
              >
                <div className={cn("flex items-baseline gap-2", mine && "justify-end")}>
                  <span className="text-sm font-medium text-fg">{msg.author_name}</span>
                  <TimeAgo value={msg.created_at} />
                </div>
                {msg.body ? (
                  <p className="mt-1 text-sm leading-normal text-muted">{msg.body}</p>
                ) : null}
                <SafeMedia message={msg} />
              </article>
            );
          })
        )}
      </div>

      <form onSubmit={onSubmit} className="space-y-3 border-t border-border p-4">
        <p className="text-xs text-subtle">{t("securityNote")}</p>
        {showUrl ? (
          <Input
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder={t("videoHint")}
            aria-label={t("videoUrl")}
          />
        ) : null}
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id="chat-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={2000}
            placeholder={t("chatPlaceholder")}
            className="h-11 flex-1 rounded-md bg-raised px-3.5 text-sm text-fg shadow-[var(--shadow-border)] placeholder:text-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <div className="flex gap-2">
            <input
              ref={imageRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                void onPickImage(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <input
              ref={videoRef}
              type="file"
              accept="video/mp4,video/webm"
              className="hidden"
              onChange={(e) => {
                void onPickVideo(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={t("attachImage")}
              onClick={() => imageRef.current?.click()}
            >
              <ImageIcon className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={t("attachVideo")}
              onClick={() => videoRef.current?.click()}
            >
              <Video className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={t("videoUrl")}
              onClick={() => setShowUrl((v) => !v)}
            >
              <Link2 className="size-4" />
            </Button>
            <Button
              type="submit"
              disabled={sendMut.isPending || (!body.trim() && !videoUrl.trim())}
            >
              {sendMut.isPending ? t("saving") : t("send")}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
