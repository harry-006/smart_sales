"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProposalContent } from "@/app/actions/generateProposal";
import { 
  Save, 
  Printer, 
  Trash2, 
  Plus, 
  CheckCircle,
  Undo
} from "lucide-react";

interface ProposalEditorProps {
  proposal: {
    id: string;
    clientName: string;
    clientWebsite: string;
    competitorWebsite: string;
    goal: string;
    pricingInput: string;
    additionalNotes: string | null;
    status: string;
    createdAt: Date;
    service: {
      name: string;
      slug: string;
    };
    generatedContent: {
      proposalTitle: string;
      headline: string;
      subheadline: string;
      problemStatement: string;
      opportunityStatement: string;
      solutionStatement: string;
      forecastLeads: string | null;
      forecastReach: string | null;
      forecastTraffic: string | null;
      forecastROI: string | null;
      costPerLead: string | null;
      deliverables: string; // JSON Array
      processSteps: string; // JSON Array
      nextSteps: string;    // JSON Array
      investmentDetails: string; // JSON Object
    } | null;
  };
}

export default function ProposalEditor({ proposal }: ProposalEditorProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("cover");

  const gc = proposal.generatedContent;
  
  // 1. Initialize states with generated content values
  const [proposalTitle, setProposalTitle] = useState(gc?.proposalTitle || `Growth Proposal`);
  const [headline, setHeadline] = useState(gc?.headline || "");
  const [subheadline, setSubheadline] = useState(gc?.subheadline || "");
  const [problemStatement, setProblemStatement] = useState(gc?.problemStatement || "");
  const [opportunityStatement, setOpportunityStatement] = useState(gc?.opportunityStatement || "");
  const [solutionStatement, setSolutionStatement] = useState(gc?.solutionStatement || "");
  
  // Forecasts
  const [forecastLeads, setForecastLeads] = useState(gc?.forecastLeads || "");
  const [forecastReach, setForecastReach] = useState(gc?.forecastReach || "");
  const [forecastTraffic, setForecastTraffic] = useState(gc?.forecastTraffic || "");
  const [forecastROI, setForecastROI] = useState(gc?.forecastROI || "");
  const [costPerLead, setCostPerLead] = useState(gc?.costPerLead || "");

  // Array states
  const [deliverables, setDeliverables] = useState<string[]>(
    gc?.deliverables ? JSON.parse(gc.deliverables) : []
  );
  const [processSteps, setProcessSteps] = useState<string[]>(
    gc?.processSteps ? JSON.parse(gc.processSteps) : []
  );
  const [nextSteps, setNextSteps] = useState<string[]>(
    gc?.nextSteps ? JSON.parse(gc.nextSteps) : []
  );

  // Pricing
  const initialPricing = gc?.investmentDetails 
    ? JSON.parse(gc.investmentDetails) 
    : { serviceCost: 1500, setupCost: 1000, adBudget: 0, monthlyCost: 1500, totalInvestment: 2500 };
    
  const [serviceCost, setServiceCost] = useState(initialPricing.serviceCost);
  const [setupCost, setSetupCost] = useState(initialPricing.setupCost);
  const [adBudget, setAdBudget] = useState(initialPricing.adBudget);

  const calculatedMonthly = serviceCost + adBudget;
  const calculatedTotal = setupCost + calculatedMonthly;

  // Handle updates to array fields
  const handleArrayChange = (idx: number, val: string, type: "deliv" | "process" | "next") => {
    if (type === "deliv") {
      const copy = [...deliverables];
      copy[idx] = val;
      setDeliverables(copy);
    } else if (type === "process") {
      const copy = [...processSteps];
      copy[idx] = val;
      setProcessSteps(copy);
    } else if (type === "next") {
      const copy = [...nextSteps];
      copy[idx] = val;
      setNextSteps(copy);
    }
  };

  const addArrayItem = (type: "deliv" | "process" | "next") => {
    if (type === "deliv") setDeliverables([...deliverables, "New deliverable item"]);
    else if (type === "process") setProcessSteps([...processSteps, "New process phase details"]);
    else if (type === "next") setNextSteps([...nextSteps, "New onboarding step"]);
  };

  const removeArrayItem = (idx: number, type: "deliv" | "process" | "next") => {
    if (type === "deliv") setDeliverables(deliverables.filter((_, i) => i !== idx));
    else if (type === "process") setProcessSteps(processSteps.filter((_, i) => i !== idx));
    else if (type === "next") setNextSteps(nextSteps.filter((_, i) => i !== idx));
  };

  // Trigger browser print of the right pane or custom styling
  const handlePrint = () => {
    window.print();
  };

  // Save changes via Server Action
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const investmentDetails = {
        serviceCost,
        setupCost,
        adBudget,
        monthlyCost: calculatedMonthly,
        totalInvestment: calculatedTotal,
      };

      const res = await updateProposalContent(proposal.id, {
        proposalTitle,
        headline,
        subheadline,
        problemStatement,
        opportunityStatement,
        solutionStatement,
        forecastLeads,
        forecastReach,
        forecastTraffic,
        forecastROI,
        costPerLead,
        deliverables,
        processSteps,
        nextSteps,
        investmentDetails,
      });

      if (res.success) {
        alert("Proposal changes saved successfully! A history version was created.");
      } else {
        alert("Failed to save changes: " + res.error);
      }
    } catch (e) {
      alert("Error saving proposal.");
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const formattedDate = new Date(proposal.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  return (
    <div className="min-h-screen bg-[#060609] text-gray-100 flex flex-col">
      {/* Editor Top Bar */}
      <header className="flex h-16 items-center justify-between border-b border-white/5 bg-[#09090d]/80 px-8 sticky top-0 z-20 backdrop-blur-md no-print">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
          >
            <Undo className="h-4 w-4" />
            Back to Dashboard
          </button>
          <div className="h-4 w-px bg-white/10" />
          <div>
            <h2 className="text-sm font-semibold text-gray-200">
              Editing: <span className="text-violet-400">{proposal.clientName}</span>
            </h2>
            <p className="text-[10px] text-gray-400 mt-0.5">{proposal.service.name} Campaign</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 px-4 py-2 text-xs font-semibold text-gray-200 hover:text-white transition-all duration-200"
          >
            <Printer className="h-4 w-4 text-gray-400" />
            Export / Print PDF
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-violet-600/10 hover:bg-violet-500 disabled:opacity-50 transition-all duration-200"
          >
            {isSaving ? (
              <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Changes
          </button>
        </div>
      </header>

      {/* Editor Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Form Editor Panel */}
        <div className="w-[45%] border-r border-white/5 bg-[#08080c]/60 flex flex-col overflow-y-auto p-6 space-y-6 no-print">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">Proposal Sections</h3>
            <p className="text-xs text-gray-400">Modify generated texts and details. Preview updates live on the right.</p>
          </div>

          {/* Section Tab List */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "cover", label: "Cover Page" },
              { id: "problem", label: "Problem" },
              { id: "solution", label: "Solution" },
              { id: "forecast", label: "Forecast" },
              { id: "process", label: "Process" },
              { id: "deliverables", label: "Deliverables" },
              { id: "investment", label: "Investment" },
              { id: "nextSteps", label: "Next Steps" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition-all ${
                  activeTab === tab.id
                    ? "bg-violet-600/15 text-violet-400 border-violet-500/30"
                    : "bg-white/[0.01] text-gray-400 border-white/5 hover:bg-white/5 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="h-px bg-white/5" />

          {/* Tabs Editor Fields */}
          <div className="flex-1 space-y-5">
            {/* Tab: Cover Page */}
            {activeTab === "cover" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-300">Proposal Document Title</label>
                  <input
                    type="text"
                    value={proposalTitle}
                    onChange={(e) => setProposalTitle(e.target.value)}
                    className="w-full rounded-xl bg-white/[0.03] border border-white/5 px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div className="space-y-1 text-xs text-gray-400 leading-relaxed bg-white/[0.02] border border-white/5 p-4 rounded-xl">
                  <span className="font-semibold text-gray-200">Cover Page Metadata:</span>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div>Client: <strong className="text-gray-200">{proposal.clientName}</strong></div>
                    <div>Service: <strong className="text-gray-200">{proposal.service.name}</strong></div>
                    <div>Date: <strong className="text-gray-200">{formattedDate}</strong></div>
                    <div>Author: <strong className="text-gray-200">Sales Rep</strong></div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Problem Statement */}
            {activeTab === "problem" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-300">Thesis Headline</label>
                  <input
                    type="text"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    className="w-full rounded-xl bg-white/[0.03] border border-white/5 px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-300">Thesis Description</label>
                  <textarea
                    rows={4}
                    value={subheadline}
                    onChange={(e) => setSubheadline(e.target.value)}
                    className="w-full rounded-xl bg-white/[0.03] border border-white/5 px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-300">Problem Statement Detail</label>
                  <textarea
                    rows={4}
                    value={problemStatement}
                    onChange={(e) => setProblemStatement(e.target.value)}
                    className="w-full rounded-xl bg-white/[0.03] border border-white/5 px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 resize-none"
                  />
                </div>
              </div>
            )}

            {/* Tab: Solution */}
            {activeTab === "solution" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-300">Service Headline</label>
                  <input
                    type="text"
                    value={opportunityStatement}
                    onChange={(e) => setOpportunityStatement(e.target.value)}
                    className="w-full rounded-xl bg-white/[0.03] border border-white/5 px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-300">Service Description</label>
                  <textarea
                    rows={4}
                    value={solutionStatement}
                    onChange={(e) => setSolutionStatement(e.target.value)}
                    className="w-full rounded-xl bg-white/[0.03] border border-white/5 px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 resize-none"
                  />
                </div>
              </div>
            )}

            {/* Tab: Forecast */}
            {activeTab === "forecast" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-300">Estimated Leads</label>
                    <input
                      type="text"
                      value={forecastLeads}
                      onChange={(e) => setForecastLeads(e.target.value)}
                      placeholder="e.g. +35 Leads/mo"
                      className="w-full rounded-xl bg-white/[0.03] border border-white/5 px-4 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-300">Estimated Reach</label>
                    <input
                      type="text"
                      value={forecastReach}
                      onChange={(e) => setForecastReach(e.target.value)}
                      placeholder="e.g. 50k views/mo"
                      className="w-full rounded-xl bg-white/[0.03] border border-white/5 px-4 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-300">Estimated Traffic</label>
                    <input
                      type="text"
                      value={forecastTraffic}
                      onChange={(e) => setForecastTraffic(e.target.value)}
                      placeholder="e.g. +2,000 visits/mo"
                      className="w-full rounded-xl bg-white/[0.03] border border-white/5 px-4 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-300">Estimated ROI</label>
                    <input
                      type="text"
                      value={forecastROI}
                      onChange={(e) => setForecastROI(e.target.value)}
                      placeholder="e.g. 4.5x ROI"
                      className="w-full rounded-xl bg-white/[0.03] border border-white/5 px-4 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-300">Cost Per Lead (CPL)</label>
                  <input
                    type="text"
                    value={costPerLead}
                    onChange={(e) => setCostPerLead(e.target.value)}
                    placeholder="e.g. $15 - $25"
                    className="w-full rounded-xl bg-white/[0.03] border border-white/5 px-4 py-2.5 text-xs text-white focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>
            )}

            {/* Tab: Process Steps */}
            {activeTab === "process" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-300">Process Steps (Max 5)</label>
                  <button
                    onClick={() => addArrayItem("process")}
                    className="text-[10px] text-violet-400 hover:text-white flex items-center gap-1 font-semibold"
                  >
                    <Plus className="h-3 w-3" /> Add Step
                  </button>
                </div>
                <div className="space-y-3">
                  {processSteps.map((step, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <span className="text-xs font-bold text-gray-600 w-5">{idx + 1}.</span>
                      <input
                        type="text"
                        value={step}
                        onChange={(e) => handleArrayChange(idx, e.target.value, "process")}
                        className="flex-1 rounded-xl bg-white/[0.03] border border-white/5 px-3 py-2 text-xs text-white focus:outline-none"
                      />
                      <button
                        onClick={() => removeArrayItem(idx, "process")}
                        className="text-gray-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab: Deliverables */}
            {activeTab === "deliverables" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-300">Deliverables List</label>
                  <button
                    onClick={() => addArrayItem("deliv")}
                    className="text-[10px] text-violet-400 hover:text-white flex items-center gap-1 font-semibold"
                  >
                    <Plus className="h-3 w-3" /> Add Deliverable
                  </button>
                </div>
                <div className="space-y-3">
                  {deliverables.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-start">
                      <span className="text-xs font-bold text-gray-600 mt-2 w-5">{idx + 1}.</span>
                      <textarea
                        rows={2}
                        value={item}
                        onChange={(e) => handleArrayChange(idx, e.target.value, "deliv")}
                        className="flex-1 rounded-xl bg-white/[0.03] border border-white/5 px-3 py-2 text-xs text-white focus:outline-none resize-none"
                      />
                      <button
                        onClick={() => removeArrayItem(idx, "deliv")}
                        className="text-gray-500 hover:text-rose-400 p-1 mt-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab: Investment / Pricing */}
            {activeTab === "investment" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 bg-white/[0.01] border border-white/5 p-4 rounded-2xl">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-300">Service Cost ($ / mo)</label>
                    <input
                      type="number"
                      value={serviceCost}
                      onChange={(e) => setServiceCost(parseInt(e.target.value) || 0)}
                      className="w-full rounded-xl bg-[#09090d] border border-white/5 px-4 py-2.5 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-300">Setup Cost ($)</label>
                    <input
                      type="number"
                      value={setupCost}
                      onChange={(e) => setSetupCost(parseInt(e.target.value) || 0)}
                      className="w-full rounded-xl bg-[#09090d] border border-white/5 px-4 py-2.5 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-300">Ad Budget ($ / mo)</label>
                    <input
                      type="number"
                      value={adBudget}
                      onChange={(e) => setAdBudget(parseInt(e.target.value) || 0)}
                      className="w-full rounded-xl bg-[#09090d] border border-white/5 px-4 py-2.5 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div className="space-y-2 flex flex-col justify-end pb-1 text-xs text-gray-400">
                    <div>Calculated Monthly: <strong className="text-emerald-400">${calculatedMonthly}</strong></div>
                    <div className="mt-1">Calculated Contract: <strong className="text-violet-400">${calculatedTotal}</strong></div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Next Steps */}
            {activeTab === "nextSteps" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-300">Next Onboarding Steps</label>
                  <button
                    onClick={() => addArrayItem("next")}
                    className="text-[10px] text-violet-400 hover:text-white flex items-center gap-1 font-semibold"
                  >
                    <Plus className="h-3 w-3" /> Add Step
                  </button>
                </div>
                <div className="space-y-3">
                  {nextSteps.map((step, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <span className="text-xs font-bold text-gray-600 w-5">{idx + 1}.</span>
                      <input
                        type="text"
                        value={step}
                        onChange={(e) => handleArrayChange(idx, e.target.value, "next")}
                        className="flex-1 rounded-xl bg-white/[0.03] border border-white/5 px-3 py-2 text-xs text-white focus:outline-none"
                      />
                      <button
                        onClick={() => removeArrayItem(idx, "next")}
                        className="text-gray-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Live HTML/A4 Preview Panel */}
        <div className="flex-1 bg-[#121217] pdf-preview-container flex flex-col items-center">
          {/* A4 Sheet 1: Cover Page */}
          <div className="pdf-preview-page font-sans text-gray-900 select-none">
            {/* Header branding line */}
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
              <span className="text-xs font-bold tracking-widest uppercase text-violet-600">SmartSales Consulting</span>
              <span className="text-xs text-gray-400 font-medium">Internal Draft</span>
            </div>

            {/* Title Block */}
            <div className="my-auto space-y-6">
              <span className="text-xs font-extrabold uppercase tracking-widest text-violet-600 bg-violet-50 px-3 py-1.5 rounded-full">
                Service Proposal
              </span>
              <h1 className="text-4xl font-extrabold leading-tight text-gray-900 tracking-tight mt-4 max-w-lg">
                {proposalTitle}
              </h1>
              <div className="h-1 w-24 bg-violet-600 rounded-full mt-6" />
              <p className="text-sm text-gray-500 max-w-sm leading-relaxed">
                Strategic strategy execution blueprint mapped exclusively for the digital scaling goals of Acme Corp.
              </p>
            </div>

            {/* Footer Metadata */}
            <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-8 mt-auto text-xs text-gray-500">
              <div className="space-y-1">
                <div>PREPARED FOR</div>
                <div className="font-bold text-gray-900">{proposal.clientName}</div>
                <div className="text-[10px] text-gray-400">{proposal.clientWebsite}</div>
              </div>
              <div className="space-y-1 text-right">
                <div>PROPOSAL DATE</div>
                <div className="font-bold text-gray-900">{formattedDate}</div>
                <div className="text-[10px] text-gray-400">Prepared By: Sales Team</div>
              </div>
            </div>
          </div>

          {/* A4 Sheet 2: The Challenge & Bottlenecks */}
          <div className="pdf-preview-page font-sans text-gray-900 select-none">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
              <span className="text-xs font-bold tracking-widest uppercase text-violet-600">01. Current Bottlenecks</span>
              <span className="text-xs text-gray-400">{proposal.clientName} Proposal</span>
            </div>

            <div className="my-auto space-y-6">
              <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                {headline || "Identified Leakages & Bottlenecks"}
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                {subheadline || "Analysis of search ranking, page configurations, and competitor benchmarks reveals several key factors limit digital client acquisition."}
              </p>

              <div className="space-y-4 mt-6">
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-gray-400">Core Weaknesses</h3>
                {deliverables.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="flex gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-500 border border-rose-100 text-sm font-bold">
                      {idx + 1}
                    </div>
                    <div className="text-xs text-gray-700 leading-relaxed font-medium">
                      {item}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-[10px] text-gray-400 text-center border-t border-gray-100 pt-4">
              Page 2 of 5 • Confidential Report for {proposal.clientName}
            </div>
          </div>

          {/* A4 Sheet 3: Proposed Strategy & Process */}
          <div className="pdf-preview-page font-sans text-gray-900 select-none">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
              <span className="text-xs font-bold tracking-widest uppercase text-violet-600">02. Strategic Solution</span>
              <span className="text-xs text-gray-400">{proposal.clientName} Proposal</span>
            </div>

            <div className="my-auto space-y-6">
              <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                {opportunityStatement || "Custom Service Strategy"}
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                {solutionStatement || "Deploying our optimized campaigns solves your acquisition blockers and establishes stable pipelines."}
              </p>

              <div className="space-y-4 mt-6">
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-gray-400">Implementation Process</h3>
                {processSteps.slice(0, 5).map((step, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-violet-600 shrink-0" />
                    <span className="text-xs text-gray-700 font-medium">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-[10px] text-gray-400 text-center border-t border-gray-100 pt-4">
              Page 3 of 5 • Confidential Report for {proposal.clientName}
            </div>
          </div>

          {/* A4 Sheet 4: Performance Forecasts */}
          <div className="pdf-preview-page font-sans text-gray-900 select-none">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
              <span className="text-xs font-bold tracking-widest uppercase text-violet-600">03. Growth Forecasts</span>
              <span className="text-xs text-gray-400">{proposal.clientName} Proposal</span>
            </div>

            <div className="my-auto space-y-6">
              <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                Estimated Performance Projections
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                Below are the metrics modeled based on historical benchmarks for the {proposal.service.name} service, targeting {proposal.goal}.
              </p>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="border border-gray-100 bg-gray-50/50 p-4 rounded-xl">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Estimated Leads</div>
                  <div className="text-lg font-bold text-violet-600 mt-1">{forecastLeads || "+35 Leads/mo"}</div>
                </div>
                <div className="border border-gray-100 bg-gray-50/50 p-4 rounded-xl">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Estimated Reach</div>
                  <div className="text-lg font-bold text-violet-600 mt-1">{forecastReach || "50k - 80k views/mo"}</div>
                </div>
                <div className="border border-gray-100 bg-gray-50/50 p-4 rounded-xl">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Estimated Traffic</div>
                  <div className="text-lg font-bold text-violet-600 mt-1">{forecastTraffic || "+2,000 visits/mo"}</div>
                </div>
                <div className="border border-gray-100 bg-gray-50/50 p-4 rounded-xl">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-semibold">Expected ROI</div>
                  <div className="text-lg font-bold text-emerald-600 mt-1">{forecastROI || "4.0x ROI"}</div>
                </div>
              </div>

              <div className="p-4 bg-violet-50 rounded-xl border border-violet-100 text-xs text-violet-900 mt-6 leading-relaxed">
                <strong>Attribution Note:</strong> Forecasts are calculated based on service spend. Real metrics fluctuate based on sales team speed, close rate, and seasonal adjustments.
              </div>
            </div>

            <div className="text-[10px] text-gray-400 text-center border-t border-gray-100 pt-4">
              Page 4 of 5 • Confidential Report for {proposal.clientName}
            </div>
          </div>

          {/* A4 Sheet 5: Financial Investment & Onboarding */}
          <div className="pdf-preview-page font-sans text-gray-900 select-none">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
              <span className="text-xs font-bold tracking-widest uppercase text-violet-600">04. Investment Options</span>
              <span className="text-xs text-gray-400">{proposal.clientName} Proposal</span>
            </div>

            <div className="my-auto space-y-6">
              <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                Financial Setup & Budgets
              </h2>
              
              {/* Pricing breakdown table */}
              <div className="border border-gray-100 rounded-xl overflow-hidden mt-4">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 font-bold border-b border-gray-100">
                      <th className="p-3">Fee Category</th>
                      <th className="p-3 text-right">Investment Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    <tr>
                      <td className="p-3">Monthly Service Retainer ({proposal.service.name})</td>
                      <td className="p-3 text-right font-semibold">${serviceCost.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="p-3">One-Time Technical Integration & Setup</td>
                      <td className="p-3 text-right font-semibold">${setupCost.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="p-3">Monthly Estimated Advertising Budget (Paid to Meta)</td>
                      <td className="p-3 text-right font-semibold">${adBudget.toLocaleString()}</td>
                    </tr>
                    <tr className="bg-violet-50/50 text-gray-900 font-bold">
                      <td className="p-3">Total Monthly Commitment</td>
                      <td className="p-3 text-right text-violet-600">${calculatedMonthly.toLocaleString()}/mo</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Onboarding steps list */}
              <div className="space-y-3 mt-6">
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-gray-400">Next Action Steps</h3>
                {nextSteps.slice(0, 3).map((step, idx) => (
                  <div key={idx} className="flex gap-3 items-center text-xs text-gray-700">
                    <span className="h-5 w-5 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-bold text-[10px]">
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 border-t border-gray-100 pt-8 mt-6 text-xs text-gray-500">
                <div className="space-y-4">
                  <div>Approved By ({proposal.clientName})</div>
                  <div className="h-8 border-b border-gray-200" />
                  <div>Date: ________________________</div>
                </div>
                <div className="space-y-4">
                  <div>Approved By (SmartSales Partner)</div>
                  <div className="h-8 border-b border-gray-200" />
                  <div>Date: ________________________</div>
                </div>
              </div>
            </div>

            <div className="text-[10px] text-gray-400 text-center border-t border-gray-100 pt-4">
              Page 5 of 5 • Confidential Report for {proposal.clientName}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
