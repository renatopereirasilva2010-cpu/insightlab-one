import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { BusinessSettingsController } from './business-settings.controller';
import { BusinessSettingsService } from './business-settings.service';

@Module({
  imports: [DatabaseModule],
  controllers: [BusinessSettingsController],
  providers: [BusinessSettingsService],
  exports: [BusinessSettingsService],
})
export class BusinessSettingsModule {}
