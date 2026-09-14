import { Link, useRouterState } from "@tanstack/react-router";
import { AuthSlot } from "@/components/auth-slot";
import { LogoMark } from "@/components/logo";
import { useI18n } from "@/lib/locale";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { t, locale, setLocale } = useI18n();

  const links = [
    { to: "/", label: t("navHome") },
    { to: "/games", label: t("navGames") },
    { to: "/lounge", label: t("navLounge") },
    { to: "/messages", label: t("navChat") },
    { to: "/wishlist", label: t("navWish") },
  ] as const;

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          to="/"
          className="flex min-w-0 items-center gap-2.5 text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <LogoMark />
          <span className="hidden truncate font-display text-lg tracking-tight sm:inline">
            {t("brand")}
          </span>
        </Link>
        <nav className="flex min-w-0 items-center gap-0.5 overflow-x-auto">
          {links.map((link) => {
            const active =
              link.to === "/"
                ? pathname === "/"
                : pathname === link.to || pathname.startsWith(`${link.to}/`);
            return (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "inline-flex h-11 shrink-0 items-center rounded-md px-2 text-sm transition-colors duration-150 sm:px-3",
                  active ? "text-fg" : "text-muted hover:text-fg",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setLocale(locale === "mn" ? "en" : "mn")}
            className="inline-flex h-11 items-center rounded-md px-2 text-xs font-medium text-muted hover:text-fg"
            aria-label="Language"
          >
            {locale === "mn" ? "EN" : "MN"}
          </button>
          <AuthSlot />
        </div>
      </div>
    </header>
  );
}
