import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { unreadNoticeCount } from "@/lib/social";
import { useI18n } from "@/lib/locale";

export function NoticeBell() {
  const { t } = useI18n();
  const { user, isPending } = useCurrentUserState();
  const count = useQuery({
    queryKey: ["notice-count"],
    queryFn: () => unreadNoticeCount(),
    enabled: Boolean(user) && !isPending,
    refetchInterval: 12000,
  });
  if (!user) return null;
  const n = count.data ?? 0;
  return (
    <Link
      to="/alerts"
      className="relative inline-flex size-11 items-center justify-center rounded-md text-muted hover:text-fg"
      aria-label={t("navAlerts")}
    >
      <Bell className="size-4" />
      {n > 0 ? (
        <span className="absolute top-2 right-2 grid min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-medium text-accent-fg">
          {n > 9 ? "9+" : n}
        </span>
      ) : null}
    </Link>
  );
}
