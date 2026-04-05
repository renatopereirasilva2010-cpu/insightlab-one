import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AdminMasterController } from './admin-master.controller';
import { AdminMasterService } from './admin-master.service';

@Module({
  imports: [DatabaseModule],
  controllers: [AdminMasterController],
  providers: [AdminMasterService],
  exports: [AdminMasterService],
})
export class AdminMasterModule {}
