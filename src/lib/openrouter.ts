import { Service } from "@prisma/client";

// ---------------------------------------------------------------------------
// The existing codebase (generateProposal.ts) maps AI output to database
// columns using this shape. We keep it identical so nothing else needs to
// change downstream.
// ---------------------------------------------------------------------------
export interface AIProposalOutput {
  proposal_title: string;
  problem_headline: string;
  problem_description: string;
  bottlenecks: string[];
  solution_headline: string;
  solution_description: string;
  solution_outcome: string;
  forecast: {
    leads: string;
    reach: string;
    traffic: string;
    roi: string;
    cost_per_lead: string;
  };
  process_steps: string[];
  deliverables: string[];
  roi_statement: string;
  next_steps: string[];
}

// ---------------------------------------------------------------------------
// Env helper
// ---------------------------------------------------------------------------
function env(name: string, fallback?: string): string {
  const val = process.env[name];
  if (val) return val;
  if (fallback !== undefined) return fallback;
  throw new Error(`Missing required environment variable: ${name}`);
}

// ---------------------------------------------------------------------------
// System prompt — the elite B2B copywriter prompt the user provided,
// adapted so the JSON keys match the AIProposalOutput interface above.
// ---------------------------------------------------------------------------
const SYSTEM_PROMPT = `You are an elite B2B marketing strategist and conversion copywriter working inside an automated proposal-generation system for a digital marketing agency. You write high-end, persuasive service proposals that close deals.

Your ONLY job is to take the structured client brief and return a single valid JSON object that populates a pre-designed proposal template. You do not chat. You do not explain. You output JSON.

==================================================
ABSOLUTE OUTPUT RULES (NON-NEGOTIABLE)
==================================================
1. Output ONLY a single valid JSON object. Nothing before it, nothing after it.
2. NO markdown. NO \`\`\`json fences. NO commentary. NO "Here is...". NO notes.
3. Use ONLY the exact keys defined in the SCHEMA below. Do not add, rename, or remove keys.
4. Every string must be plain text (no markdown, no HTML, no emojis).
5. All numbers in copy must be realistic and internally consistent.
6. Never invent specific facts about the client you cannot infer. Inferences from their website/industry are allowed and encouraged; fabricated facts are forbidden.
7. If the brief is missing information, infer sensibly from the service type and industry. Never leave a field blank and never write "N/A" or "[insert]".
8. The currency for all money fields is whatever currency the provided pricing uses. If pricing has a symbol, match it.

==================================================
VOICE & STYLE
==================================================
- Confident, sharp, premium. You are the expert, not a vendor begging for work.
- Second person ("your studio", "your business"). Speak directly to the client.
- Short, punchy sentences. High signal, zero filler.
- Lead with the client's pain and desired outcome, not with your features.
- Be specific and concrete. Numbers, timeframes, and outcomes beat adjectives.
- Headlines are bold and declarative.
- Tie price to ROI: make the investment feel small next to the outcome.

==================================================
BENCHMARKS (use to ground forecasts)
==================================================
- Meta Ads / Google Ads: estimate reach, clicks, leads, cost-per-lead from the stated ad budget. Use realistic ranges. Performance compounds after 2-4 weeks.
- SEO: traffic growth, keyword rankings, conversions over 3-6 months. SEO is slower; do not promise instant leads.
- Social Media Marketing: reach, engagement, follower growth, inbound enquiries.
- CRM Automation / Email Marketing: time saved, lead response speed, recovered revenue, retention lift.
- Website Development / Branding: conversion-rate lift, credibility, lower bounce, higher close rate.
- Marketing Analytics & Tracking: clean attribution, lower wasted spend, better decisions.

==================================================
OUTPUT SCHEMA (return EXACTLY this shape)
==================================================
{
  "proposal_title": "A captivating proposal title",
  "problem_headline": "A short, impactful headline summarising the client challenge",
  "problem_description": "2-3 sentences detailing bottlenecks and competitive gaps",
  "bottlenecks": [
    "Specific bottleneck 1",
    "Specific bottleneck 2",
    "Specific bottleneck 3"
  ],
  "solution_headline": "Short headline describing the recommended service path",
  "solution_description": "2-3 sentences explaining how the service addresses core problems",
  "solution_outcome": "1-2 sentences outlining the primary expected outcome",
  "forecast": {
    "leads": "Estimated leads per month (e.g. 90 - 120 / month)",
    "reach": "Estimated reach/impressions (e.g. 40K - 80K / month)",
    "traffic": "Estimated clicks or visitors (e.g. 400 - 1,000 / month)",
    "roi": "Expected ROI statement",
    "cost_per_lead": "Estimated CPL with currency symbol"
  },
  "process_steps": [
    "Step 1 with detail",
    "Step 2 with detail",
    "Step 3 with detail",
    "Step 4 with detail",
    "Step 5 with detail"
  ],
  "deliverables": [
    "Deliverable 1",
    "Deliverable 2",
    "Deliverable 3",
    "Deliverable 4",
    "Deliverable 5"
  ],
  "roi_statement": "Compelling 2-sentence ROI summary",
  "next_steps": [
    "Next step 1",
    "Next step 2",
    "Next step 3"
  ]
}

==================================================
FINAL CHECK BEFORE YOU ANSWER
==================================================
- Is it ONLY the JSON object? (no fences, no text)
- Do the keys match the schema EXACTLY?
- Are there exactly 3 bottlenecks, 5 process_steps, 5 deliverables, 3 next_steps?
- Do all forecast/investment numbers agree with each other and the budget?
- Is every field filled with confident, on-brand copy?

Return the JSON now.`;

