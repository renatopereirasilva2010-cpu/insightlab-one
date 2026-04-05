import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { CashRegisterController } from './cash-register.controller';
import { CashRegisterService } from './cash-register.service';

@Module({
  imports: [DatabaseModule],
  controllers: [CashRegisterController],
  providers: [CashRegisterService],
  exports: [CashRegisterService],
})
export class CashRegisterModule {}
