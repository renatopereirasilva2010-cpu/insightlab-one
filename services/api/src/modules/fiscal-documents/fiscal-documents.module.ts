import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { FiscalDocumentsController } from './fiscal-documents.controller';
import { FiscalDocumentsService } from './fiscal-documents.service';

@Module({
  imports: [DatabaseModule],
  controllers: [FiscalDocumentsController],
  providers: [FiscalDocumentsService],
  exports: [FiscalDocumentsService],
})
export class FiscalDocumentsModule {}