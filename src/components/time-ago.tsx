import { formatDistanceToNow } from "date-fns";
import { enUS, mn } from "date-fns/locale";
import { useI18n } from "@/lib/locale";

export function TimeAgo({ value }: { value: string }) {
  const { locale } = useI18n();
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return (
    <time dateTime={value} className="tabular-nums text-subtle">
      {formatDistanceToNow(date, {
        addSuffix: true,
        locale: locale === "en" ? enUS : mn,
      })}
    </time>
  );
}
