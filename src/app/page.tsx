import { db } from "@/lib/db";
import { SidebarLayout } from "@/components/SidebarLayout";
import Link from "next/link";
import { 
  FileText, 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  ArrowRight,
  Briefcase,
  Layers,
  Plus
} from "lucide-react";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";

// Simple client-side delete button handler
import DeleteButton from "@/components/DeleteButton";

export const revalidate = 0; // Disable caching for the dashboard

export default async function DashboardPage() {
  // Fetch proposals from database
  const proposals = await db.proposal.findMany({
    include: {
      service: true,
      generatedContent: true,
      user: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const services = await db.service.findMany();

  // Metrics calculations
  const totalProposals = proposals.length;

  let totalValue = 0;
  let proposalsThisMonthCount = 0;
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const serviceCounts: Record<string, number> = {};

  proposals.forEach((p) => {
    // 1. Calculate value
    if (p.generatedContent?.investmentDetails) {
      try {
        const pricing = JSON.parse(p.generatedContent.investmentDetails);
        totalValue += pricing.totalInvestment || 0;
      } catch {
        // Fallback if parsing fails
        totalValue += 0;
      }
    } else {
      // If AI hasn't run yet, read from raw service defaults
      try {
        const pricingModel = JSON.parse(p.service.pricingModel || "{}");
        const setup = pricingModel.defaultSetupCost ?? 0;
        const monthly = pricingModel.defaultMonthlyCost ?? 0;
        totalValue += setup + monthly;
      } catch {
        totalValue += 0;
      }
    }

    // 2. Monthly count
    if (p.createdAt >= firstDayOfMonth) {
      proposalsThisMonthCount++;
    }

    // 3. Service counts
    const sName = p.service.name;
    serviceCounts[sName] = (serviceCounts[sName] || 0) + 1;
  });

  const averageValue = totalProposals > 0 ? Math.round(totalValue / totalProposals) : 0;

  return (
    <SidebarLayout>
      <div className="space-y-8">
        {/* Welcome Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Proposal Pipeline
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Generate, edit, and export client proposals in under 2 minutes.
            </p>
          </div>
          <Link
            href="/proposals/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 hover:bg-violet-500 transition-all duration-200"
          >
            <Plus className="h-4 w-4" />
            Create Proposal
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Proposals */}
          <div className="glass-card rounded-2xl p-6 relative overflow-hidden transition-all duration-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-400">Total Proposals</span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
                <FileText className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-bold tracking-tight text-white">{totalProposals}</span>
              <span className="text-xs text-gray-500 block mt-1">All generated versions</span>
            </div>
          </div>

          {/* Total Value */}
          <div className="glass-card rounded-2xl p-6 relative overflow-hidden transition-all duration-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-400">Pipeline Value</span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-bold tracking-tight text-white">
                ${totalValue.toLocaleString()}
              </span>
              <span className="text-xs text-emerald-500 block mt-1">
                Total generated volume
              </span>
            </div>
          </div>

          {/* Average Value */}
          <div className="glass-card rounded-2xl p-6 relative overflow-hidden transition-all duration-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-400">Average Deal Size</span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-bold tracking-tight text-white">
                ${averageValue.toLocaleString()}
              </span>
              <span className="text-xs text-gray-500 block mt-1">Average per proposal</span>
            </div>
          </div>

          {/* This Month */}
          <div className="glass-card rounded-2xl p-6 relative overflow-hidden transition-all duration-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-400">Velocity This Month</span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Calendar className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-3xl font-bold tracking-tight text-white">
                +{proposalsThisMonthCount}
              </span>
              <span className="text-xs text-amber-500 block mt-1">Proposals created</span>
            </div>
          </div>
        </div>

        {/* Split Dashboard Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Proposals List */}
          <div className="lg:col-span-2 glass-card rounded-2xl p-6 border border-white/5">
            <div className="flex items-center justify-between pb-6 border-b border-white/5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers className="h-5 w-5 text-violet-400" />
                Recent Proposals
              </h2>
              <span className="text-xs text-gray-500 font-medium">
                Showing {totalProposals} entries
              </span>
            </div>

            {proposals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FileText className="h-12 w-12 text-gray-600 stroke-[1.5] mb-4" />
                <h3 className="text-base font-semibold text-gray-300">No proposals generated yet</h3>
                <p className="text-sm text-gray-500 max-w-sm mt-1">
                  Start by creating your first service proposal and let the AI generate strategies automatically.
                </p>
                <Link
                  href="/proposals/new"
                  className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600/10 border border-violet-500/20 px-4 py-2 text-sm font-semibold text-violet-400 hover:bg-violet-600/25 transition-all duration-200"
                >
                  Create Proposal
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-white/5 overflow-hidden">
                {proposals.map((proposal) => {
                  let statusColor = "bg-gray-500/10 text-gray-400 border-gray-500/20";
                  if (proposal.status === "GENERATED") {
                    statusColor = "bg-violet-500/10 text-violet-400 border-violet-500/20";
                  } else if (proposal.status === "GENERATING") {
                    statusColor = "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse";
                  } else if (proposal.status === "APPROVED") {
                    statusColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                  }

                  let displayCost = "TBD";
                  if (proposal.generatedContent?.investmentDetails) {
                    try {
                      const pricing = JSON.parse(proposal.generatedContent.investmentDetails);
                      displayCost = `$${(pricing.totalInvestment || 0).toLocaleString()}`;
                    } catch {}
                  }

                  let timeAgo = "Just now";
                  try {
                    timeAgo = formatDistanceToNow(new Date(proposal.createdAt), { addSuffix: true });
                  } catch {}

                  return (
                    <div
                      key={proposal.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4.5 hover:bg-white/[0.01] -mx-4 px-4 rounded-xl transition-colors"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600/10 text-violet-400 border border-violet-500/15">
                          <Briefcase className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-100 truncate">
                              {proposal.clientName}
                            </span>
                            <span className={`text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded-full border ${statusColor}`}>
                              {proposal.status}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-gray-400 mt-1">
                            <span className="text-gray-300 font-medium">
                              {proposal.service.name}
                            </span>
                            <span className="text-gray-600">•</span>
                            <span className="text-gray-500">{timeAgo}</span>
                            {proposal.clientWebsite && (
                              <>
                                <span className="text-gray-600">•</span>
                                <span className="text-gray-500 truncate max-w-[120px]">
                                  {proposal.clientWebsite.replace(/https?:\/\/(www\.)?/, "")}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4">
                        <div className="text-left sm:text-right">
                          <div className="text-sm font-semibold text-gray-100">{displayCost}</div>
                          <div className="text-[10px] text-gray-500">Total Investment</div>
                        </div>

                        <div className="flex items-center gap-2.5">
                          {proposal.status === "GENERATING" ? (
                            <div className="h-8 w-8 flex items-center justify-center rounded-xl border border-white/5 bg-white/5">
                              <span className="h-4 w-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                          ) : (
                            <Link
                              href={`/proposals/${proposal.id}`}
                              className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/5 bg-white/5 text-gray-400 hover:bg-violet-600/15 hover:text-violet-400 hover:border-violet-500/20 transition-all duration-200"
                              title="Edit Proposal"
                            >
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          )}
                          <DeleteButton id={proposal.id} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Services Library Info */}
          <div className="space-y-6">
            <div className="glass-card rounded-2xl p-6 border border-white/5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2 pb-4 border-b border-white/5">
                <Briefcase className="h-5 w-5 text-violet-400" />
                Service Templates
              </h2>
              <div className="mt-4 space-y-3">
                {services.map((service) => (
                  <div
                    key={service.slug}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5"
                  >
                    <div>
                      <div className="text-sm font-semibold text-gray-200">{service.name}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5 truncate max-w-[180px]">
                        {service.description}
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-violet-400 bg-violet-400/10 px-2 py-0.5 rounded-full border border-violet-400/20">
                      Active
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Tips */}
            <div className="bg-gradient-to-br from-violet-600/10 to-indigo-900/15 rounded-2xl p-6 border border-violet-500/15 relative overflow-hidden">
              <div className="absolute -right-4 -bottom-4 w-24 h-24 glow-purple opacity-30" />
              <h3 className="text-sm font-bold text-violet-400 flex items-center gap-1.5 uppercase tracking-wide">
                <span>⚡</span> Quick Tip
              </h3>
              <p className="text-xs text-gray-300 mt-2 leading-relaxed">
                Ensure your local Ollama app is running before generating a proposal to avoid fallbacks. Running 
                <code className="bg-black/30 text-violet-300 px-1 py-0.5 rounded ml-1 border border-white/5">ollama run deepseek-r1</code> 
                provides the highest reasoning quality.
              </p>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
