const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // 1. Create a default User
  const user = await prisma.user.upsert({
    where: { email: 'admin@smartsales.app' },
    update: {},
    create: {
      email: 'admin@smartsales.app',
      name: 'Admin User',
      role: 'ADMIN',
    },
  });
  console.log(`Upserted User: ${user.name}`);

  // 2. Create default Services
  const services = [
    {
      name: 'Meta Ads Management',
      slug: 'meta-ads-management',
      description: 'Full-service Facebook and Instagram advertising campaigns designed for lead generation and ROAS.',
      deliverables: JSON.stringify([
        'Custom Audience Creation & Pixel Setup',
        'A/B Testing of Ad Creatives & Copy',
        'Weekly Performance Optimization',
        'Monthly Reporting Dashboard',
        'Retargeting Campaign Setup'
      ]),
      processSteps: JSON.stringify([
        'Discovery & Audit',
        'Strategy & Audience Mapping',
        'Creative Production & Copywriting',
        'Campaign Launch & Testing',
        'Scale & Optimize'
      ]),
      pricingModel: JSON.stringify({ type: 'retainer', min: 1000 }),
      aiPrompt: 'Focus heavily on ROAS, cost per lead, and scaling winning creatives.'
    },
    {
      name: 'Google Ads & Search',
      slug: 'google-ads-search',
      description: 'High-intent search engine marketing targeting users actively looking for your solution.',
      deliverables: JSON.stringify([
        'Keyword Research & Competitor Analysis',
        'Search & Display Network Setup',
        'Conversion Tracking Implementation',
        'Negative Keyword Management',
        'Landing Page CRO Recommendations'
      ]),
      processSteps: JSON.stringify([
        'Keyword & Competitor Research',
        'Account Structuring & Ad Groups',
        'Ad Copywriting & Extensions',
        'Launch & Bid Management',
        'Continuous Optimization'
      ]),
      pricingModel: JSON.stringify({ type: 'retainer', min: 1200 }),
      aiPrompt: 'Focus on high-intent keywords, quality score improvement, and lower CPA.'
    },
    {
      name: 'SEO Full Service',
      slug: 'seo-full-service',
      description: 'Comprehensive technical, on-page, and off-page SEO to build organic authority and traffic.',
      deliverables: JSON.stringify([
        'Technical Technical Site Audit',
        'Content Strategy & Topic Clusters',
        'On-Page Optimization',
        'Backlink Outreach',
        'Monthly Ranking Reports'
      ]),
      processSteps: JSON.stringify([
        'Comprehensive Site Audit',
        'Keyword Mapping & Content Gap Analysis',
        'On-Page & Technical Fixes',
        'Content Creation & Link Building',
        'Monitor & Report'
      ]),
      pricingModel: JSON.stringify({ type: 'retainer', min: 1500 }),
      aiPrompt: 'Emphasize long-term organic growth, compounding ROI, and domain authority.'
    }
  ];

  for (const s of services) {
    const service = await prisma.service.upsert({
      where: { slug: s.slug },
      update: {},
      create: s,
    });
    console.log(`Upserted Service: ${service.name}`);
  }

  // 3. Create a default Template
  const template = await prisma.template.upsert({
    where: { id: 'default-template-id' }, // use a fixed ID for simplicity, or findFirst
    update: {},
    create: {
      id: 'default-template-id',
      name: 'Standard Growth Proposal',
      description: 'The default template for marketing services',
      layout: JSON.stringify(['header', 'problem', 'solution', 'deliverables', 'investment', 'next_steps']),
      isDefault: true,
    },
  });
  console.log(`Upserted Template: ${template.name}`);

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