// ---------------------------------------------------------------------------
// Build the user prompt from proposal inputs
// ---------------------------------------------------------------------------
function buildUserPrompt(params: {
  clientName: string;
  clientWebsite: string;
  competitorWebsite: string;
  service: Service;
  goal: string;
  pricingInput: string;
  notes?: string;
}): string {
  return `Generate a customized proposal with the following client details:

{
  "client_business_name": "${params.clientName}",
  "client_website": "${params.clientWebsite}",
  "competitor_website": "${params.competitorWebsite}",
  "service": "${params.service.name}",
  "service_description": "${params.service.description}",
  "pricing": "${params.pricingInput}",
  "goal": "${params.goal}",
  "notes": "${params.notes ?? ""}"
}

${params.service.aiPrompt ? `Additional service instructions:\n${params.service.aiPrompt}` : ""}

Compare the client website with their competitor in the context of ${params.service.name}.
Identify specific weaknesses and opportunities. Return the JSON now.`;
}

// ---------------------------------------------------------------------------
// Core generator — drop-in replacement for the old Ollama function
// ---------------------------------------------------------------------------
export async function generateProposalContent(params: {
  clientName: string;
  clientWebsite: string;
  competitorWebsite: string;
  service: Service;
  goal: string;
  pricingInput: string;
  notes?: string;
}): Promise<AIProposalOutput> {
  const baseUrl = env("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1");
  const apiKey = env("OPENROUTER_API_KEY");
  const model = env("OPENROUTER_MODEL", "google/gemini-2.5-flash-lite");
  const mockEnabled = env("ENABLE_MOCK_FALLBACK", "false") === "true";

  console.log(`[OpenRouter] Generating proposal using model: ${model}`);

  const userPrompt = buildUserPrompt(params);

  const payload = {
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
    stream: false,
  };

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://smart-sales.app",
        "X-Title": "Smart Sales Proposal Generator",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(60_000), // 60 s timeout
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(
        `OpenRouter returned ${res.status}: ${errBody.slice(0, 500)}`
      );
    }

    const data = await res.json();
    const raw: string | undefined = data?.choices?.[0]?.message?.content;

    if (!raw) {
      throw new Error("Empty response from OpenRouter (no content in choices)");
    }

    // Strip markdown fences if the model accidentally wraps them
    let jsonString = raw.trim();
    if (jsonString.startsWith("```")) {
      jsonString = jsonString
        .replace(/^```(?:json)?\s*/, "")
        .replace(/\s*```$/, "");
    }

    // Parse — any error propagates up
    const parsed: AIProposalOutput = JSON.parse(jsonString);
    return validateAndClean(parsed, params.service);
  } catch (error) {
    console.error("[OpenRouter] Generation failed:", error);

    if (mockEnabled) {
      console.log("[OpenRouter] Mock fallback enabled — returning mock content.");
      return generateMockContent(params);
    }

    // Re-throw so the caller surfaces the real error
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Validation — fill any missing fields with safe defaults
// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function validateAndClean(data: any, service: Service): AIProposalOutput {
  const fb = getServiceDefaults(service.name);

  return {
    proposal_title:
      data.proposal_title || `Growth Proposal for ${service.name}`,
    problem_headline: data.problem_headline || "The Challenge",
    problem_description:
      data.problem_description ||
      "Current marketing assets are underperforming relative to market benchmarks.",
    bottlenecks:
      Array.isArray(data.bottlenecks) && data.bottlenecks.length > 0
        ? data.bottlenecks.slice(0, 3)
        : fb.bottlenecks,
    solution_headline:
      data.solution_headline || `Our Solution: Custom ${service.name}`,
    solution_description:
      data.solution_description ||
      `A targeted execution plan for ${service.name} optimized for conversions and growth.`,
    solution_outcome:
      data.solution_outcome ||
      "Sustained increase in high-quality customer acquisition.",
    forecast: {
      leads: data.forecast?.leads || fb.forecast.leads,
      reach: data.forecast?.reach || fb.forecast.reach,
      traffic: data.forecast?.traffic || fb.forecast.traffic,
      roi: data.forecast?.roi || fb.forecast.roi,
      cost_per_lead: data.forecast?.cost_per_lead || fb.forecast.cost_per_lead,
    },
    process_steps:
      Array.isArray(data.process_steps) && data.process_steps.length > 0
        ? data.process_steps.slice(0, 5)
        : fb.process_steps,
    deliverables:
      Array.isArray(data.deliverables) && data.deliverables.length > 0
        ? data.deliverables.slice(0, 5)
        : fb.deliverables,
    roi_statement:
      data.roi_statement ||
      "This campaign provides a clear pathway to scale acquisitions with measurable returns.",
    next_steps:
      Array.isArray(data.next_steps) && data.next_steps.length > 0
        ? data.next_steps.slice(0, 3)
        : fb.next_steps,
  };
}

