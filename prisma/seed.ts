import { PrismaClient, ContactStatus, OpportunityStage, CompanySize } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('admin1234', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@crm.dev' },
    update: {},
    create: {
      email: 'admin@crm.dev',
      name: 'Admin CRM',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  const acme = await prisma.company.create({
    data: {
      name: 'Acme Corp',
      industry: 'Technology',
      website: 'https://acme.example.com',
      phone: '+1 555 0100',
      city: 'San Francisco',
      country: 'USA',
      size: CompanySize.MEDIUM,
      revenue: 5_000_000,
    },
  });

  const globex = await prisma.company.create({
    data: {
      name: 'Globex Industries',
      industry: 'Manufacturing',
      website: 'https://globex.example.com',
      city: 'Chicago',
      country: 'USA',
      size: CompanySize.LARGE,
      revenue: 50_000_000,
    },
  });

  const alice = await prisma.contact.create({
    data: {
      firstName: 'Alice',
      lastName: 'Martin',
      email: 'alice@acme.example.com',
      phone: '+1 555 0101',
      title: 'VP Sales',
      status: ContactStatus.CLIENT,
      companyId: acme.id,
    },
  });

  const bob = await prisma.contact.create({
    data: {
      firstName: 'Bob',
      lastName: 'Johnson',
      email: 'bob@globex.example.com',
      phone: '+1 555 0202',
      title: 'Director of Procurement',
      status: ContactStatus.PROSPECT,
      companyId: globex.id,
    },
  });

  await prisma.opportunity.createMany({
    data: [
      {
        title: 'Acme — Licence Enterprise',
        value: 120_000,
        stage: OpportunityStage.NEGOTIATION,
        probability: 75,
        closeDate: new Date('2025-06-30'),
        contactId: alice.id,
        companyId: acme.id,
        assignedToId: admin.id,
      },
      {
        title: 'Globex — Pilot Project',
        value: 45_000,
        stage: OpportunityStage.PROPOSAL,
        probability: 50,
        closeDate: new Date('2025-07-15'),
        contactId: bob.id,
        companyId: globex.id,
        assignedToId: admin.id,
      },
      {
        title: 'Globex — Full Deployment',
        value: 380_000,
        stage: OpportunityStage.QUALIFIED,
        probability: 30,
        closeDate: new Date('2025-12-01'),
        contactId: bob.id,
        companyId: globex.id,
        assignedToId: admin.id,
      },
    ],
  });

  console.log('✅ Seed complete — admin@crm.dev / admin1234');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
