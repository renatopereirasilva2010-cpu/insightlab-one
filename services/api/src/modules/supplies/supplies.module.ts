import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { SuppliesController } from './supplies.controller';
import { SuppliesService } from './supplies.service';

@Module({
  imports: [DatabaseModule],
  controllers: [SuppliesController],
  providers: [SuppliesService],
  exports: [SuppliesService],
})
export class SuppliesModule {}
