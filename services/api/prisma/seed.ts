import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const permissions = [
  { code: 'auth.login', name: 'Login', module: 'auth' },
  { code: 'auth.refresh', name: 'Refresh session', module: 'auth' },
  { code: 'users.read', name: 'Read users', module: 'users' },
  { code: 'users.create', name: 'Create users', module: 'users' },
  { code: 'users.update', name: 'Update users', module: 'users' },
  { code: 'users.block', name: 'Block users', module: 'users' },
  { code: 'roles.read', name: 'Read roles', module: 'roles' },
  { code: 'roles.assign', name: 'Assign roles', module: 'roles' },
  { code: 'tenants.read', name: 'Read tenants', module: 'tenants' },
  { code: 'tenants.update', name: 'Update tenants', module: 'tenants' },
  { code: 'units.read', name: 'Read units', module: 'units' },
  { code: 'units.create', name: 'Create units', module: 'units' },
  { code: 'units.update', name: 'Update units', module: 'units' },
  { code: 'settings.read', name: 'Read settings', module: 'business-settings' },
  { code: 'settings.update', name: 'Update settings', module: 'business-settings' },
  { code: 'audit.read', name: 'Read audit logs', module: 'audit' },
  { code: 'clients.read', name: 'Read clients', module: 'clients' },
  { code: 'clients.create', name: 'Create clients', module: 'clients' },
  { code: 'clients.update', name: 'Update clients', module: 'clients' },
  { code: 'professionals.read', name: 'Read professionals', module: 'professionals' },
  { code: 'professionals.create', name: 'Create professionals', module: 'professionals' },
  { code: 'professionals.update', name: 'Update professionals', module: 'professionals' },
  { code: 'availability.read', name: 'Read availability', module: 'availability' },
  { code: 'availability.create', name: 'Create availability', module: 'availability' },
  { code: 'availability.update', name: 'Update availability', module: 'availability' },
  { code: 'fiscal-documents.read', name: 'Read fiscal documents', module: 'fiscal-documents' },
  { code: 'fiscal-documents.create', name: 'Create fiscal documents', module: 'fiscal-documents' },
  { code: 'fiscal-documents.update-status', name: 'Update fiscal document status', module: 'fiscal-documents' },
  { code: 'admin-master.migration.create', name: 'Migration.Create admin master', module: 'admin-master' },
  { code: 'admin-master.migration.import', name: 'Migration.Import admin master', module: 'admin-master' },
  { code: 'admin-master.migration.reconcile', name: 'Migration.Reconcile admin master', module: 'admin-master' },
  { code: 'admin-master.read', name: 'Read admin master', module: 'admin-master' },
  { code: 'appointments.block', name: 'Block appointments', module: 'appointments' },
  { code: 'appointments.cancel', name: 'Cancel appointments', module: 'appointments' },
  { code: 'appointments.create', name: 'Create appointments', module: 'appointments' },
  { code: 'appointments.no_show', name: 'No Show appointments', module: 'appointments' },
  { code: 'appointments.read', name: 'Read appointments', module: 'appointments' },
  { code: 'appointments.update', name: 'Update appointments', module: 'appointments' },
  { code: 'attendances.cancel', name: 'Cancel attendances', module: 'attendances' },
  { code: 'attendances.create', name: 'Create attendances', module: 'attendances' },
  { code: 'attendances.finish', name: 'Finish attendances', module: 'attendances' },
  { code: 'attendances.read', name: 'Read attendances', module: 'attendances' },
  { code: 'attendances.start', name: 'Start attendances', module: 'attendances' },
  { code: 'cash-register.close', name: 'Close cash register', module: 'cash-register' },
  { code: 'cash-register.open', name: 'Open cash register', module: 'cash-register' },
  { code: 'cash-register.read', name: 'Read cash register', module: 'cash-register' },
  { code: 'commissions.block', name: 'Block commissions', module: 'commissions' },
  { code: 'commissions.cancel', name: 'Cancel commissions', module: 'commissions' },
  { code: 'commissions.generate', name: 'Generate commissions', module: 'commissions' },
  { code: 'commissions.read', name: 'Read commissions', module: 'commissions' },
  { code: 'commissions.read-own', name: 'Read own commissions', module: 'commissions' },
  { code: 'commissions.release', name: 'Release commissions', module: 'commissions' },
  { code: 'commission-payouts.read', name: 'Read commission payouts', module: 'commissions' },
  { code: 'commission-payouts.read-own', name: 'Read own commission payouts', module: 'commissions' },
  { code: 'commission-payouts.update', name: 'Update commission payouts', module: 'commissions' },
  { code: 'payments.create', name: 'Create payments', module: 'payments' },
  { code: 'payments.read', name: 'Read payments', module: 'payments' },
  { code: 'payments.receive', name: 'Receive payments', module: 'payments' },
  { code: 'payments.update-status', name: 'Update payment status', module: 'payments' },
  { code: 'products.create', name: 'Create products', module: 'products' },
  { code: 'products.read', name: 'Read products', module: 'products' },
  { code: 'products.update', name: 'Update products', module: 'products' },
  { code: 'resources.create', name: 'Create resources', module: 'resources' },
  { code: 'resources.read', name: 'Read resources', module: 'resources' },
  { code: 'sales.cancel', name: 'Cancel sales', module: 'sales' },
  { code: 'sales.checkout', name: 'Checkout sales', module: 'sales' },
  { code: 'sales.create', name: 'Create sales', module: 'sales' },
  { code: 'sales.read', name: 'Read sales', module: 'sales' },
  { code: 'sales.update', name: 'Update sales', module: 'sales' },
  { code: 'services.create', name: 'Create services', module: 'services' },
  { code: 'services.read', name: 'Read services', module: 'services' },
  { code: 'services.update', name: 'Update services', module: 'services' },
  { code: 'supplies.create', name: 'Create supplies', module: 'supplies' },
  { code: 'supplies.read', name: 'Read supplies', module: 'supplies' },
  { code: 'supplies.update', name: 'Update supplies', module: 'supplies' },
  { code: 'supplies.movements.create', name: 'Register supply movements', module: 'supplies' },
  { code: 'supplies.movements.read', name: 'Read supply movement history', module: 'supplies' },
  { code: 'unit-conversions.create', name: 'Create unit conversions', module: 'unit-conversions' },
  { code: 'unit-conversions.read', name: 'Read unit conversions', module: 'unit-conversions' },
  { code: 'whatsapp.read', name: 'Read WhatsApp message history', module: 'whatsapp' },
  { code: 'whatsapp.resend', name: 'Resend a WhatsApp message', module: 'whatsapp' },
  { code: 'data-subject-requests.read', name: 'Read LGPD data subject requests', module: 'legal' },
  { code: 'data-subject-requests.update', name: 'Resolve LGPD data subject requests', module: 'legal' },
];

