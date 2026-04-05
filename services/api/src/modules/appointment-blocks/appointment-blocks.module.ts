import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AppointmentBlocksController } from './appointment-blocks.controller';
import { AppointmentBlocksService } from './appointment-blocks.service';

@Module({
  imports: [DatabaseModule],
  controllers: [AppointmentBlocksController],
  providers: [AppointmentBlocksService],
  exports: [AppointmentBlocksService],
})
export class AppointmentBlocksModule {}
