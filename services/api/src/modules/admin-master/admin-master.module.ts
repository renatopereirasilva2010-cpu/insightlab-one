import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AdminMasterController } from './admin-master.controller';
import { AdminMasterService } from './admin-master.service';
import { ClientImportService } from './client-import.service';

@Module({
  imports: [DatabaseModule],
  controllers: [AdminMasterController],
  providers: [AdminMasterService, ClientImportService],
  exports: [AdminMasterService, ClientImportService],
})
export class AdminMasterModule {}
