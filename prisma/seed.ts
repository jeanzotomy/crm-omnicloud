import {
  PrismaClient,
  ContactStatus,
  OpportunityStage,
  CompanySize,
  UserRole,
  TicketStatus,
  TicketPriority,
  TicketType,
  TicketSource,
  KnowledgeStatus,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const pw = await bcrypt.hash('admin1234', 10);

  // ── SLA Policies ──────────────────────────────────────────────────
  const slaCritical = await prisma.sLAPolicy.upsert({
    where: { id: 'sla-critical' },
    update: {},
    create: { id: 'sla-critical', name: 'Critical SLA', priority: TicketPriority.CRITICAL, firstResponseMinutes: 15, resolutionMinutes: 240 },
  });
  const slaHigh = await prisma.sLAPolicy.upsert({
    where: { id: 'sla-high' },
    update: {},
    create: { id: 'sla-high', name: 'High SLA', priority: TicketPriority.HIGH, firstResponseMinutes: 60, resolutionMinutes: 480 },
  });
  const slaMedium = await prisma.sLAPolicy.upsert({
    where: { id: 'sla-medium' },
    update: {},
    create: { id: 'sla-medium', name: 'Medium SLA', priority: TicketPriority.MEDIUM, firstResponseMinutes: 240, resolutionMinutes: 1440 },
  });
  const slaLow = await prisma.sLAPolicy.upsert({
    where: { id: 'sla-low' },
    update: {},
    create: { id: 'sla-low', name: 'Low SLA', priority: TicketPriority.LOW, firstResponseMinutes: 480, resolutionMinutes: 2880 },
  });

  // ── Departments ───────────────────────────────────────────────────
  const deptIT = await prisma.department.upsert({
    where: { code: 'IT' },
    update: {},
    create: { name: 'Information Technology', code: 'IT' },
  });
  const deptHR = await prisma.department.upsert({
    where: { code: 'HR' },
    update: {},
    create: { name: 'Human Resources', code: 'HR' },
  });
  const deptFin = await prisma.department.upsert({
    where: { code: 'FIN' },
    update: {},
    create: { name: 'Finance', code: 'FIN' },
  });
  const deptSup = await prisma.department.upsert({
    where: { code: 'SUP' },
    update: {},
    create: { name: 'Customer Support', code: 'SUP' },
  });
  const deptOps = await prisma.department.upsert({
    where: { code: 'OPS' },
    update: {},
    create: { name: 'Operations', code: 'OPS' },
  });

  // ── Users ─────────────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: 'admin@crm.dev' },
    update: {},
    create: { email: 'admin@crm.dev', name: 'Admin Système', password: pw, role: UserRole.ADMIN, departmentId: deptIT.id },
  });
  const clara = await prisma.user.upsert({
    where: { email: 'clara@crm.dev' },
    update: {},
    create: { email: 'clara@crm.dev', name: 'Clara Dubois', password: pw, role: UserRole.MANAGER, departmentId: deptSup.id },
  });
  const sophie = await prisma.user.upsert({
    where: { email: 'sophie@crm.dev' },
    update: {},
    create: { email: 'sophie@crm.dev', name: 'Sophie Martin', password: pw, role: UserRole.AGENT, departmentId: deptSup.id },
  });
  const marc = await prisma.user.upsert({
    where: { email: 'marc@crm.dev' },
    update: {},
    create: { email: 'marc@crm.dev', name: 'Marc Leroy', password: pw, role: UserRole.AGENT, departmentId: deptIT.id },
  });

  // ── Teams ─────────────────────────────────────────────────────────
  const teamSup = await prisma.team.upsert({
    where: { id: 'team-sup-l1' },
    update: {},
    create: {
      id: 'team-sup-l1',
      name: 'Support L1',
      description: 'Première ligne de support client',
      departmentId: deptSup.id,
      leadId: clara.id,
    },
  });
  const teamIT = await prisma.team.upsert({
    where: { id: 'team-it-infra' },
    update: {},
    create: {
      id: 'team-it-infra',
      name: 'IT Infrastructure',
      description: 'Gestion de l\'infrastructure technique',
      departmentId: deptIT.id,
      leadId: admin.id,
    },
  });

  // Assign team members
  await prisma.user.update({ where: { id: sophie.id }, data: { teamId: teamSup.id } });
  await prisma.user.update({ where: { id: clara.id }, data: { teamId: teamSup.id } });
  await prisma.user.update({ where: { id: marc.id }, data: { teamId: teamIT.id } });
  await prisma.user.update({ where: { id: admin.id }, data: { teamId: teamIT.id } });

  // ── Companies & Contacts ──────────────────────────────────────────
  const acme = await prisma.company.upsert({
    where: { id: 'company-acme' },
    update: {},
    create: {
      id: 'company-acme',
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
  const globex = await prisma.company.upsert({
    where: { id: 'company-globex' },
    update: {},
    create: {
      id: 'company-globex',
      name: 'Globex Industries',
      industry: 'Manufacturing',
      website: 'https://globex.example.com',
      city: 'Chicago',
      country: 'USA',
      size: CompanySize.LARGE,
      revenue: 50_000_000,
    },
  });

  const alice = await prisma.contact.upsert({
    where: { email: 'alice@acme.example.com' },
    update: {},
    create: { firstName: 'Alice', lastName: 'Martin', email: 'alice@acme.example.com', phone: '+1 555 0101', title: 'VP Sales', status: ContactStatus.CLIENT, companyId: acme.id },
  });
  const bob = await prisma.contact.upsert({
    where: { email: 'bob@globex.example.com' },
    update: {},
    create: { firstName: 'Bob', lastName: 'Johnson', email: 'bob@globex.example.com', phone: '+1 555 0202', title: 'Director of Procurement', status: ContactStatus.PROSPECT, companyId: globex.id },
  });

  // ── Knowledge Base ────────────────────────────────────────────────
  const catIT = await prisma.knowledgeCategory.upsert({
    where: { slug: 'it-support' },
    update: {},
    create: { name: 'IT Support', slug: 'it-support', description: 'Guides techniques et résolution de problèmes IT', icon: 'Monitor' },
  });
  const catHR = await prisma.knowledgeCategory.upsert({
    where: { slug: 'rh-procedures' },
    update: {},
    create: { name: 'RH & Procédures', slug: 'rh-procedures', description: 'Politiques RH et procédures internes', icon: 'Users' },
  });
  const catNet = await prisma.knowledgeCategory.upsert({
    where: { slug: 'reseau-securite' },
    update: {},
    create: { name: 'Réseau & Sécurité', slug: 'reseau-securite', description: 'Configuration réseau et bonnes pratiques de sécurité', icon: 'Shield', parentId: catIT.id },
  });

  await prisma.knowledgeArticle.upsert({
    where: { slug: 'reinitialiser-mot-de-passe' },
    update: {},
    create: {
      slug: 'reinitialiser-mot-de-passe',
      title: 'Comment réinitialiser votre mot de passe',
      body: `# Réinitialisation du mot de passe\n\nSi vous avez oublié votre mot de passe, suivez ces étapes :\n\n1. Rendez-vous sur la page de connexion\n2. Cliquez sur **"Mot de passe oublié"**\n3. Entrez votre adresse email professionnelle\n4. Consultez votre boîte mail et cliquez sur le lien reçu\n5. Choisissez un nouveau mot de passe (minimum 12 caractères)\n\n> **Note :** Le lien de réinitialisation est valable 24 heures.\n\n## Règles de mot de passe\n- Minimum 12 caractères\n- Au moins une majuscule, une minuscule, un chiffre\n- Ne pas réutiliser les 5 derniers mots de passe`,
      status: KnowledgeStatus.PUBLISHED,
      categoryId: catIT.id,
      authorId: admin.id,
      views: 1_247,
      helpful: 98,
      notHelpful: 4,
      tags: ['mot de passe', 'compte', 'connexion'],
    },
  });

  await prisma.knowledgeArticle.upsert({
    where: { slug: 'configuration-vpn' },
    update: {},
    create: {
      slug: 'configuration-vpn',
      title: 'Configuration du VPN d\'entreprise',
      body: `# Configuration VPN\n\n## Prérequis\n- Client GlobalProtect installé\n- Credentials Active Directory actifs\n\n## Étapes de configuration\n\n### Windows\n1. Téléchargez GlobalProtect depuis le portail IT\n2. Installez et lancez l'application\n3. Entrez l'adresse du portail : \`vpn.company.local\`\n4. Authentifiez-vous avec vos identifiants AD\n\n### macOS\n1. Même procédure, disponible pour macOS 11+\n\n## Dépannage\n- **Connexion refusée** : Vérifiez que votre compte AD n'est pas verrouillé\n- **Latence élevée** : Choisissez le gateway le plus proche géographiquement`,
      status: KnowledgeStatus.PUBLISHED,
      categoryId: catNet.id,
      authorId: marc.id,
      views: 892,
      helpful: 76,
      notHelpful: 8,
      tags: ['vpn', 'réseau', 'télétravail'],
    },
  });

  await prisma.knowledgeArticle.upsert({
    where: { slug: 'demande-conge' },
    update: {},
    create: {
      slug: 'demande-conge',
      title: 'Procédure de demande de congé',
      body: `# Demande de congé\n\n## Via le portail RH\n1. Connectez-vous au portail RH\n2. Naviguez vers **Mon Espace > Congés**\n3. Cliquez sur **Nouvelle demande**\n4. Sélectionnez le type de congé et les dates\n5. Ajoutez une note si nécessaire\n6. Soumettez pour approbation\n\n## Délais\n- Congés payés : minimum 2 semaines à l'avance\n- RTT : minimum 48h à l'avance\n- Congé exceptionnel : selon la nature de l'événement\n\n## Approbation\nVotre manager reçoit une notification et dispose de 48h pour approuver ou refuser.`,
      status: KnowledgeStatus.PUBLISHED,
      categoryId: catHR.id,
      authorId: clara.id,
      views: 2_103,
      helpful: 187,
      notHelpful: 12,
      tags: ['congé', 'rh', 'procédure'],
    },
  });

  // ── Tickets ───────────────────────────────────────────────────────
  const now = new Date();
  const h = (hours: number) => new Date(now.getTime() - hours * 3_600_000);

  const t1 = await prisma.ticket.upsert({
    where: { number: 'TKT-0001' },
    update: {},
    create: {
      number: 'TKT-0001',
      title: 'Serveur de production inaccessible',
      description: 'Le serveur web principal (prod-web-01) ne répond plus depuis 09h15. Toutes les requêtes HTTP retournent une erreur 502. Impact : toute la plateforme e-commerce est hors ligne.',
      status: TicketStatus.OPEN,
      priority: TicketPriority.CRITICAL,
      type: TicketType.INCIDENT,
      source: TicketSource.PHONE,
      category: 'Infrastructure',
      tags: ['serveur', 'production', 'urgence'],
      assigneeId: marc.id,
      teamId: teamIT.id,
      departmentId: deptIT.id,
      contactId: alice.id,
      companyId: acme.id,
      slaPolicyId: slaCritical.id,
      firstResponseAt: h(1),
      dueAt: new Date(now.getTime() + 3 * 3_600_000),
      createdById: sophie.id,
    },
  });

  const t2 = await prisma.ticket.upsert({
    where: { number: 'TKT-0002' },
    update: {},
    create: {
      number: 'TKT-0002',
      title: 'Problème de synchronisation Outlook',
      description: 'Depuis la mise à jour d\'Outlook déployée hier matin, les emails ne se synchronisent plus sur les appareils mobiles. Affecte environ 150 utilisateurs.',
      status: TicketStatus.PENDING,
      priority: TicketPriority.HIGH,
      type: TicketType.INCIDENT,
      source: TicketSource.PORTAL,
      category: 'Messagerie',
      tags: ['outlook', 'mobile', 'email'],
      assigneeId: sophie.id,
      teamId: teamSup.id,
      departmentId: deptSup.id,
      slaPolicyId: slaHigh.id,
      firstResponseAt: h(3),
      dueAt: new Date(now.getTime() + 5 * 3_600_000),
      createdById: sophie.id,
    },
  });

  const t3 = await prisma.ticket.upsert({
    where: { number: 'TKT-0003' },
    update: {},
    create: {
      number: 'TKT-0003',
      title: 'Demande d\'accès au système SAP',
      description: 'Nouveau collaborateur (démarrage 15/05) a besoin d\'un accès en lecture sur les modules FI et CO de SAP. Manager : Clara Dubois.',
      status: TicketStatus.NEW,
      priority: TicketPriority.MEDIUM,
      type: TicketType.SERVICE_REQUEST,
      source: TicketSource.PORTAL,
      category: 'Accès & Habilitations',
      tags: ['sap', 'accès', 'onboarding'],
      departmentId: deptIT.id,
      slaPolicyId: slaMedium.id,
      dueAt: new Date(now.getTime() + 24 * 3_600_000),
      createdById: clara.id,
    },
  });

  const t4 = await prisma.ticket.upsert({
    where: { number: 'TKT-0004' },
    update: {},
    create: {
      number: 'TKT-0004',
      title: 'Lenteurs réseau bâtiment B — étage 3',
      description: 'Les équipes situées au 3ème étage du bâtiment B signalent des lenteurs importantes depuis lundi. Bande passante mesurée : 2 Mbps au lieu des 1 Gbps habituels.',
      status: TicketStatus.ON_HOLD,
      priority: TicketPriority.HIGH,
      type: TicketType.PROBLEM,
      source: TicketSource.EMAIL,
      category: 'Réseau',
      tags: ['réseau', 'lenteur', 'bâtiment-b'],
      assigneeId: marc.id,
      teamId: teamIT.id,
      departmentId: deptIT.id,
      slaPolicyId: slaHigh.id,
      firstResponseAt: h(24),
      dueAt: h(-2),
      slaBreached: true,
      createdById: marc.id,
    },
  });

  const t5 = await prisma.ticket.upsert({
    where: { number: 'TKT-0005' },
    update: {},
    create: {
      number: 'TKT-0005',
      title: 'Migration Windows 11 — poste direction',
      description: 'Planifier et exécuter la migration vers Windows 11 des 12 postes de la direction générale. Intervention en dehors des heures ouvrées.',
      status: TicketStatus.RESOLVED,
      priority: TicketPriority.MEDIUM,
      type: TicketType.CHANGE,
      source: TicketSource.PORTAL,
      category: 'Poste de travail',
      tags: ['windows', 'migration', 'direction'],
      assigneeId: marc.id,
      teamId: teamIT.id,
      departmentId: deptIT.id,
      slaPolicyId: slaMedium.id,
      firstResponseAt: h(72),
      resolvedAt: h(2),
      dueAt: h(4),
      satisfactionScore: 5,
      satisfactionNote: 'Migration réalisée sans interruption, parfait !',
      createdById: admin.id,
    },
  });

  const t6 = await prisma.ticket.upsert({
    where: { number: 'TKT-0006' },
    update: {},
    create: {
      number: 'TKT-0006',
      title: 'Imprimante RH — bourrage papier récurrent',
      description: 'L\'imprimante du département RH (modèle HP LaserJet Pro M404n, SN: CNB8R12345) présente des bourrages papier toutes les 20 impressions environ.',
      status: TicketStatus.CLOSED,
      priority: TicketPriority.LOW,
      type: TicketType.INCIDENT,
      source: TicketSource.PHONE,
      category: 'Matériel',
      tags: ['imprimante', 'rh', 'matériel'],
      assigneeId: sophie.id,
      teamId: teamSup.id,
      departmentId: deptSup.id,
      slaPolicyId: slaLow.id,
      firstResponseAt: h(120),
      resolvedAt: h(100),
      closedAt: h(96),
      dueAt: h(110),
      satisfactionScore: 4,
      createdById: sophie.id,
    },
  });

  // ── Ticket Comments ───────────────────────────────────────────────
  await prisma.ticketComment.createMany({
    skipDuplicates: true,
    data: [
      {
        id: 'cmt-001',
        ticketId: t1.id,
        authorId: marc.id,
        body: 'J\'ai pris le ticket en charge. Analyse des logs en cours sur prod-web-01. Le service nginx semble planté.',
        isInternal: true,
      },
      {
        id: 'cmt-002',
        ticketId: t1.id,
        authorId: marc.id,
        body: 'Le service a été redémarré. La plateforme est de nouveau accessible. En attente de confirmation de l\'utilisateur.',
        isInternal: false,
      },
      {
        id: 'cmt-003',
        ticketId: t2.id,
        authorId: sophie.id,
        body: 'Nous avons identifié le problème : la mise à jour 16.0.18726 génère un conflit avec le profil Exchange. Un patch est en cours de déploiement par Microsoft.',
        isInternal: false,
      },
      {
        id: 'cmt-004',
        ticketId: t4.id,
        authorId: marc.id,
        body: 'Investigation : switch du 3ème étage (SW-B3) présente des erreurs CRC anormales. En attente de validation pour remplacement matériel.',
        isInternal: true,
      },
    ],
  });

  // ── Ticket Activities ─────────────────────────────────────────────
  await prisma.ticketActivity.createMany({
    skipDuplicates: true,
    data: [
      { id: 'act-001', ticketId: t1.id, userId: sophie.id, type: 'created', meta: {} },
      { id: 'act-002', ticketId: t1.id, userId: marc.id, type: 'assigned', meta: { to: 'Marc Leroy' } },
      { id: 'act-003', ticketId: t1.id, userId: marc.id, type: 'status_changed', meta: { from: 'NEW', to: 'OPEN' } },
      { id: 'act-004', ticketId: t2.id, userId: sophie.id, type: 'created', meta: {} },
      { id: 'act-005', ticketId: t2.id, userId: sophie.id, type: 'status_changed', meta: { from: 'OPEN', to: 'PENDING' } },
      { id: 'act-006', ticketId: t5.id, userId: marc.id, type: 'status_changed', meta: { from: 'OPEN', to: 'RESOLVED' } },
    ],
  });

  // ── Opportunities ─────────────────────────────────────────────────
  await prisma.opportunity.upsert({
    where: { id: 'opp-001' },
    update: {},
    create: {
      id: 'opp-001',
      title: 'Acme — Licence Enterprise',
      value: 120_000,
      stage: OpportunityStage.NEGOTIATION,
      probability: 75,
      closeDate: new Date('2026-06-30'),
      contactId: alice.id,
      companyId: acme.id,
      assignedToId: admin.id,
    },
  });
  await prisma.opportunity.upsert({
    where: { id: 'opp-002' },
    update: {},
    create: {
      id: 'opp-002',
      title: 'Globex — Pilot Project',
      value: 45_000,
      stage: OpportunityStage.PROPOSAL,
      probability: 50,
      closeDate: new Date('2026-07-15'),
      contactId: bob.id,
      companyId: globex.id,
      assignedToId: admin.id,
    },
  });
  await prisma.opportunity.upsert({
    where: { id: 'opp-003' },
    update: {},
    create: {
      id: 'opp-003',
      title: 'Globex — Full Deployment',
      value: 380_000,
      stage: OpportunityStage.QUALIFIED,
      probability: 30,
      closeDate: new Date('2026-12-01'),
      contactId: bob.id,
      companyId: globex.id,
      assignedToId: admin.id,
    },
  });

  console.log('✅ Seed ITSM complet — admin@crm.dev / admin1234');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
