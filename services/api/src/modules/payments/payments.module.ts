import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { FiscalDocumentsModule } from '../fiscal-documents/fiscal-documents.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [DatabaseModule, FiscalDocumentsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
