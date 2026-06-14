import { Service } from "@prisma/client";

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

const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://localhost:11434";

/**
 * Checks if Ollama is running and returns the first available model name,
 * or null if Ollama is offline or has no models installed.
 */
export async function getOllamaModel(): Promise<string | null> {
  try {
    const res = await fetch(`${OLLAMA_HOST}/api/tags`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(2000), // 2 seconds timeout to keep it snappy
    });

    if (!res.ok) return null;

    const data = await res.json();
    const models = data.models || [];
    if (models.length === 0) return null;

    // Preference: deepseek-r1, llama3, mistral, then anything else
    const names = models.map((m: { name: string }) => m.name.toLowerCase());
    
    const preferred = ["deepseek-r1", "llama3", "mistral"];
    for (const pref of preferred) {
      const found = names.find((n: string) => n.startsWith(pref));
      if (found) {
        // Return original case name from models array
        const originalModel = models.find((m: { name: string }) => m.name.toLowerCase() === found);
        return originalModel ? originalModel.name : found;
      }
    }

    return models[0].name; // fallback to the first model
  } catch (error) {
    console.log("Ollama connection failed or timeout. Using mock fallback.", error);
    return null;
  }
}

/**
 * Generates proposal variables using local Ollama if available,
 * otherwise falls back to a high-quality mock generator.
 */
export async function generateProposalContent(params: {
  clientName: string;
  clientWebsite: string;
  competitorWebsite: string;
  service: Service;
  goal: string;
  pricingInput: string;
  notes?: string;
}): Promise<AIProposalOutput> {
  const model = await getOllamaModel();

  if (!model) {
    console.log("No Ollama instance or models detected. Generating mock proposal content...");
    return generateMockProposalContent(params);
  }

  console.log(`Ollama detected. Generating proposal using model: ${model}`);

  const systemPrompt = `You are an expert digital marketing and services sales consultant.
You generate high-impact, professional, client-ready business proposals.
You MUST output your response in raw JSON format matching this schema exactly.
Do not output any introductory or concluding text, only the JSON object.

JSON Schema:
{
  "proposal_title": "A captivating, professional proposal title",
  "problem_headline": "A short, impactful headline summarizing the client's current challenge",
  "problem_description": "A 2-3 sentence description detailing the specific market or website bottlenecks the client is facing based on the comparison with their competitor",
  "bottlenecks": [
    "Specific bottleneck 1 (e.g., poor Google search visibility relative to competitor)",
    "Specific bottleneck 2 (e.g., website conversions leaking due to slow load speed)",
    "Specific bottleneck 3 (e.g., lack of automated follow-ups for warm leads)"
  ],
  "solution_headline": "A short, professional headline describing the recommended service path",
  "solution_description": "A 2-3 sentence description explaining how our service addresses their core bottleneck, utilizing best practices",
  "solution_outcome": "A 1-2 sentence statement outlining the primary expected outcome of the solution",
  "forecast": {
    "leads": "Estimated leads generated per month (e.g. +35 Leads/mo or +45% YoY)",
    "reach": "Estimated reach/impressions (e.g. 50k - 100k views/mo)",
    "traffic": "Estimated website traffic (e.g. +2,500 visitors/mo)",
    "roi": "Expected Return on Investment (e.g. 3.5x ROI or 400% ROI)",
    "cost_per_lead": "Estimated cost per lead (e.g. $15 - $25 or N/A)"
  },
  "process_steps": [
    "Step 1: Setup & Audit details (e.g., Integrating GA4 & Event Triggers)",
    "Step 2: Strategy & Staging (e.g., Creative design & keyword mapping)",
    "Step 3: Execution (e.g., Ad launch or content creation)",
    "Step 4: Optimization (e.g., A/B testing & pruning)",
    "Step 5: Scaling & Reporting (e.g., Expanding budgets & monthly check-ins)"
  ],
  "deliverables": [
    "Deliverable 1 with detail",
    "Deliverable 2 with detail",
    "Deliverable 3 with detail",
    "Deliverable 4 with detail",
    "Deliverable 5 with detail"
  ],
  "roi_statement": "A compelling 2-sentence summary outlining why this investment represents a high-return opportunity for their business",
  "next_steps": [
    "Step 1: Sign the Agreement and approve the pricing options",
    "Step 2: Schedule the 45-minute technical onboarding kickoff call",
    "Step 3: Provide access to assets, pixels, website, or marketing channels"
  ]
}`;

  const userPrompt = `Generate a customized proposal content with the following client details:
- Client Name: ${params.clientName}
- Client Website: ${params.clientWebsite}
- Competitor Website: ${params.competitorWebsite}
- Required Service: ${params.service.name} (Service Details: ${params.service.description})
- Proposal Goal: ${params.goal}
- Pricing Inputs: ${params.pricingInput}
- Additional Notes: ${params.notes || "None"}

Specific Service Instructions:
${params.service.aiPrompt || ""}

Compare the client's website (${params.clientWebsite}) with their competitor (${params.competitorWebsite}) in the context of the requested service (${params.service.name}).
Identify specific weaknesses in the client's current setup and opportunities to win.
Ensure the forecast numbers make mathematical sense based on the service cost.`;

  try {
    const res = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: model,
        prompt: `System: ${systemPrompt}\n\nUser: ${userPrompt}\n\nResponse (JSON only):`,
        format: "json",
        stream: false,
        options: {
          temperature: 0.7,
        }
      }),
    });

    if (!res.ok) {
      throw new Error(`Ollama returned status ${res.status}`);
    }

    const data = await res.json();
    let text = data.response || "";

    // DeepSeek-R1 handles reasoning. It may output text like "<think>...</think>{JSON}".
    // Let's strip the think tags using Regex.
    if (text.includes("<think>")) {
      text = text.replace(/<think>[\s\S]*?<\/think>/, "").trim();
    }

    // Attempt to parse the JSON
    try {
      const parsed: AIProposalOutput = JSON.parse(text);
      return validateAndCleanOutput(parsed, params.service);
    } catch (parseErr) {
      console.error("Failed to parse JSON response from Ollama. Raw response was:", text);
      // Let's see if we can extract JSON using regex if Ollama added wrapper formatting
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed: AIProposalOutput = JSON.parse(jsonMatch[0]);
        return validateAndCleanOutput(parsed, params.service);
      }
      throw parseErr;
    }
  } catch (error) {
    console.error("Error generating proposal content with Ollama:", error);
    return generateMockProposalContent(params);
  }
}

