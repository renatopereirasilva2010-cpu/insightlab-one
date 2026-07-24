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
  { code: 'professionals.read', name: 'Read professionals', module: 'professionals' },
  { code: 'professionals.create', name: 'Create professionals', module: 'professionals' },
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
  { code: 'attendances.cancel', name: 'Cancel attendances', module: 'attendances' },
  { code: 'attendances.create', name: 'Create attendances', module: 'attendances' },
  { code: 'attendances.finish', name: 'Finish attendances', module: 'attendances' },
  { code: 'attendances.read', name: 'Read attendances', module: 'attendances' },
  { code: 'attendances.start', name: 'Start attendances', module: 'attendances' },
  { code: 'cash-register.close', name: 'Close cash register', module: 'cash-register' },
  { code: 'cash-register.open', name: 'Open cash register', module: 'cash-register' },
  { code: 'cash-register.read', name: 'Read cash register', module: 'cash-register' },
  { code: 'commissions.block', name: 'Block commissions', module: 'commissions' },
  { code: 'commissions.generate', name: 'Generate commissions', module: 'commissions' },
  { code: 'commissions.read', name: 'Read commissions', module: 'commissions' },
  { code: 'commissions.release', name: 'Release commissions', module: 'commissions' },
  { code: 'payments.create', name: 'Create payments', module: 'payments' },
  { code: 'payments.read', name: 'Read payments', module: 'payments' },
  { code: 'payments.receive', name: 'Receive payments', module: 'payments' },
  { code: 'payments.update-status', name: 'Update payment status', module: 'payments' },
  { code: 'products.create', name: 'Create products', module: 'products' },
  { code: 'products.read', name: 'Read products', module: 'products' },
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
  { code: 'unit-conversions.create', name: 'Create unit conversions', module: 'unit-conversions' },
  { code: 'unit-conversions.read', name: 'Read unit conversions', module: 'unit-conversions' },
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