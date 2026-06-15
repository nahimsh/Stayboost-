import type { Metadata } from "next";
import { Hero } from "@/components/marketing/hero";
import { Pillars } from "@/components/marketing/pillars";
import { GrowthLoop } from "@/components/marketing/growth-loop";
import { CtaBand } from "@/components/marketing/cta-band";

export const metadata: Metadata = {
  description:
    "StayBoost is the AI-powered hospitality growth operating system. More bookings, more revenue, automated operations and happier guests.",
  alternates: { canonical: "/" },
};

export default function HomePage(): React.JSX.Element {
  return (
    <>
      <Hero />
      <Pillars />
      <GrowthLoop />
      <CtaBand />
    </>
  );
}