/**
 * Validates that all fields are populated, filling missing fields with fallbacks
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function validateAndCleanOutput(data: any, service: Service): AIProposalOutput {
  const fallback = getMockServiceDefaults(service.name);
  
  return {
    proposal_title: data.proposal_title || `Growth Proposal for ${service.name}`,
    problem_headline: data.problem_headline || "The Challenge",
    problem_description: data.problem_description || "Current marketing assets and configurations are underperforming relative to market benchmarks.",
    bottlenecks: Array.isArray(data.bottlenecks) && data.bottlenecks.length > 0
      ? data.bottlenecks.slice(0, 3)
      : fallback.bottlenecks,
    solution_headline: data.solution_headline || `Our Solution: Custom ${service.name}`,
    solution_description: data.solution_description || `A targeted execution plan for ${service.name} optimized for conversions and growth.`,
    solution_outcome: data.solution_outcome || "Achieving sustained increase in high-quality customer acquisition channels.",
    forecast: {
      leads: data.forecast?.leads || fallback.forecast.leads,
      reach: data.forecast?.reach || fallback.forecast.reach,
      traffic: data.forecast?.traffic || fallback.forecast.traffic,
      roi: data.forecast?.roi || fallback.forecast.roi,
      cost_per_lead: data.forecast?.cost_per_lead || fallback.forecast.cost_per_lead
    },
    process_steps: Array.isArray(data.process_steps) && data.process_steps.length > 0
      ? data.process_steps.slice(0, 5)
      : fallback.process_steps,
    deliverables: Array.isArray(data.deliverables) && data.deliverables.length > 0
      ? data.deliverables.slice(0, 5)
      : fallback.deliverables,
    roi_statement: data.roi_statement || "This campaign provides a clear pathway to scale acquisitions with measurable returns.",
    next_steps: Array.isArray(data.next_steps) && data.next_steps.length > 0
      ? data.next_steps.slice(0, 3)
      : fallback.next_steps,
  };
}

/**
 * Fallback static mock generator based on service defaults
 */
function generateMockProposalContent(params: {
  clientName: string;
  clientWebsite: string;
  competitorWebsite: string;
  service: Service;
  goal: string;
  pricingInput: string;
  notes?: string;
}): AIProposalOutput {
  const defaults = getMockServiceDefaults(params.service.name);
  
  // Customizing default copy based on inputs
  const cleanClient = params.clientName;
  const cleanComp = params.competitorWebsite.replace(/https?:\/\/(www\.)?/, "");
  
  return {
    proposal_title: `Digital Growth Proposal: ${params.service.name} Campaign for ${cleanClient}`,
    problem_headline: `Why ${cleanClient} is Losing Digital Market Share to ${cleanComp}`,
    problem_description: `Based on a competitive analysis between ${params.clientWebsite} and ${params.competitorWebsite}, ${cleanClient} lacks key optimization pillars in ${params.service.name}, resulting in higher acquisition costs and lower conversion rates.`,
    bottlenecks: defaults.bottlenecks.map(b => b.replace("Competitor", cleanComp)),
    solution_headline: `Custom ${params.service.name} Strategy to Scale Lead Generation`,
    solution_description: `Our team will deploy a robust, end-to-end ${params.service.name} strategy tailored to ${cleanClient}'s specific goal: '${params.goal}'. This includes complete technical integration, creative production, and daily bid optimizations.`,
    solution_outcome: `Establish ${cleanClient} as the market leader in search visibility and organic conversions.`,
    forecast: defaults.forecast,
    process_steps: defaults.process_steps,
    deliverables: JSON.parse(params.service.deliverables || "[]").slice(0, 5),
    roi_statement: `By optimizing ${params.service.name}, ${cleanClient} can expect to unlock high-intent traffic streams, compounding lead generation efficiency while maintaining a healthy cost of acquisition.`,
    next_steps: defaults.next_steps,
  };
}

