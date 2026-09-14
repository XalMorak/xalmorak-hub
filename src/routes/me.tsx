import { useEffect, useRef, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { fileToDataUrl } from "@/components/safe-media";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SignInGate } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { AVATAR_MAX } from "@/lib/media-limits";
import { useI18n } from "@/lib/locale";
import { REGIONS } from "@/lib/regions";
import { getProfile, saveProfile } from "@/lib/social";

export const Route = createFileRoute("/me")({
  component: MePage,
});

function MePage() {
  const { t, locale } = useI18n();
  const { user } = useCurrentUserState();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const profile = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => getProfile({ data: { userId: user!.id } }),
    enabled: Boolean(user?.id),
  });
  const [bio, setBio] = useState("");
  const [region, setRegion] = useState("mn");
  const [avatar, setAvatar] = useState<string>();

  useEffect(() => {
    if (!profile.data) return;
    setBio(profile.data.bio);
    setRegion(profile.data.region);
  }, [profile.data]);

  const save = useMutation({
    mutationFn: () => saveProfile({ data: { bio, region, avatar } }),
    onSuccess: () => {
      toast.success(t("profileSave"));
      setAvatar(undefined);
      void queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    save.mutate();
  }

  return (
    <main className="mx-auto w-full max-w-xl flex-1 space-y-6 px-4 py-8 sm:px-6">
      <header className="space-y-2">
        <p className="text-xs font-medium tracking-[0.18em] text-muted uppercase">
          {t("navMe")}
        </p>
        <h1 className="font-display text-4xl tracking-tight text-fg">{t("profileTitle")}</h1>
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
        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-xl bg-surface p-5 shadow-[var(--shadow-border)]"
        >
          <div className="flex items-center gap-4">
            {(avatar || profile.data?.avatar) ? (
              <img
                src={avatar || profile.data?.avatar || ""}
                alt=""
                className="size-16 rounded-full object-cover"
              />
            ) : (
              <span className="grid size-16 place-items-center rounded-full bg-raised text-lg text-fg">
                {(profile.data?.name ?? "?").charAt(0)}
              </span>
            )}
            <div>
              <p className="text-sm font-medium text-fg">{profile.data?.name}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => fileRef.current?.click()}
              >
                {t("profileAvatar")}
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (!file) return;
                  void fileToDataUrl(file, AVATAR_MAX)
                    .then(setAvatar)
                    .catch(() => toast.error(t("fileRejected")));
                }}
              />
            </div>
          </div>
          <label className="block space-y-2">
            <span className="text-sm text-muted">{t("profileBio")}</span>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={280}
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm text-muted">{t("profileRegion")}</span>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="h-11 w-full rounded-md bg-raised px-3 text-sm text-fg shadow-[var(--shadow-border)]"
            >
              {REGIONS.map((r) => (
                <option key={r.id} value={r.id}>
                  {locale === "mn" ? r.mn : r.en}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? t("saving") : t("profileSave")}
            </Button>
            <Button asChild variant="outline">
              <Link to="/friends">{t("navFriends")}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/wishlist">{t("navWish")}</Link>
            </Button>
          </div>
        </form>
      </SignInGate>
    </main>
  );
}