async function main() {
  for (const p of permissions) {
    await prisma.permission.upsert({
      where: { code: p.code },
      update: {},
      create: p,
    });
  }

  const tenant = await prisma.tenant.upsert({
    where: { slug: 'mix-demo' },
    update: {},
    create: {
      name: 'Mix Demo',
      slug: 'mix-demo',
    },
  });

  const unit = await prisma.unit.create({
    data: {
      tenantId: tenant.id,
      name: 'Unidade Principal',
      code: 'MIX-01',
    },
  }).catch(async () => {
    const existing = await prisma.unit.findFirst({ where: { tenantId: tenant.id, code: 'MIX-01' } });
    return existing!;
  });

  const adminRole = await prisma.role.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: 'ADMIN' } },
    update: {},
    create: {
      tenantId: tenant.id,
      code: 'ADMIN',
      name: 'Administrador',
      description: 'Perfil administrativo',
    },
  });

  const allPermissions = await prisma.permission.findMany();
  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: permission.id } },
      update: {},
      create: { roleId: adminRole.id, permissionId: permission.id },
    });
  }

  await prisma.businessSettings.upsert({
    where: { tenantId: tenant.id },
    update: {},
    create: {
      tenantId: tenant.id,
      timezone: 'America/Sao_Paulo',
      currency: 'BRL',
    },
  });

  const passwordHash = await bcrypt.hash('Admin@12345', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@mix-demo.local' },
    update: {},
    create: {
      tenantId: tenant.id,
      unitId: unit.id,
      name: 'Admin Demo',
      email: 'admin@mix-demo.local',
      passwordHash,
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
    update: {},
    create: { userId: adminUser.id, roleId: adminRole.id },
  });

  // Papel restrito - para validar 403 com credencial real (gap registrado em
  // governance/RELATORIO_CODEX_LAB_COMPLEMENTAR_POS_V55.md: só existia admin no Lab).
  const restrictedPermissionCodes = [
    'auth.login',
    'auth.refresh',
    'clients.read',
    'appointments.read',
    'sales.read',
  ];
  const restrictedPermissions = await prisma.permission.findMany({
    where: { code: { in: restrictedPermissionCodes } },
  });

  const operatorRole = await prisma.role.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: 'OPERADOR_RESTRITO' } },
    update: {},
    create: {
      tenantId: tenant.id,
      code: 'OPERADOR_RESTRITO',
      name: 'Operador Restrito',
      description: 'Papel de teste com permissões mínimas, para validar 403 em endpoints protegidos',
    },
  });

  for (const permission of restrictedPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: operatorRole.id, permissionId: permission.id } },
      update: {},
      create: { roleId: operatorRole.id, permissionId: permission.id },
    });
  }

  const operatorPasswordHash = await bcrypt.hash('Operador@12345', 10);

  const operatorUser = await prisma.user.upsert({
    where: { email: 'operador.restrito@mix-demo.local' },
    update: {},
    create: {
      tenantId: tenant.id,
      unitId: unit.id,
      name: 'Operador Restrito Demo',
      email: 'operador.restrito@mix-demo.local',
      passwordHash: operatorPasswordHash,
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: operatorUser.id, roleId: operatorRole.id } },
    update: {},
    create: { userId: operatorUser.id, roleId: operatorRole.id },
  });

  // Papel profissional - login somente-leitura escopado à própria comissão
  // (governance/insightlab-one-onda3-benchmark-revisao-backlog.md, ONDA 3 FASE 1).
  const professionalPermissionCodes = [
    'auth.login',
    'auth.refresh',
    'commissions.read-own',
    'commission-payouts.read-own',
  ];
  const professionalPermissions = await prisma.permission.findMany({
    where: { code: { in: professionalPermissionCodes } },
  });

  const professionalRole = await prisma.role.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: 'PROFISSIONAL' } },
    update: {},
    create: {
      tenantId: tenant.id,
      code: 'PROFISSIONAL',
      name: 'Profissional',
      description: 'Login do profissional - só enxerga o próprio extrato de comissão',
    },
  });

  for (const permission of professionalPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: professionalRole.id, permissionId: permission.id } },
      update: {},
      create: { roleId: professionalRole.id, permissionId: permission.id },
    });
  }

  const demoProfessional = await prisma.professional.upsert({
    where: { id: 'seed-professional-demo' },
    update: {},
    create: {
      id: 'seed-professional-demo',
      tenantId: tenant.id,
      unitId: unit.id,
      name: 'Profissional Demo (Seed)',
      roleTitle: 'Cabeleireiro(a)',
      commissionRate: 35,
    },
  });

  const professionalPasswordHash = await bcrypt.hash('Profissional@12345', 10);

  const professionalUser = await prisma.user.upsert({
    where: { email: 'profissional.demo.login@mix-demo.local' },
    update: { professionalId: demoProfessional.id },
    create: {
      tenantId: tenant.id,
      unitId: unit.id,
      name: demoProfessional.name,
      email: 'profissional.demo.login@mix-demo.local',
      passwordHash: professionalPasswordHash,
      professionalId: demoProfessional.id,
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: professionalUser.id, roleId: professionalRole.id } },
    update: {},
    create: { userId: professionalUser.id, roleId: professionalRole.id },
  });

  // Papel Gerente - gestao operacional completa, exceto dado critico do
  // sistema (plataforma multi-tenant, identidade legal/fiscal do tenant,
  // atribuicao de papeis/permissoes, trilha de auditoria e solicitacoes
  // de titular LGPD). Pedido por Renato em 29/07/2026, seguindo o padrao
  // de mercado (Vagaro separa "Admin" operacional de "Manage/Supervisor").
  const gerenteExcludedPrefixes = ['admin-master.'];
  const gerenteExcludedCodes = [
    'tenants.update',
    'units.update',
    'roles.assign',
    'audit.read',
    'data-subject-requests.read',
    'data-subject-requests.update',
  ];
  const gerentePermissions = allPermissions.filter(
    (p) =>
      !gerenteExcludedPrefixes.some((prefix) => p.code.startsWith(prefix)) &&
      !gerenteExcludedCodes.includes(p.code),
  );

  const gerenteRole = await prisma.role.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: 'GERENTE' } },
    update: {},
    create: {
      tenantId: tenant.id,
      code: 'GERENTE',
      name: 'Gerente',
      description:
        'Gestao operacional completa (agenda, vendas, financeiro, comissao, equipe, configuracoes de negocio), sem acesso a dado critico do sistema (identidade legal do tenant, atribuicao de papeis, auditoria, LGPD).',
    },
  });

  for (const permission of gerentePermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: gerenteRole.id, permissionId: permission.id } },
      update: {},
      create: { roleId: gerenteRole.id, permissionId: permission.id },
    });
  }

  const gerentePasswordHash = await bcrypt.hash('Gerente@12345', 10);

  const gerenteUser = await prisma.user.upsert({
    where: { email: 'gerente.demo@mix-demo.local' },
    update: {},
    create: {
      tenantId: tenant.id,
      unitId: unit.id,
      name: 'Gerente Demo',
      email: 'gerente.demo@mix-demo.local',
      passwordHash: gerentePasswordHash,
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: gerenteUser.id, roleId: gerenteRole.id } },
    update: {},
    create: { userId: gerenteUser.id, roleId: gerenteRole.id },
  });

  // Papel Recepcao - balcao: agenda, atendimento, venda/checkout, pagamento,
  // caixa, e leitura de catalogo pra vender - sem comissao, configuracoes,
  // usuarios/papeis ou edicao de documento fiscal. Padrao "front desk" do
  // mercado (Vagaro, Fresha).
  const recepcaoPermissionCodes = [
    'auth.login',
    'auth.refresh',
    'clients.read',
    'clients.create',
    'clients.update',
    'professionals.read',
    'availability.read',
    'appointments.read',
    'appointments.create',
    'appointments.update',
    'appointments.cancel',
    'appointments.no_show',
    'attendances.read',
    'attendances.create',
    'attendances.start',
    'attendances.finish',
    'attendances.cancel',
    'sales.read',
    'sales.create',
    'sales.update',
    'sales.checkout',
    'payments.read',
    'payments.create',
    'payments.receive',
    'payments.update-status',
    'cash-register.read',
    'cash-register.open',
    'cash-register.close',
    'services.read',
    'products.read',
    'fiscal-documents.read',
  ];
  const recepcaoPermissions = await prisma.permission.findMany({
    where: { code: { in: recepcaoPermissionCodes } },
  });

  const recepcaoRole = await prisma.role.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: 'RECEPCAO' } },
    update: {},
    create: {
      tenantId: tenant.id,
      code: 'RECEPCAO',
      name: 'Recepção',
      description:
        'Balcao: agenda, atendimento, venda/checkout, pagamento e caixa. Sem acesso a comissao, configuracoes, usuarios/papeis ou edicao de documento fiscal.',
    },
  });

  for (const permission of recepcaoPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: recepcaoRole.id, permissionId: permission.id } },
      update: {},
      create: { roleId: recepcaoRole.id, permissionId: permission.id },
    });
  }

  const recepcaoPasswordHash = await bcrypt.hash('Recepcao@12345', 10);

  const recepcaoUser = await prisma.user.upsert({
    where: { email: 'recepcao.demo@mix-demo.local' },
    update: {},
    create: {
      tenantId: tenant.id,
      unitId: unit.id,
      name: 'Recepção Demo',
      email: 'recepcao.demo@mix-demo.local',
      passwordHash: recepcaoPasswordHash,
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: recepcaoUser.id, roleId: recepcaoRole.id } },
    update: {},
    create: { userId: recepcaoUser.id, roleId: recepcaoRole.id },
  });

  await prisma.legalDocument.upsert({
    where: { type_version: { type: 'TERMS_OF_USE', version: 'v1' } },
    update: {},
    create: {
      type: 'TERMS_OF_USE',
      version: 'v1',
      title: 'Termos de Uso do InsightLab One',
      content:
        '[RASCUNHO — pendente de revisão jurídica antes de valer como termo definitivo]\n\n' +
        'Ao usar o InsightLab One, você concorda em utilizar a plataforma exclusivamente para a gestão ' +
        'do seu negócio (agenda, atendimento, vendas, pagamentos, comissões e módulos correlatos), ' +
        'respeitando a legislação aplicável, incluindo a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018). ' +
        'Você é responsável pela veracidade dos dados inseridos e pelo controle de acesso da sua equipe ao sistema.',
    },
  });

  await prisma.legalDocument.upsert({
    where: { type_version: { type: 'PRIVACY_POLICY', version: 'v1' } },
    update: {},
    create: {
      type: 'PRIVACY_POLICY',
      version: 'v1',
      title: 'Política de Privacidade do InsightLab One',
      content:
        '[RASCUNHO — pendente de revisão jurídica antes de valer como política definitiva]\n\n' +
        'Coletamos os dados pessoais necessários para operar sua agenda e atendimento (nome, telefone, ' +
        'e-mail e histórico de serviços), com base no seu consentimento e/ou na execução do contrato de ' +
        'prestação de serviço. Você (titular dos dados) pode solicitar acesso, correção, portabilidade, ' +
        'exclusão ou revogação de consentimento a qualquer momento pelo canal de solicitações do titular. ' +
        'Não compartilhamos seus dados com terceiros fora do necessário para operar o serviço contratado.',
    },
  });

  console.log('Seed concluído com sucesso.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });