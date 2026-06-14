"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createAndGenerateProposal } from "@/app/actions/generateProposal";
import { 
  Sparkles, 
  Globe, 
  DollarSign, 
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

interface ServiceOption {
  slug: string;
  name: string;
  description: string;
}

interface CreateProposalFormProps {
  services: ServiceOption[];
}

const GOAL_OPTIONS = [
  "Generate More Leads",
  "Increase Sales",
  "Improve SEO",
  "Increase Website Conversions",
  "Improve Brand Awareness",
  "Improve Customer Retention",
  "Automate Sales Process",
  "Increase Traffic",
  "Other"
];

const LOADING_STEPS = [
  "Fetching service template defaults & prompts...",
  "Simulating crawl of client website landing page...",
  "Analyzing competitor domain and digital footprint...",
  "Identifying conversion bottlenecks and marketing leakages...",
  "Assembling structured context for local LLM...",
  "Running DeepSeek-R1 AI generation engine...",
  "Calibrating financial models and ROI projections...",
  "Parsing JSON variables & finalizing proposal document..."
];

export default function CreateProposalForm({ services }: CreateProposalFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStepIdx, setLoadingStepIdx] = useState(0);

  // Form states
  const [clientName, setClientName] = useState("");
  const [clientWebsite, setClientWebsite] = useState("");
  const [competitorWebsite, setCompetitorWebsite] = useState("");
  const [serviceSlug, setServiceSlug] = useState(services[0]?.slug || "");
  const [goal, setGoal] = useState(GOAL_OPTIONS[0]);
  const [pricingInput, setPricingInput] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  // Cycle through loading steps during generation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGenerating) {
      interval = setInterval(() => {
        setLoadingStepIdx((prev) => {
          if (prev < LOADING_STEPS.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, 2500); // Shift description every 2.5s
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isGenerating]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic Validation
    if (!clientName.trim()) return setError("Client Business Name is required.");
    if (!clientWebsite.trim()) return setError("Client Website is required.");
    if (!competitorWebsite.trim()) return setError("Competitor Website is required.");
    if (!pricingInput.trim()) return setError("Pricing details are required.");

    setLoadingStepIdx(0);
    setIsGenerating(true);

    try {
      const res = await createAndGenerateProposal({
        clientName,
        clientWebsite,
        competitorWebsite,
        serviceSlug,
        goal,
        pricingInput,
        additionalNotes,
      });

      if (res.success && res.proposalId) {
        router.push(`/proposals/${res.proposalId}`);
      } else {
        setError(res.error || "An unexpected error occurred during generation.");
        setIsGenerating(false);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit proposal.");
      setIsGenerating(false);
    }
  };

  if (isGenerating) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#040407] px-6">
        {/* Glow Spheres */}
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] glow-purple opacity-30 pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] glow-blue opacity-20 pointer-events-none" />

        <div className="max-w-md w-full text-center relative z-10 space-y-8">
          {/* Spinner and Icon */}
          <div className="relative flex items-center justify-center">
            <div className="h-24 w-24 rounded-full border border-violet-500/20 flex items-center justify-center bg-violet-600/5 backdrop-blur-md">
              <Sparkles className="h-10 w-10 text-violet-400 animate-pulse" />
            </div>
            <Loader2 className="absolute h-32 w-32 text-violet-500/40 animate-spin stroke-[1.5]" />
          </div>

          {/* Heading */}
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Generating Strategy Proposal</h2>
            <p className="text-sm text-gray-400 mt-2 max-w-xs mx-auto">
              Our AI is compiling insights and structuring the proposal pages. This takes about 10-20 seconds.
            </p>
          </div>

          {/* Processing checklist */}
          <div className="glass-card rounded-2xl p-6 text-left border border-white/5 space-y-4">
            <div className="flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-violet-500 animate-ping" />
              <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider">
                Current AI Task
              </span>
            </div>
            <div className="text-sm font-medium text-gray-100 min-h-[40px] leading-relaxed">
              {LOADING_STEPS[loadingStepIdx]}
            </div>

            {/* Visual Timeline progress bar */}
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 rounded-full transition-all duration-500" 
                style={{ width: `${((loadingStepIdx + 1) / LOADING_STEPS.length) * 100}%` }}
              />
            </div>

            {/* Completed Tasks summary list */}
            <div className="pt-2 border-t border-white/5 space-y-2">
              {LOADING_STEPS.map((step, idx) => {
                if (idx < loadingStepIdx) {
                  return (
                    <div key={idx} className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
                      <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
                      <span className="line-through opacity-60 truncate">{step}</span>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-start gap-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-400">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold">Creation Error</h4>
            <p className="mt-0.5 text-rose-400/80">{error}</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Client Business Name */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-300 flex items-center gap-1.5">
            Client Business Name <span className="text-violet-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Acme Corp"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="w-full rounded-xl bg-white/[0.03] border border-white/5 px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
          />
        </div>

        {/* Required Service */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-300 flex items-center gap-1.5">
            Service Required <span className="text-violet-500">*</span>
          </label>
          <select
            value={serviceSlug}
            onChange={(e) => setServiceSlug(e.target.value)}
            className="w-full rounded-xl bg-[#0b0b10] border border-white/5 px-4 py-3 text-sm text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors appearance-none"
          >
            {services.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Client Website */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-300 flex items-center gap-1.5">
            Client Website URL <span className="text-violet-500">*</span>
          </label>
          <div className="relative">
            <Globe className="absolute left-4 top-3.5 h-4 w-4 text-gray-500" />
            <input
              type="text"
              required
              placeholder="e.g. acme.com"
              value={clientWebsite}
              onChange={(e) => setClientWebsite(e.target.value)}
              className="w-full rounded-xl bg-white/[0.03] border border-white/5 pl-11 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
            />
          </div>
        </div>

        {/* Competitor Website */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-300 flex items-center gap-1.5">
            Competitor Website URL <span className="text-violet-500">*</span>
          </label>
          <div className="relative">
            <Globe className="absolute left-4 top-3.5 h-4 w-4 text-gray-500" />
            <input
              type="text"
              required
              placeholder="e.g. competitor.com"
              value={competitorWebsite}
              onChange={(e) => setCompetitorWebsite(e.target.value)}
              className="w-full rounded-xl bg-white/[0.03] border border-white/5 pl-11 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
            />
          </div>
        </div>

        {/* Goal */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-300 flex items-center gap-1.5">
            Proposal Goal <span className="text-violet-500">*</span>
          </label>
          <select
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="w-full rounded-xl bg-[#0b0b10] border border-white/5 px-4 py-3 text-sm text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors appearance-none"
          >
            {GOAL_OPTIONS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        {/* Pricing Input */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-300 flex items-center gap-1.5">
            Service Pricing ($ Monthly or Setup) <span className="text-violet-500">*</span>
          </label>
          <div className="relative">
            <DollarSign className="absolute left-4 top-3.5 h-4 w-4 text-gray-500" />
            <input
              type="text"
              required
              placeholder="e.g. 1500 (or JSON custom: {'serviceCost':1200,'setupCost':500})"
              value={pricingInput}
              onChange={(e) => setPricingInput(e.target.value)}
              className="w-full rounded-xl bg-white/[0.03] border border-white/5 pl-11 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
            />
          </div>
          <span className="text-[10px] text-gray-500 block">
            Entering a number defines the Monthly Retainer; setup costs default from the service library.
          </span>
        </div>
      </div>

      {/* Additional Notes */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-300 flex items-center gap-1.5">
          Additional Notes & Focus Areas (Optional)
        </label>
        <textarea
          rows={4}
          placeholder="Enter notes about specific client preferences, background, ad history, or target demographics..."
          value={additionalNotes}
          onChange={(e) => setAdditionalNotes(e.target.value)}
          className="w-full rounded-xl bg-white/[0.03] border border-white/5 px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors resize-none"
        />
      </div>

      {/* Form Submission Controls */}
      <div className="pt-4 flex items-center justify-end gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2.5 rounded-xl border border-white/5 hover:bg-white/5 text-sm font-semibold text-gray-400 hover:text-white transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 hover:bg-violet-500 transition-all duration-200"
        >
          Generate with AI
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
