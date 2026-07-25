import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuditLogModule } from './common/audit/audit-log.module';
import { RequestContextMiddleware } from './common/middleware/request-context.middleware';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { UnitsModule } from './modules/units/units.module';
import { BusinessSettingsModule } from './modules/business-settings/business-settings.module';
import { ClientsModule } from './modules/clients/clients.module';
import { ProfessionalsModule } from './modules/professionals/professionals.module';
import { ServicesCatalogModule } from './modules/services-catalog/services-catalog.module';
import { ProductsModule } from './modules/products/products.module';
import { SuppliesModule } from './modules/supplies/supplies.module';
import { ResourcesModule } from './modules/resources/resources.module';
import { UnitConversionsModule } from './modules/unit-conversions/unit-conversions.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { AvailabilityModule } from './modules/availability/availability.module';
import { AppointmentBlocksModule } from './modules/appointment-blocks/appointment-blocks.module';
import { AttendancesModule } from './modules/attendances/attendances.module';
import { SalesModule } from './modules/sales/sales.module';
import { SaleItemsModule } from './modules/sale-items/sale-items.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { CashRegisterModule } from './modules/cash-register/cash-register.module';
import { CommissionsModule } from './modules/commissions/commissions.module';
import { AdminMasterModule } from './modules/admin-master/admin-master.module';
import { BillingAdminModule } from './modules/billing-admin/billing-admin.module';
import { FeatureEntitlementsModule } from './modules/feature-entitlements/feature-entitlements.module';
import { FiscalDocumentsModule } from './modules/fiscal-documents/fiscal-documents.module';

@Module({
  controllers: [AppController],
  imports: [
    DatabaseModule,
    AuditLogModule,
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    TenantsModule,
    UnitsModule,
    BusinessSettingsModule,
    ClientsModule,
    ProfessionalsModule,
    ServicesCatalogModule,
    ProductsModule,
    SuppliesModule,
    ResourcesModule,
    UnitConversionsModule,
    AppointmentsModule,
    AvailabilityModule,
    AppointmentBlocksModule,
    AttendancesModule,
    SalesModule,
    SaleItemsModule,
    PaymentsModule,
    CashRegisterModule,
    CommissionsModule,
    AdminMasterModule,
    BillingAdminModule,
    FeatureEntitlementsModule,
    FiscalDocumentsModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
