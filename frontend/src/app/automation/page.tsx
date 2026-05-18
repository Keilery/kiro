import { PageShell } from "@/components/common/PageShell";
import { AutomationShowcase } from "@/components/home/AutomationShowcase";

export default function AutomationPage() {
  return (
    <PageShell
      eyebrow="Модуль 4 · 60 функций"
      title="Автоматизация"
      description="FunPay, Starvell, Playerok. Парсинг заказов, авто-ответы, авто-поднятие лотов, синхронизация цен, динамическое ценообразование, Telegram/Discord уведомления."
    >
      <AutomationShowcase />
    </PageShell>
  );
}
