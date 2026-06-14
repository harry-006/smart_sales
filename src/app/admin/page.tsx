import { db } from "@/lib/db";
import { SidebarLayout } from "@/components/SidebarLayout";
import { 
  Settings, 
  Briefcase, 
  Layers, 
  Cpu, 
  Code
} from "lucide-react";

export const revalidate = 0;

export default async function AdminPage() {
  const services = await db.service.findMany({
    orderBy: { name: "asc" },
  });

  const templates = await db.template.findMany();

  return (
    <SidebarLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent flex items-center gap-2">
            <Settings className="h-7 w-7 text-violet-500 stroke-[1.5]" />
            System Admin Panel
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Manage service templates, system prompt rules, pricing defaults, and layout structures.
          </p>
        </div>

        {/* Config and Overview Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Service count */}
          <div className="glass-card rounded-2xl p-6 border border-white/5">
            <div className="flex items-center gap-3 text-violet-400">
              <Briefcase className="h-5 w-5" />
              <h3 className="font-semibold text-white">Services Library</h3>
            </div>
            <div className="mt-4 text-3xl font-bold text-gray-100">{services.length}</div>
            <p className="text-xs text-gray-500 mt-1">Predefined service configurations</p>
          </div>

          {/* Layout count */}
          <div className="glass-card rounded-2xl p-6 border border-white/5">
            <div className="flex items-center gap-3 text-emerald-400">
              <Layers className="h-5 w-5" />
              <h3 className="font-semibold text-white">Active Layouts</h3>
            </div>
            <div className="mt-4 text-3xl font-bold text-gray-100">{templates.length}</div>
            <p className="text-xs text-gray-500 mt-1">Document structure templates</p>
          </div>

          {/* LLM Status */}
          <div className="glass-card rounded-2xl p-6 border border-white/5">
            <div className="flex items-center gap-3 text-blue-400">
              <Cpu className="h-5 w-5" />
              <h3 className="font-semibold text-white">AI Engine</h3>
            </div>
            <div className="mt-4 text-sm font-bold text-gray-200">DeepSeek-R1 / Llama3</div>
            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Local Ollama client enabled
            </p>
          </div>
        </div>

        {/* Templates Details */}
        <div className="glass-card rounded-2xl p-6 border border-white/5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 pb-4 border-b border-white/5">
            <Layers className="h-5 w-5 text-violet-400" />
            Proposal Document Structures
          </h2>
          <div className="mt-4 space-y-4">
            {templates.map((t) => {
              const sections = JSON.parse(t.layout || "[]");
              return (
                <div key={t.id} className="p-4 rounded-xl bg-white/[0.01] border border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-200">{t.name}</h3>
                      <p className="text-[10px] text-gray-500 mt-0.5">{t.description}</p>
                    </div>
                    {t.isDefault && (
                      <span className="text-[9px] font-bold tracking-widest uppercase bg-violet-500/10 text-violet-400 border border-violet-500/20 px-2 py-0.5 rounded">
                        Default System Layout
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {sections.map((sect: string, idx: number) => (
                      <span
                        key={idx}
                        className="text-[10px] bg-white/5 border border-white/5 text-gray-300 px-2.5 py-1 rounded-lg capitalize"
                      >
                        {sect.replace("-", " ")}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Services Details */}
        <div className="glass-card rounded-2xl p-6 border border-white/5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 pb-4 border-b border-white/5">
            <Briefcase className="h-5 w-5 text-violet-400" />
            Services Library Configuration
          </h2>
          <div className="mt-4 space-y-6">
            {services.map((service) => {
              const deliverables = JSON.parse(service.deliverables || "[]");
              const processSteps = JSON.parse(service.processSteps || "[]");
              const pricing = JSON.parse(service.pricingModel || "{}");

              return (
                <div key={service.id} className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-gray-100">{service.name}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">{service.description}</p>
                    </div>
                    <div className="text-right text-xs">
                      <div className="text-gray-400">Default setup: <strong className="text-gray-100">${pricing.defaultSetupCost ?? 0}</strong></div>
                      <div className="text-gray-400 mt-0.5">Default service: <strong className="text-gray-100">${pricing.defaultMonthlyCost ?? 0}/mo</strong></div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Deliverables config */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wide">Default Deliverables</h4>
                      <ul className="space-y-1.5">
                        {deliverables.map((d: string, idx: number) => (
                          <li key={idx} className="text-[11px] text-gray-400 flex items-start gap-1.5">
                            <span className="text-violet-500 mt-0.5">•</span>
                            <span>{d}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Process Steps config */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wide">Default Implementation Process</h4>
                      <ul className="space-y-1.5">
                        {processSteps.map((p: string, idx: number) => (
                          <li key={idx} className="text-[11px] text-gray-400 flex items-start gap-1.5">
                            <span className="text-violet-400 font-bold shrink-0">{idx + 1}.</span>
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* AI Prompt override */}
                  <div className="bg-black/30 border border-white/5 p-3 rounded-xl space-y-1">
                    <div className="flex items-center gap-1.5 text-violet-400 text-xs font-bold uppercase tracking-wider">
                      <Code className="h-4 w-4" />
                      AI Prompt Guideline
                    </div>
                    <p className="text-[11px] text-gray-400 italic leading-relaxed">
                      &ldquo;{service.aiPrompt}&rdquo;
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
