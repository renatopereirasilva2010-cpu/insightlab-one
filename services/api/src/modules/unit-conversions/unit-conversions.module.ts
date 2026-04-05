import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { UnitConversionsController } from './unit-conversions.controller';
import { UnitConversionsService } from './unit-conversions.service';

@Module({
  imports: [DatabaseModule],
  controllers: [UnitConversionsController],
  providers: [UnitConversionsService],
  exports: [UnitConversionsService],
})
export class UnitConversionsModule {}
