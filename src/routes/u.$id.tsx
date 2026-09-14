import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { openDirect } from "@/lib/chat";
import { useI18n } from "@/lib/locale";
import { regionLabel } from "@/lib/regions";
import {
  blockUser,
  getProfile,
  getRelation,
  reportUser,
  requestFriend,
  respondFriend,
} from "@/lib/social";

export const Route = createFileRoute("/u/$id")({
  component: ProfilePage,
});

function ProfilePage() {
  const { t, locale } = useI18n();
  const { id } = Route.useParams();
  const { user } = useCurrentUserState();
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("spam");
  const [reportBody, setReportBody] = useState("");
  const [showReport, setShowReport] = useState(false);

  const profile = useQuery({
    queryKey: ["profile", id],
    queryFn: () => getProfile({ data: { userId: id } }),
  });
  const relation = useQuery({
    queryKey: ["relation", id],
    queryFn: () => getRelation({ data: { userId: id } }),
    enabled: Boolean(user),
  });

  const rel = relation.data ?? profile.data?.relation ?? "none";

  const friendMut = useMutation({
    mutationFn: () => requestFriend({ data: { userId: id } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["relation", id] });
      void queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
  const respondMut = useMutation({
    mutationFn: (accept: boolean) => respondFriend({ data: { userId: id, accept } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["relation", id] });
      void queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
  const blockMut = useMutation({
    mutationFn: () => blockUser({ data: { userId: id } }),
    onSuccess: () => {
      toast.success(t("block"));
      void queryClient.invalidateQueries({ queryKey: ["relation", id] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
  const reportMut = useMutation({
    mutationFn: () =>
      reportUser({ data: { userId: id, reason, body: reportBody } }),
    onSuccess: () => {
      toast.success(t("reportSent"));
      setShowReport(false);
      setReportBody("");
    },
    onError: (err: Error) => toast.error(err.message),
  });
  const dmMut = useMutation({
    mutationFn: () => openDirect({ data: { userId: id } }),
    onSuccess: (row) => {
      window.location.href = `/messages/${row.id}`;
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (profile.isError) {
    return (
      <main className="mx-auto max-w-xl flex-1 px-4 py-16">
        <p className="text-sm text-muted">{t("notFound")}</p>
      </main>
    );
  }
  const p = profile.data;

  return (
    <main className="mx-auto w-full max-w-xl flex-1 space-y-6 px-4 py-8 sm:px-6">
      <header className="flex items-start gap-4">
        {p?.avatar ? (
          <img src={p.avatar} alt="" className="size-16 rounded-full object-cover" />
        ) : (
          <span className="grid size-16 place-items-center rounded-full bg-raised text-lg text-fg">
            {(p?.name ?? "?").charAt(0)}
          </span>
        )}
        <div className="min-w-0 space-y-1">
          <h1 className="font-display text-3xl tracking-tight text-fg">
            {p?.name ?? t("loading")}
          </h1>
          <p className="text-sm text-muted">
            {p ? regionLabel(p.region, locale) : ""} · {p?.reviews ?? 0} {t("reviewsCount")}
            {p?.avg ? ` · ${p.avg.toFixed(1)}/10` : ""} · {p?.friends ?? 0} {t("friendsCount")}
          </p>
          {p?.bio ? <p className="text-sm leading-normal text-muted">{p.bio}</p> : null}
        </div>
      </header>

      {rel === "self" ? (
        <Button asChild>
          <Link to="/me">{t("profileSave")}</Link>
        </Button>
      ) : user ? (
        <div className="flex flex-wrap gap-2">
          {rel === "none" ? (
            <Button onClick={() => friendMut.mutate()} disabled={friendMut.isPending}>
              {t("friendAdd")}
            </Button>
          ) : null}
          {rel === "outgoing" ? (
            <Button variant="outline" disabled>
              {t("friendPending")}
            </Button>
          ) : null}
          {rel === "incoming" ? (
            <>
              <Button onClick={() => respondMut.mutate(true)}>{t("friendAccept")}</Button>
              <Button variant="outline" onClick={() => respondMut.mutate(false)}>
                {t("friendDecline")}
              </Button>
            </>
          ) : null}
          {rel === "friends" || rel === "none" ? (
            <Button variant="outline" onClick={() => dmMut.mutate()}>
              {t("startDm")}
            </Button>
          ) : null}
          {rel !== "blocked" ? (
            <Button variant="ghost" onClick={() => blockMut.mutate()}>
              {t("block")}
            </Button>
          ) : (
            <p className="text-sm text-muted">{t("block")}</p>
          )}
          <Button variant="ghost" onClick={() => setShowReport((v) => !v)}>
            {t("report")}
          </Button>
        </div>
      ) : (
        <Button asChild variant="outline">
          <Link to="/login">{t("signIn")}</Link>
        </Button>
      )}

      {showReport ? (
        <form
          className="space-y-3 rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]"
          onSubmit={(e) => {
            e.preventDefault();
            reportMut.mutate();
          }}
        >
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="h-11 w-full rounded-md bg-raised px-3 text-sm text-fg shadow-[var(--shadow-border)]"
          >
            <option value="spam">{t("reportSpam")}</option>
            <option value="abuse">{t("reportAbuse")}</option>
            <option value="cheat">{t("reportCheat")}</option>
            <option value="other">{t("reportOther")}</option>
          </select>
          <Textarea
            value={reportBody}
            onChange={(e) => setReportBody(e.target.value)}
            maxLength={400}
          />
          <Button type="submit" disabled={reportMut.isPending}>
            {t("report")}
          </Button>
        </form>
      ) : null}
    </main>
  );
}
