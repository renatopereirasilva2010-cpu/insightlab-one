import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AppointmentsModule } from '../appointments/appointments.module';
import { LegalModule } from '../legal/legal.module';
import { PublicBookingController } from './public-booking.controller';
import { PublicBookingService } from './public-booking.service';

@Module({
  imports: [DatabaseModule, AppointmentsModule, LegalModule],
  controllers: [PublicBookingController],
  providers: [PublicBookingService],
})
export class PublicBookingModule {}
