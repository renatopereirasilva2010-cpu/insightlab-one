import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { FiscalDocumentsController } from './fiscal-documents.controller';
import { FiscalDocumentsService } from './fiscal-documents.service';
import { FISCAL_PROVIDER } from './providers/fiscal-provider.interface';
import { NullFiscalProvider } from './providers/null-fiscal-provider';

@Module({
  imports: [DatabaseModule],
  controllers: [FiscalDocumentsController],
  providers: [
    FiscalDocumentsService,
    { provide: FISCAL_PROVIDER, useClass: NullFiscalProvider },
  ],
  exports: [FiscalDocumentsService],
})
export class FiscalDocumentsModule {}