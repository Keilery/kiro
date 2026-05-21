import { Hero } from "@/components/home/Hero";
import { OrbitCategories } from "@/components/home/OrbitCategories";
import { PopularGames } from "@/components/home/PopularGames";
import { LiveDeals } from "@/components/home/LiveDeals";
import { PlatformStats } from "@/components/home/PlatformStats";
import { Advantages } from "@/components/home/Advantages";
import { HowItWorks } from "@/components/home/HowItWorks";
import { CTASection } from "@/components/home/CTASection";

export default function HomePage() {
  return (
    <>
      <Hero />
      <OrbitCategories />
      <PopularGames />
      <LiveDeals />
      <PlatformStats />
      <Advantages />
      <HowItWorks />
      <CTASection />
    </>
  );
}
