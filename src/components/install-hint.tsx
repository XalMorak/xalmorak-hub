import { useEffect, useState } from "react";
import { useI18n } from "@/lib/locale";

export function InstallHint() {
  const { t } = useI18n();
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    try {
      if (localStorage.getItem("xal-install-hide") === "1") return;
    } catch {
      return;
    }
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator && Boolean((navigator as { standalone?: boolean }).standalone));
    if (standalone) return;
    setHidden(false);
  }, []);

  if (hidden) return null;

  return (
    <a
      href="/?install=1"
      className="text-sm text-muted hover:text-fg"
      onClick={() => {
        try {
          localStorage.setItem("xal-install-hide", "1");
        } catch {
          /* ignore */
        }
      }}
    >
      {t("installApp")}
    </a>
  );
}
