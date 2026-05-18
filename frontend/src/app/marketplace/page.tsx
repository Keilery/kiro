import { PageShell } from "@/components/common/PageShell";
import { MarketplacePreview } from "@/components/home/MarketplacePreview";

export default function MarketplacePage() {
  return (
    <PageShell
      eyebrow="Модуль 1 · 82 функции"
      title="Маркетплейс"
      description="Бесконечная прокрутка, фильтры, поиск с автодополнением, эскроу, диспуты, чат покупатель↔продавец, отзывы. Карта серверов для MMORPG."
    >
      <MarketplacePreview />
    </PageShell>
  );
}
