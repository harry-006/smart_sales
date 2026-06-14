"use server";

import { db } from "@/lib/db";
import { generateProposalContent } from "@/lib/openrouter";
import { revalidatePath } from "next/cache";

export interface GenerateProposalInput {
  clientName: string;
  clientWebsite: string;
  competitorWebsite: string;
  serviceSlug: string;
  goal: string;
  pricingInput: string; // e.g. "1500" or a custom description
  additionalNotes?: string;
}

export async function createAndGenerateProposal(input: GenerateProposalInput) {
  try {
    console.log("Starting proposal creation for:", input.clientName);

    // 1. Fetch default user & template from database
    const user = await db.user.findFirst({
      where: { role: "SALES" },
    }) || await db.user.findFirst();

    if (!user) {
      throw new Error("No user found in the database. Please run the seeding script first.");
    }

    const template = await db.template.findFirst({
      where: { isDefault: true },
    }) || await db.template.findFirst();

    if (!template) {
      throw new Error("No template found in the database. Please run the seeding script first.");
    }

    // 2. Fetch service configuration
    const service = await db.service.findFirst({
      where: { slug: input.serviceSlug },
    });

    if (!service) {
      throw new Error(`Service '${input.serviceSlug}' not found.`);
    }

    // 3. Create initial proposal record with status "GENERATING"
    const proposal = await db.proposal.create({
      data: {
        clientName: input.clientName,
        clientWebsite: input.clientWebsite,
        competitorWebsite: input.competitorWebsite,
        goal: input.goal,
        pricingInput: input.pricingInput,
        additionalNotes: input.additionalNotes || "",
        status: "GENERATING",
        userId: user.id,
        serviceId: service.id,
        templateId: template.id,
      },
    });

    // 4. Trigger local LLM (or mock) content generation
    let aiContent;
    try {
      aiContent = await generateProposalContent({
        clientName: input.clientName,
        clientWebsite: input.clientWebsite,
        competitorWebsite: input.competitorWebsite,
        service: service,
        goal: input.goal,
        pricingInput: input.pricingInput,
        notes: input.additionalNotes,
      });
    } catch (err) {
      console.error("AI Generation failed, falling back to mock content:", err);
      throw err;
    }

    // 5. Parse and calculate pricing details
    let serviceCost = 1500;
    let setupCost = 1000;
    let adBudget = 0;

    // Try parsing the pricingInput as a single number or JSON object
    try {
      const parsedNum = parseFloat(input.pricingInput.trim());
      if (!isNaN(parsedNum)) {
        serviceCost = parsedNum;
        // Read service defaults to fill setup costs
        const servicePricing = JSON.parse(service.pricingModel || "{}");
        setupCost = servicePricing.defaultSetupCost ?? 1000;
        adBudget = servicePricing.defaultAdBudget ?? 0;
      } else {
        const parsedJson = JSON.parse(input.pricingInput);
        serviceCost = parsedJson.serviceCost ?? parsedJson.monthlyCost ?? 1500;
        setupCost = parsedJson.setupCost ?? 1000;
        adBudget = parsedJson.adBudget ?? 0;
      }
    } catch {
      // String input fallback - read defaults from the service
      const servicePricing = JSON.parse(service.pricingModel || "{}");
      serviceCost = servicePricing.defaultMonthlyCost ?? 1500;
      setupCost = servicePricing.defaultSetupCost ?? 1000;
      adBudget = servicePricing.defaultAdBudget ?? 0;
    }

    const monthlyCost = serviceCost + adBudget;
    const totalInvestment = setupCost + monthlyCost;

    const investmentDetails = {
      serviceCost,
      setupCost,
      adBudget,
      monthlyCost,
      totalInvestment,
    };

    // 6. Save AI generated content to database
    await db.generatedContent.create({
      data: {
        proposalId: proposal.id,
        proposalTitle: aiContent.proposal_title,
        headline: aiContent.problem_headline,
        subheadline: aiContent.problem_description,
        problemStatement: aiContent.problem_description,
        opportunityStatement: aiContent.solution_headline,
        solutionStatement: aiContent.solution_description,
        forecastLeads: aiContent.forecast.leads,
        forecastReach: aiContent.forecast.reach,
        forecastTraffic: aiContent.forecast.traffic,
        forecastROI: aiContent.forecast.roi,
        costPerLead: aiContent.forecast.cost_per_lead,
        deliverables: JSON.stringify(aiContent.deliverables),
        processSteps: JSON.stringify(aiContent.process_steps),
        nextSteps: JSON.stringify(aiContent.next_steps),
        investmentDetails: JSON.stringify(investmentDetails),
      },
    });

    // 7. Update proposal status to "GENERATED"
    const updatedProposal = await db.proposal.update({
      where: { id: proposal.id },
      data: { status: "GENERATED" },
      include: {
        generatedContent: true,
        service: true,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath(`/proposals/${proposal.id}`);

    return {
      success: true,
      proposalId: updatedProposal.id,
      proposal: updatedProposal,
    };
  } catch (error: unknown) {
    console.error("Error in createAndGenerateProposal:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create and generate proposal.",
    };
  }
}

export async function deleteProposal(id: string) {
  try {
    await db.proposal.delete({
      where: { id },
    });
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to delete proposal:", error);
    return { success: false, error: message };
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function updateProposalContent(proposalId: string, data: any) {
  try {
    // 1. Fetch current content to create a version history snapshot
    const current = await db.generatedContent.findUnique({
      where: { proposalId },
    });

    if (current) {
      await db.proposalVersion.create({
        data: {
          proposalId,
          content: JSON.stringify({
            proposalTitle: current.proposalTitle,
            headline: current.headline,
            subheadline: current.subheadline,
            problemStatement: current.problemStatement,
            opportunityStatement: current.opportunityStatement,
            solutionStatement: current.solutionStatement,
            forecastLeads: current.forecastLeads,
            forecastReach: current.forecastReach,
            forecastTraffic: current.forecastTraffic,
            forecastROI: current.forecastROI,
            costPerLead: current.costPerLead,
            deliverables: current.deliverables,
            processSteps: current.processSteps,
            nextSteps: current.nextSteps,
            investmentDetails: current.investmentDetails,
          }),
          editorName: "Sales Rep",
        },
      });
    }

    // 2. Update the GeneratedContent record
    await db.generatedContent.update({
      where: { proposalId },
      data: {
        proposalTitle: data.proposalTitle,
        headline: data.headline,
        subheadline: data.subheadline,
        problemStatement: data.problemStatement,
        opportunityStatement: data.opportunityStatement,
        solutionStatement: data.solutionStatement,
        forecastLeads: data.forecastLeads,
        forecastReach: data.forecastReach,
        forecastTraffic: data.forecastTraffic,
        forecastROI: data.forecastROI,
        costPerLead: data.costPerLead,
        deliverables: JSON.stringify(data.deliverables),
        processSteps: JSON.stringify(data.processSteps),
        nextSteps: JSON.stringify(data.nextSteps),
        investmentDetails: JSON.stringify(data.investmentDetails),
      },
    });

    revalidatePath("/dashboard");
    revalidatePath(`/proposals/${proposalId}`);
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to update proposal:", error);
    return { success: false, error: message };
  }
}