function getMockServiceDefaults(serviceName: string) {
  const service = serviceName.toLowerCase();
  
  if (service.includes("meta ads")) {
    return {
      bottlenecks: [
        "Inability to retarget warm site traffic, resulting in lost conversions.",
        "High ad fatigue and rising Cost Per Click (CPC) due to lack of creative refreshes.",
        "Under-optimized conversion tracking leading to poor algorithmic learning."
      ],
      forecast: {
        leads: "+45 Leads / month",
        reach: "45,000 - 60,000 impressions / month",
        traffic: "+2,200 visitors / month",
        roi: "3.5x - 4.5x ROAS",
        cost_per_lead: "$25.00 - $35.00"
      },
      process_steps: [
        "Phase 1: Deep tracking audit and custom pixel event configuration.",
        "Phase 2: Developing audience buyer personas and drafting ad copy.",
        "Phase 3: Visual asset creation, video splicing, and initial campaign launch.",
        "Phase 4: Split-testing creatives and refining demographic targeting.",
        "Phase 5: Monthly scale-up of top performing ad sets."
      ],
      deliverables: [
        "Facebook Pixel & Conversion API setup",
        "Audience segment building (lookalike & retargeting)",
        "Copywriting & Graphic design for 6 ad variations",
        "A/B split test execution",
        "Weekly reporting dashboards"
      ],
      next_steps: [
        "Approve proposal & choose pricing structure",
        "Complete technical questionnaire & share Meta Business Manager access",
        "Schedule 45-minute kickoff call with the strategy team"
      ]
    };
  }

  if (service.includes("google ads")) {
    return {
      bottlenecks: [
        "Wasted ad spend on broad-match terms without negative keyword exclusions.",
        "Poor Quality Scores driving up bids and pushing ads below the fold.",
        "Ineffective Google Merchant Center integrations for primary products."
      ],
      forecast: {
        leads: "+38 Conversions / month",
        reach: "30,000 - 45,000 search views / month",
        traffic: "+1,800 visitors / month",
        roi: "4.0x ROI",
        cost_per_lead: "$30.00 - $40.00"
      },
      process_steps: [
        "Phase 1: Keyword mining, search intent mapping, and competitor ad audit.",
        "Phase 2: Building campaign structures (Search + Performance Max).",
        "Phase 3: Copywriting responsive search ads and mapping extensions.",
        "Phase 4: Negative keyword implementation and conversion check.",
        "Phase 5: Bid strategy tweaks (Target CPA / Maximize Conversions)."
      ],
      deliverables: [
        "Comprehensive keyword research & grouping",
        "Responsive Search Ads design & extensions setup",
        "Negative keyword list compilation",
        "Smart Bidding strategy setup",
        "Weekly optimization & monthly review calls"
      ],
      next_steps: [
        "Approve proposal & finalize Google Ads budget",
        "Grant Google Ads client-account manager access",
        "Participate in the onboarding strategy briefing"
      ]
    };
  }

  // General fallback defaults for other services
  return {
    bottlenecks: [
      "Lack of structural visibility online compared to Competitor.",
      "Outdated lead capture systems driving conversion rates below 1.5%.",
      "No automated sequences to nurture prospects once they interact."
    ],
    forecast: {
      leads: "+25% increase in lead generation",
      reach: "+30% brand visibility increase",
      traffic: "+1,500 new monthly visits",
      roi: "300% - 400% ROI",
      cost_per_lead: "N/A"
    },
    process_steps: [
      "Phase 1: Discovery, site audit, and competitor benchmarking.",
      "Phase 2: Structural mapping, copy generation, and staging.",
      "Phase 3: Implementing changes and launch execution.",
      "Phase 4: Optimization, post-launch checks, and analytics review.",
      "Phase 5: Weekly tweaks, monthly dashboards, and next phase expansion."
    ],
    deliverables: [
      "Initial optimization audit and report",
      "Setup of custom triggers and event analytics",
      "Implementation of core service structures",
      "Custom copy revisions and assets creation",
      "Monthly performance insights call"
    ],
    next_steps: [
      "Approve proposal options and sign digital service contract",
      "Provide necessary website admin and analytics credentials",
      "Schedule the 45-minute technical kickoff call"
    ]
  };
}
