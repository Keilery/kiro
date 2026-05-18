import { Hero } from "@/components/hero/Hero";
import { MarketplacePreview } from "@/components/home/MarketplacePreview";
import { AutomationShowcase } from "@/components/home/AutomationShowcase";
import { ModulesGrid } from "@/components/home/ModulesGrid";
import { CTA } from "@/components/home/CTA";

export default function HomePage() {
  return (
    <>
      <Hero />
      <MarketplacePreview />
      <AutomationShowcase />
      <ModulesGrid />
      <CTA />
    </>
  );
}
