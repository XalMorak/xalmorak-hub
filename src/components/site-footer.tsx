import { Link } from "@tanstack/react-router";
import { InstallHint } from "@/components/install-hint";
import { LogoMark } from "@/components/logo";
import { useI18n } from "@/lib/locale";

export function SiteFooter() {
  const { t } = useI18n();
  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-end sm:justify-between sm:px-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-fg">
            <LogoMark className="size-5" />
            <span className="font-display text-lg">{t("brand")}</span>
          </div>
          <p className="max-w-sm text-sm leading-normal text-muted">{t("footer")}</p>
          <InstallHint />
        </div>
        <div className="flex flex-wrap gap-5 text-sm text-muted">
          <Link to="/games" className="hover:text-fg">
            {t("navGames")}
          </Link>
          <Link to="/party" className="hover:text-fg">
            {t("navParty")}
          </Link>
          <Link to="/board" className="hover:text-fg">
            {t("navBoard")}
          </Link>
          <Link to="/friends" className="hover:text-fg">
            {t("navFriends")}
          </Link>
          <Link to="/wishlist" className="hover:text-fg">
            {t("navWish")}
          </Link>
          <Link to="/login" className="hover:text-fg">
            {t("signIn")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
