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
  pricing: {
    meta: {
      title: "Pricing",
      description:
        "Simple, per-property pricing that scales with your success. Start free, upgrade as you grow.",
    },
    hero: {
      title: "Pricing that scales with your success.",
      subtitle: "Start free. Upgrade as you grow. No credit card required to begin.",
    },
    billing: {
      monthly: "Monthly",
      annual: "Annual",
      save: "Save ~20%",
      toggleLabel: "Billing period",
    },
    units: {
      perProperty: "per property / month",
      free: "Free",
      custom: "Custom",
      billedAnnually: "billed annually",
      propertiesUpTo: "Up to {count} properties",
      propertyOne: "1 property",
      propertiesUnlimited: "Unlimited properties",
    },
    plans: {
      starter: {
        name: "Starter",
        tagline: "For a single homestay or villa just getting started.",
        cta: "Start free",
      },
      growth: {
        name: "Growth",
        tagline: "For growing hosts and small hotels ready to automate.",
        cta: "Start free trial",
      },
      pro: {
        name: "Pro",
        tagline: "For hotels and operators who want the full AI growth engine.",
        cta: "Start free trial",
        badge: "Most popular",
      },
      portfolio: {
        name: "Portfolio",
        tagline: "For property managers running a portfolio across owners.",
        cta: "Talk to sales",
      },
    },
    matrix: {
      title: "Compare every plan",
      caption: "StayBoost plan feature comparison",
      featureColumn: "Feature",
      rows: [
        {
          label: "Unified inbox + AI reply drafts",
          values: { starter: "Limited", growth: true, pro: true, portfolio: true },
        },
        {
          label: "Auto-messaging journeys",
          values: { starter: "Basic", growth: true, pro: true, portfolio: true },
        },
        {
          label: "AI review responses",
          values: { starter: "Limited", growth: true, pro: true, portfolio: true },
        },
        {
          label: "Dynamic pricing",
          values: { starter: false, growth: "Suggestions", pro: "Full + auto", portfolio: "Full + auto" },
        },
        {
          label: "Demand forecast & market intel",
          values: { starter: false, growth: "Basic", pro: true, portfolio: "+ Market intel" },
        },
        {
          label: "Direct booking funnel",
          values: { starter: false, growth: true, pro: true, portfolio: "+ White-label" },
        },
        {
          label: "24/7 AI concierge",
          values: { starter: false, growth: true, pro: true, portfolio: true },
        },
        {
          label: "Campaigns & upsells",
          values: { starter: false, growth: "Basic", pro: true, portfolio: true },
        },
        {
          label: "No-code automation builder",
          values: { starter: false, growth: false, pro: true, portfolio: true },
        },
        {
          label: "Portfolio command center",
          values: { starter: false, growth: false, pro: false, portfolio: true },
        },
        {
          label: "Owner statements (multi-owner)",
          values: { starter: false, growth: false, pro: false, portfolio: true },
        },
        {
          label: "Public API & webhooks",
          values: { starter: false, growth: "Limited", pro: true, portfolio: true },
        },
        {
          label: "Support",
          values: { starter: "Community", growth: "Email", pro: "Priority", portfolio: "Dedicated CSM" },
        },
      ],
    },
    faq: {
      title: "Frequently asked questions",
      items: [
        {
          q: "Do I need a credit card to start?",
          a: "No. The Starter plan is free forever and paid plans include a 14-day trial — no card required to begin.",
        },
        {
          q: "How does per-property pricing work?",
          a: "You pay per active property per month. Add or remove properties anytime; annual billing saves roughly 20%.",
        },
        {
          q: "What counts toward AI usage?",
          a: "Each plan includes a generous allowance of AI messages and actions. Heavy usage is metered transparently so you only pay for what you use.",
        },
        {
          q: "Can I manage many properties for different owners?",
          a: "Yes — the Portfolio plan adds a cross-property command center and per-owner statements, priced per unit.",
        },
      ],
    },
  },
  contact: {
    meta: {
      title: "Contact",
      description: "Talk to the StayBoost team about plans, partnerships or support.",
    },
    hero: {
      title: "Let's talk.",
      subtitle:
        "Questions about plans, a portfolio of properties, or a partnership? Send us a note and we'll get back to you fast.",
    },
    form: {
      name: "Your name",
      email: "Work email",
      company: "Company (optional)",
      propertyCount: "Number of properties (optional)",
      reason: "How can we help?",
      message: "Message",
      messagePlaceholder: "Tell us about your properties and what you'd like to achieve.",
      submit: "Send message",
      submitting: "Sending…",
      reasons: {
        sales: "Plans & pricing",
        support: "Product support",
        partnership: "Partnership",
        other: "Something else",
      },
    },
    success: {
      title: "Message sent",
      body: "Thanks for reaching out — we've emailed you a confirmation and will be in touch shortly.",
      again: "Send another message",
    },
    error: {
      generic: "Something went wrong sending your message. Please try again.",
      required: "Please fix the highlighted fields.",
    },
  },
} as const;

export type Dictionary = typeof en;
