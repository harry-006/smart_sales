import { db } from "@/lib/db";
import { SidebarLayout } from "@/components/SidebarLayout";
import CreateProposalForm from "@/components/CreateProposalForm";
import { Sparkles } from "lucide-react";

export const revalidate = 0; // Disable cache so it gets the latest services list

export default async function NewProposalPage() {
  // Fetch services to populate dropdown options
  const services = await db.service.findMany({
    select: {
      name: true,
      slug: true,
      description: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <SidebarLayout>
      <div className="space-y-8 max-w-3xl">
        {/* Title and Intro */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent flex items-center gap-2.5">
            <Sparkles className="h-7 w-7 text-violet-500 stroke-[1.5]" />
            New AI Strategy Proposal
          </h1>
          <p className="text-sm text-gray-400">
            Provide a few key business points, and our AI will crawl information and build a custom proposal.
          </p>
        </div>

        {/* Form Container */}
        <div className="glass-card rounded-2xl p-8 border border-white/5 shadow-2xl">
          <CreateProposalForm services={services} />
        </div>
      </div>
    </SidebarLayout>
  );
}
