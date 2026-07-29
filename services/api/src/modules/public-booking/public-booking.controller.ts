import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { CreatePublicAppointmentDto } from './dto/create-public-appointment.dto';
import { PublicBookingService } from './public-booking.service';

/**
 * Endpoints publicos (sem auth) para o widget de agendamento embutivel.
 * Rate limit mais apertado que o padrao global - superficie exposta a
 * qualquer visitante da internet, nao so usuario logado.
 */
@Controller('v1/public/:tenantSlug')
export class PublicBookingController {
  constructor(private readonly publicBookingService: PublicBookingService) {}

  @Get()
  getBusiness(@Param('tenantSlug') tenantSlug: string) {
    return this.publicBookingService.getBusiness(tenantSlug);
  }

  @Get('services')
  listServices(@Param('tenantSlug') tenantSlug: string) {
    return this.publicBookingService.listServices(tenantSlug);
  }

  @Get('professionals')
  listProfessionals(@Param('tenantSlug') tenantSlug: string) {
    return this.publicBookingService.listProfessionals(tenantSlug);
  }

  @Get('availability')
  getAvailability(
    @Param('tenantSlug') tenantSlug: string,
    @Query('professionalId') professionalId: string,
    @Query('weekday') weekday: string,
  ) {
    return this.publicBookingService.getAvailability(tenantSlug, professionalId, Number(weekday));
  }

  @Post('appointments')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  createAppointment(
    @Param('tenantSlug') tenantSlug: string,
    @Body() dto: CreatePublicAppointmentDto,
    @Req() req: Request,
  ) {
    const forwardedFor = req.headers['x-forwarded-for'];
    const ipAddress =
      (typeof forwardedFor === 'string' ? forwardedFor.split(',')[0].trim() : null) ??
      req.socket?.remoteAddress ??
      null;
    const userAgent = (req.headers['user-agent'] as string | undefined) ?? null;

    return this.publicBookingService.createAppointment(tenantSlug, dto, { ipAddress, userAgent });
  }
}
