import { createFileRoute } from "@tanstack/react-router";
import { useI18n } from "@/lib/locale";

export const Route = createFileRoute("/messages/")({
  component: MessagesIndex,
});

function MessagesIndex() {
  const { t } = useI18n();
  return (
    <div className="grid h-full min-h-[28rem] place-items-center p-8">
      <p className="max-w-sm text-center text-sm leading-normal text-muted">
        {t("pickConversation")}
      </p>
    </div>
  );
}