// ---------------------------------------------------------------------------
// Mock content (only used when ENABLE_MOCK_FALLBACK=true)
// ---------------------------------------------------------------------------
function generateMockContent(params: {
  clientName: string;
  clientWebsite: string;
  competitorWebsite: string;
  service: Service;
  goal: string;
  pricingInput: string;
  notes?: string;
}): AIProposalOutput {
  const defaults = getServiceDefaults(params.service.name);
  const cleanComp = params.competitorWebsite.replace(/https?:\/\/(www\.)?/, "");

  return {
    proposal_title: `Digital Growth Proposal: ${params.service.name} Campaign for ${params.clientName}`,
    problem_headline: `Why ${params.clientName} is Losing Digital Market Share to ${cleanComp}`,
    problem_description: `Based on a competitive analysis between ${params.clientWebsite} and ${params.competitorWebsite}, ${params.clientName} lacks key optimization pillars in ${params.service.name}, resulting in higher acquisition costs and lower conversion rates.`,
    bottlenecks: defaults.bottlenecks.map((b) =>
      b.replace("Competitor", cleanComp)
    ),
    solution_headline: `Custom ${params.service.name} Strategy to Scale Lead Generation`,
    solution_description: `Our team will deploy a robust, end-to-end ${params.service.name} strategy tailored to ${params.clientName}'s specific goal: '${params.goal}'. This includes complete technical integration, creative production, and daily bid optimizations.`,
    solution_outcome: `Establish ${params.clientName} as the market leader in search visibility and organic conversions.`,
    forecast: defaults.forecast,
    process_steps: defaults.process_steps,
    deliverables: JSON.parse(params.service.deliverables || "[]").slice(0, 5),
    roi_statement: `By optimizing ${params.service.name}, ${params.clientName} can expect to unlock high-intent traffic streams, compounding lead generation efficiency while maintaining a healthy cost of acquisition.`,
    next_steps: defaults.next_steps,
  };
}

