/** English (base) locale. All user-facing copy lives here, never inline. */
export const en = {
  common: {
    brand: "StayBoost",
    tagline: "The AI-Powered Hospitality Growth Operating System",
    nav: {
      features: "Features",
      pricing: "Pricing",
      analyzer: "Free Analyzer",
      contact: "Contact",
      login: "Log in",
      signup: "Get started",
    },
    footer: {
      product: "Product",
      company: "Company",
      legal: "Legal",
      rights: "All rights reserved.",
      builtFor: "Built for homestays, villas, resorts, hotels & property managers.",
    },
    cta: {
      analyzeProperty: "Analyze my property",
      startFree: "Start free",
      seePricing: "See pricing",
    },
  },
  landing: {
    hero: {
      eyebrow: "AI Growth OS for hospitality",
      title: "Turn every empty night into revenue.",
      subtitle:
        "StayBoost connects to the tools you already use and puts an AI growth team to work — pricing, guest messaging, reviews and operations — so you book more, earn more and do less.",
      primaryCta: "Analyze my property — free",
      secondaryCta: "See how it works",
      trust: "No credit card required. Get your growth report in under 2 minutes.",
    },
    pillars: {
      title: "One operating system. Four ways to grow.",
      subtitle: "Every insight comes with an action and the revenue it unlocks.",
      acquire: {
        title: "Acquire",
        body: "AI demand forecasting and dynamic pricing fill more nights at the right rate, across every channel.",
      },
      monetize: {
        title: "Monetize",
        body: "Upsells, packages and win-back campaigns lift revenue per guest automatically.",
      },
      automate: {
        title: "Automate",
        body: "A smart unified inbox and auto-messaging handle the busywork so your day shrinks to minutes.",
      },
      delight: {
        title: "Delight",
        body: "A 24/7 multilingual AI concierge and proactive service recovery earn you 5-star reviews.",
      },
    },
    loop: {
      title: "How StayBoost works",
      subtitle: "A compounding growth loop that gets smarter every day.",
      steps: [
        { title: "Connect", body: "Link your PMS, channel manager or OTAs — or add a property in two minutes." },
        { title: "Analyze", body: "AI reads your demand, pricing, reviews and guest signals to find the gaps." },
        { title: "Act", body: "Approve AI recommendations — pricing, messages, upsells — with one tap." },
        { title: "Grow", body: "Measure the uplift. Every outcome trains a sharper next recommendation." },
      ],
    },
    analyzerTeaser: {
      title: "See your growth opportunities — before you sign up.",
      body: "Tell us about your property and our AI will return a personalized growth report: pricing gaps, revenue upside and quick wins across all four pillars.",
      cta: "Run the free analyzer",
    },
    pricingTeaser: {
      title: "Pricing that scales with your success.",
      body: "Start free. Upgrade as you grow. Property managers get a portfolio command center.",
      cta: "Compare plans",
    },
    finalCta: {
      title: "Ready to boost your bookings?",
      body: "Join the hosts and hoteliers letting AI do the heavy lifting.",
      primary: "Analyze my property",
      secondary: "Talk to us",
    },
  },
} as const;

export type Dictionary = typeof en;
