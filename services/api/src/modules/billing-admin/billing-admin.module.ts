import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { BillingAdminController } from './billing-admin.controller';
import { BillingAdminService } from './billing-admin.service';

@Module({
  imports: [DatabaseModule],
  controllers: [BillingAdminController],
  providers: [BillingAdminService],
  exports: [BillingAdminService],
})
export class BillingAdminModule {}
