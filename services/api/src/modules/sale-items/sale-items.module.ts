import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { SaleItemsController } from './sale-items.controller';
import { SaleItemsService } from './sale-items.service';

@Module({
  imports: [DatabaseModule],
  controllers: [SaleItemsController],
  providers: [SaleItemsService],
  exports: [SaleItemsService],
})
export class SaleItemsModule {}