// ---------------------------------------------------------------------------
// Service-specific fallback defaults
// ---------------------------------------------------------------------------
function getServiceDefaults(serviceName: string) {
  const s = serviceName.toLowerCase();

  if (s.includes("meta ads")) {
    return {
      bottlenecks: [
        "Inability to retarget warm site traffic, resulting in lost conversions.",
        "High ad fatigue and rising CPC due to lack of creative refreshes.",
        "Under-optimized conversion tracking leading to poor algorithmic learning.",
      ],
      forecast: {
        leads: "+45 Leads / month",
        reach: "45,000 - 60,000 impressions / month",
        traffic: "+2,200 visitors / month",
        roi: "3.5x - 4.5x ROAS",
        cost_per_lead: "$25.00 - $35.00",
      },
      process_steps: [
        "Phase 1: Deep tracking audit and custom pixel event configuration.",
        "Phase 2: Developing audience buyer personas and drafting ad copy.",
        "Phase 3: Visual asset creation, video splicing, and initial campaign launch.",
        "Phase 4: Split-testing creatives and refining demographic targeting.",
        "Phase 5: Monthly scale-up of top performing ad sets.",
      ],
      deliverables: [
        "Facebook Pixel & Conversion API setup",
        "Audience segment building (lookalike & retargeting)",
        "Copywriting & Graphic design for 6 ad variations",
        "A/B split test execution",
        "Weekly reporting dashboards",
      ],
      next_steps: [
        "Approve proposal & choose pricing structure",
        "Complete technical questionnaire & share Meta Business Manager access",
        "Schedule 45-minute kickoff call with the strategy team",
      ],
    };
  }

  if (s.includes("google ads")) {
    return {
      bottlenecks: [
        "Wasted ad spend on broad-match terms without negative keyword exclusions.",
        "Poor Quality Scores driving up bids and pushing ads below the fold.",
        "Ineffective Google Merchant Center integrations for primary products.",
      ],
      forecast: {
        leads: "+38 Conversions / month",
        reach: "30,000 - 45,000 search views / month",
        traffic: "+1,800 visitors / month",
        roi: "4.0x ROI",
        cost_per_lead: "$30.00 - $40.00",
      },
      process_steps: [
        "Phase 1: Keyword mining, search intent mapping, and competitor ad audit.",
        "Phase 2: Building campaign structures (Search + Performance Max).",
        "Phase 3: Copywriting responsive search ads and mapping extensions.",
        "Phase 4: Negative keyword implementation and conversion check.",
        "Phase 5: Bid strategy tweaks (Target CPA / Maximize Conversions).",
      ],
      deliverables: [
        "Comprehensive keyword research & grouping",
        "Responsive Search Ads design & extensions setup",
        "Negative keyword list compilation",
        "Smart Bidding strategy setup",
        "Weekly optimization & monthly review calls",
      ],
      next_steps: [
        "Approve proposal & finalize Google Ads budget",
        "Grant Google Ads client-account manager access",
        "Participate in the onboarding strategy briefing",
      ],
    };
  }

  // General fallback
  return {
    bottlenecks: [
      "Lack of structural visibility online compared to Competitor.",
      "Outdated lead capture systems driving conversion rates below 1.5%.",
      "No automated sequences to nurture prospects once they interact.",
    ],
    forecast: {
      leads: "+25% increase in lead generation",
      reach: "+30% brand visibility increase",
      traffic: "+1,500 new monthly visits",
      roi: "300% - 400% ROI",
      cost_per_lead: "N/A",
    },
    process_steps: [
      "Phase 1: Discovery, site audit, and competitor benchmarking.",
      "Phase 2: Structural mapping, copy generation, and staging.",
      "Phase 3: Implementing changes and launch execution.",
      "Phase 4: Optimization, post-launch checks, and analytics review.",
      "Phase 5: Weekly tweaks, monthly dashboards, and next phase expansion.",
    ],
    deliverables: [
      "Initial optimization audit and report",
      "Setup of custom triggers and event analytics",
      "Implementation of core service structures",
      "Custom copy revisions and assets creation",
      "Monthly performance insights call",
    ],
    next_steps: [
      "Approve proposal options and sign digital service contract",
      "Provide necessary website admin and analytics credentials",
      "Schedule the 45-minute technical kickoff call",
    ],
  };
}
