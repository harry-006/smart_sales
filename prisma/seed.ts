import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting seed script...");

  // 1. Seed Users
  const admin = await prisma.user.upsert({
    where: { email: "admin@smartsales.com" },
    update: {},
    create: {
      email: "admin@smartsales.com",
      name: "Admin User",
      role: "ADMIN",
    },
  });
  console.log(`Created/found Admin user: ${admin.email}`);

  const sales = await prisma.user.upsert({
    where: { email: "sales@smartsales.com" },
    update: {},
    create: {
      email: "sales@smartsales.com",
      name: "Sales Rep",
      role: "SALES",
    },
  });
  console.log(`Created/found Sales user: ${sales.email}`);

  // 2. Seed Default Templates
  const defaultTemplate = await prisma.template.upsert({
    where: { id: "default-template-uuid" }, // we can upsert with any unique field, but here we can search by name
    update: {},
    create: {
      id: "default-template-uuid",
      name: "Standard Business Proposal",
      description: "A professional, multi-page proposal covering problem statements, solutions, deliverables, and investment breakdown.",
      layout: JSON.stringify([
        "cover",
        "problem",
        "bottlenecks",
        "solution",
        "forecast",
        "process",
        "deliverables",
        "investment",
        "next-steps"
      ]),
      isDefault: true,
    },
  });
  console.log(`Created/found Template: ${defaultTemplate.name}`);

  // 3. Seed Services Configuration
  const servicesData = [
    {
      name: "Meta Ads",
      slug: "meta-ads",
      description: "Targeted advertising campaigns on Facebook & Instagram to drive high-converting traffic and leads.",
      deliverables: [
        "Pixel Installation & Domain Verification",
        "Custom & Lookalike Audience Building",
        "Ad Creative & Copywriting (3 variations per ad set)",
        "Daily Bid & Optimization Management",
        "Weekly Performance Reports & Monthly Review Calls"
      ],
      processSteps: [
        "Audit & Technical Integration (Setup Pixels, API, catalog)",
        "Target Audience Profiling & Copywriting Staging",
        "Ad Design, Copywriting & Initial Launch",
        "A/B Testing & Weekly Campaign Optimization",
        "Reporting & Scaling Winning Assets"
      ],
      pricingModel: {
        model: "monthly_retainer",
        defaultSetupCost: 1000,
        defaultMonthlyCost: 1500,
        defaultAdBudget: 2500
      },
      aiPrompt: "Generate a proposal focusing on Meta Ads lead gen. Formulate metrics: CPM (~$12), CTR (~1.5%), Conversion Rate (~4%). Calculate Forecast leads and cost per lead based on budget. Emphasize social proof, pixel tracking, and creative ad fatigue prevention."
    },
    {
      name: "Google Ads",
      slug: "google-ads",
      description: "Search, Shopping, and Display campaigns capturing high-intent search queries.",
      deliverables: [
        "Comprehensive Keyword & Competitor Research",
        "Google Merchant Center Feed Setup (for E-commerce)",
        "Negative Keyword List Setup (prevention of wasted budget)",
        "Responsive Search Ad Creation & Extension Mapping",
        "Smart Bidding Integration & Daily Optimization"
      ],
      processSteps: [
        "Competitor Ad Copy Audit & Keyword Mining",
        "Campaign Structuring (Search/PMax/Display)",
        "Conversion Actions & Tracking Setup",
        "Launch & Dynamic Search Ads Setup",
        "Bid Strategy Tweak & Negative Keyword Pruning"
      ],
      pricingModel: {
        model: "monthly_retainer",
        defaultSetupCost: 800,
        defaultMonthlyCost: 1200,
        defaultAdBudget: 3000
      },
      aiPrompt: "Generate a proposal focusing on Google Search & Performance Max ads. Use metrics: CTR (~4%), Conversion Rate (~5%). Emphasize search intent optimization, buying-intent keywords, and negative keyword lists to maximize ROI."
    },
    {
      name: "SEO",
      slug: "seo",
      description: "Organic search optimization to achieve page-one rankings for high-intent queries.",
      deliverables: [
        "Technical Website Audit & Schema Markup Setup",
        "On-Page Optimization (Titles, Meta descriptions, Headers)",
        "Monthly Content Cluster Delivery (4 high-quality articles)",
        "Backlink Outreach Program (5+ Domain Authority 30+ links/mo)",
        "Local SEO GMB/GBP Citation Building"
      ],
      processSteps: [
        "Deep Technical SEO Audit & Keyword Mapping",
        "Core Web Vitals & Site Speed Optimization",
        "On-Page and Content Architecture Implementation",
        "Off-Page Link Building & PR Outreach",
        "Rank Tracking & Monthly Content Adjustments"
      ],
      pricingModel: {
        model: "monthly_retainer",
        defaultSetupCost: 1500,
        defaultMonthlyCost: 2000,
        defaultAdBudget: 0
      },
      aiPrompt: "Generate a proposal focusing on Search Engine Optimization. Focus on organic traffic, keywords ranking, domain authority, and technical optimization. Emphasize the compounding, long-term ROI of organic growth vs paid ads."
    },
    {
      name: "Social Media Marketing",
      slug: "social-media-marketing",
      description: "Organic content creation, brand building, and community management on social platforms.",
      deliverables: [
        "Monthly Content Calendar (12-15 curated posts)",
        "High-End Graphic Design & Video Reels Creation",
        "Captions, Hashtags, and Trend Optimization",
        "Direct Message (DM) & Comment Response Strategy",
        "Monthly Engagement & Reach Growth Dashboards"
      ],
      processSteps: [
        "Brand Guidelines & Tone of Voice Alignment",
        "Content Pillars Definition & Monthly Planning",
        "Asset Creation (Graphics, Reels, Stories)",
        "Scheduling, Copywriting & Direct Publishing",
        "Community Interactions & Growth Analytics"
      ],
      pricingModel: {
        model: "monthly_retainer",
        defaultSetupCost: 500,
        defaultMonthlyCost: 1800,
        defaultAdBudget: 0
      },
      aiPrompt: "Generate a proposal for Social Media Marketing. Emphasize brand awareness, profile aesthetics, content scheduling, and engagement metrics. Target organic reach and community building."
    },
    {
      name: "CRM Automation",
      slug: "crm-automation",
      description: "Setup, integration, and lead nurturing pipeline automation inside HubSpot or ActiveCampaign.",
      deliverables: [
        "CRM Selection & Visual Sales Pipeline Mapping",
        "Automated Welcome and Lead Nurturing Workflows",
        "Lead Scoring Logic Implementation",
        "Third-party integrations (Websites, Ads, Email)",
        "Sales Team Live Training Session"
      ],
      processSteps: [
        "Current Lead Flow & Friction Audit",
        "Sales Pipeline Flow Diagramming",
        "Workflow Automation & Trigger Configuration",
        "Data Hygiene Setup & System Integration",
        "Team Onboarding & CRM Documentation"
      ],
      pricingModel: {
        model: "flat_project_fee",
        defaultSetupCost: 3000,
        defaultMonthlyCost: 500,
        defaultAdBudget: 0
      },
      aiPrompt: "Generate a proposal for CRM Automation. Focus on automated follow-ups, lead pipeline visibility, reducing manual entry errors, and increasing conversion rates. Highlight lead scoring and trigger-based alerts."
    },
    {
      name: "Website Development",
      slug: "website-development",
      description: "Custom, lightning-fast Next.js or WordPress websites optimized for conversions.",
      deliverables: [
        "Figma Interactive Mockup Design",
        "Responsive Mobile-First Frontend Coding",
        "On-Page SEO Optimization & Fast Load Speeds",
        "Contact Forms & Marketing Tool Integrations",
        "30 Days Post-Launch Maintenance & Support"
      ],
      processSteps: [
        "Wireframing & Sitemap Planning",
        "Figma Mockup Design & Creative Feedback",
        "Development & Quality Assurance Staging",
        "Content Import & Pre-launch Checklist",
        "Server Deployment & Domain Setup"
      ],
      pricingModel: {
        model: "flat_project_fee",
        defaultSetupCost: 5000,
        defaultMonthlyCost: 300,
        defaultAdBudget: 0
      },
      aiPrompt: "Generate a website development proposal. Emphasize mobile response, page load speeds (Lighthouse scores), high-converting layouts, call to action placement, and reliable hosting. Use custom next.js stack details."
    },
    {
      name: "Branding",
      slug: "branding",
      description: "Visual identity design, logo, fonts, colors, and official brand guidelines.",
      deliverables: [
        "Primary Logo, Secondary Logo & Favicon Suite",
        "Typography & Curated Color Palette Guides",
        "Business Cards & Stationary Layout Design",
        "Comprehensive Brand Book Document",
        "Ready-to-Use Social Media Cover Templates"
      ],
      processSteps: [
        "Discovery Session & Brand Moodboard Selection",
        "Logo Design Explorations (3 distinct directions)",
        "Logo Selection & Refinements",
        "Collateral Design (Cards, Templates, Guide)",
        "Delivery of Vector Assets & Brand Book PDF"
      ],
      pricingModel: {
        model: "flat_project_fee",
        defaultSetupCost: 4000,
        defaultMonthlyCost: 0,
        defaultAdBudget: 0
      },
      aiPrompt: "Generate a branding proposal. Highlight the emotional connection of a brand, visual hierarchy, logo usage guidelines, and consistency across marketing channels. Emphasize standard guidelines."
    },
    {
      name: "Email Marketing",
      slug: "email-marketing",
      description: "Targeted newsletters, promotional campaigns, and trigger-based flow automations.",
      deliverables: [
        "Email Platform Setup & List Segmentation",
        "High-Converting Welcome Flow Setup",
        "Cart Abandonment / Lead Re-engagement Flows",
        "2 Broadcast Newsletters / Promotions per Month",
        "A/B Subject Line and Layout Testing"
      ],
      processSteps: [
        "ESP Account Configuration & Domain Authentication",
        "Automated Flow Logic Blueprinting",
        "Template Design & Custom Code Integration",
        "Content Drafting & Flow Activation",
        "List Hygiene & Campaign Performance Reports"
      ],
      pricingModel: {
        model: "monthly_retainer",
        defaultSetupCost: 1000,
        defaultMonthlyCost: 1200,
        defaultAdBudget: 0
      },
      aiPrompt: "Generate an Email Marketing proposal. Focus on list building, segmenting users, open rates (~25%), click rates (~3%), and automated revenue attribution. Emphasize lifecycle marketing."
    },
    {
      name: "Marketing Analytics & Tracking",
      slug: "marketing-analytics-and-tracking",
      description: "GA4, GTM, and custom dashboards giving full visibility into marketing campaigns.",
      deliverables: [
        "Google Analytics 4 Setup & Event Mapping",
        "Google Tag Manager Container Integration",
        "Custom interactive Looker Studio dashboard",
        "Conversion and Revenue attribution tracking",
        "Monthly Data Interpretation & Review Session"
      ],
      processSteps: [
        "Current Analytics Setup & Tagging Audit",
        "GTM Architecture Planning & Trigger Definition",
        "Analytics Configuration & Event Debugging",
        "Looker Studio Dashboard Styling",
        "Final Integration QA & Data Validation"
      ],
      pricingModel: {
        model: "flat_project_fee",
        defaultSetupCost: 1500,
        defaultMonthlyCost: 200,
        defaultAdBudget: 0
      },
      aiPrompt: "Generate a proposal focusing on Analytics & Tracking. Highlight the danger of 'flying blind' without proper data tracking. Talk about GA4 configuration, Google Tag Manager trigger setups, Looker Studio charts, and conversion event tracking."
    }
  ];

  for (const s of servicesData) {
    const service = await prisma.service.upsert({
      where: { slug: s.slug },
      update: {
        description: s.description,
        deliverables: JSON.stringify(s.deliverables),
        processSteps: JSON.stringify(s.processSteps),
        pricingModel: JSON.stringify(s.pricingModel),
        aiPrompt: s.aiPrompt,
      },
      create: {
        name: s.name,
        slug: s.slug,
        description: s.description,
        deliverables: JSON.stringify(s.deliverables),
        processSteps: JSON.stringify(s.processSteps),
        pricingModel: JSON.stringify(s.pricingModel),
        aiPrompt: s.aiPrompt,
      },
    });
    console.log(`Created/found Service: ${service.name}`);
  }

  console.log("Database seed completed successfully.");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
