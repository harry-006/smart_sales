import { db } from "@/lib/db";
import ProposalEditor from "@/components/ProposalEditor";
import { notFound } from "next/navigation";
import { Loader2 } from "lucide-react";
import RefreshPage from "@/components/RefreshPage";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const revalidate = 0; // Disable server-side page caching

export default async function ProposalDetailPage({ params }: PageProps) {
  const { id } = await params;

  // Fetch proposal details from database
  const proposal = await db.proposal.findUnique({
    where: { id },
    include: {
      service: true,
      generatedContent: true,
      user: true,
    },
  });

  if (!proposal) {
    notFound();
  }

  // If the proposal is still generating in the background, show a clean loader with auto-refresh
  if (proposal.status === "GENERATING") {
    return (
      <div className="min-h-screen bg-[#050508] text-gray-100 flex flex-col items-center justify-center p-6 text-center">
        <RefreshPage />
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] glow-purple opacity-20 pointer-events-none" />
        <div className="max-w-md w-full relative z-10 space-y-6">
          <div className="flex justify-center">
            <Loader2 className="h-12 w-12 text-violet-500 animate-spin stroke-[1.5]" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Generating Strategic Analysis...</h2>
            <p className="text-sm text-gray-400">
              The local AI is compiling competitive metrics, forecasts, and pricing tables for {proposal.clientName}.
            </p>
          </div>
          <span className="inline-block text-xs font-semibold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-3 py-1 rounded-full">
            Checking status. Page will refresh automatically.
          </span>
        </div>
      </div>
    );
  }

  return <ProposalEditor proposal={proposal} />;
}
