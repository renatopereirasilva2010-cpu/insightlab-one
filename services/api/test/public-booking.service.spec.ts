import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../src/database/prisma.service';
import { AppointmentsService } from '../src/modules/appointments/appointments.service';
import { PublicBookingService } from '../src/modules/public-booking/public-booking.service';

describe('PublicBookingService', () => {
  let service: PublicBookingService;
  let appointmentsService: { create: jest.Mock };
  let prisma: {
    tenant: { findUnique: jest.Mock };
    serviceCatalog: { findMany: jest.Mock; findFirst: jest.Mock };
    professional: { findMany: jest.Mock; findFirst: jest.Mock };
    professionalAvailability: { findMany: jest.Mock };
    client: { findFirst: jest.Mock; create: jest.Mock };
  };

  const activeTenant = { id: 'tenant_1', name: 'Mix Concept Hair', slug: 'mix-demo', status: 'ACTIVE' };

  beforeEach(() => {
    prisma = {
      tenant: { findUnique: jest.fn() },
      serviceCatalog: { findMany: jest.fn(), findFirst: jest.fn() },
      professional: { findMany: jest.fn(), findFirst: jest.fn() },
      professionalAvailability: { findMany: jest.fn() },
      client: { findFirst: jest.fn(), create: jest.fn() },
    };
    appointmentsService = { create: jest.fn() };

    service = new PublicBookingService(
      prisma as unknown as PrismaService,
      appointmentsService as unknown as AppointmentsService,
    );
  });

  describe('tenant resolution', () => {
    it('throws NotFoundException when the slug does not exist', async () => {
      prisma.tenant.findUnique.mockResolvedValueOnce(null);

      await expect(service.getBusiness('missing-slug')).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when the tenant is INACTIVE', async () => {
      prisma.tenant.findUnique.mockResolvedValueOnce({ ...activeTenant, status: 'INACTIVE' });

      await expect(service.getBusiness('mix-demo')).rejects.toThrow(NotFoundException);
    });

    it('returns only name and slug for an active tenant - no internal data leaked', async () => {
      prisma.tenant.findUnique.mockResolvedValueOnce(activeTenant);

      const result = await service.getBusiness('mix-demo');

      expect(result).toEqual({ name: 'Mix Concept Hair', slug: 'mix-demo' });
    });
  });

  describe('listServices', () => {
    it('filters by ACTIVE status and availableOnline=true', async () => {
      prisma.tenant.findUnique.mockResolvedValueOnce(activeTenant);
      prisma.serviceCatalog.findMany.mockResolvedValueOnce([]);

      await service.listServices('mix-demo');

      expect(prisma.serviceCatalog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: 'tenant_1', status: 'ACTIVE', availableOnline: true },
        }),
      );
    });
  });

  describe('listProfessionals', () => {
    it('filters by ACTIVE status and onlineBookingEnabled=true', async () => {
      prisma.tenant.findUnique.mockResolvedValueOnce(activeTenant);
      prisma.professional.findMany.mockResolvedValueOnce([]);

      await service.listProfessionals('mix-demo');

      expect(prisma.professional.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: 'tenant_1', status: 'ACTIVE', onlineBookingEnabled: true },
        }),
      );
    });
  });

  describe('createAppointment', () => {
    const validDto = {
      clientName: 'Cliente Público',
      clientPhone: '(11) 99999-0000',
      serviceId: 'svc_1',
      professionalId: 'prof_1',
      startAt: new Date(Date.now() + 86400000).toISOString(),
    };

    const serviceFixture = {
      id: 'svc_1',
      durationMinutes: 60,
      status: 'ACTIVE',
      availableOnline: true,
    };

    beforeEach(() => {
      prisma.tenant.findUnique.mockResolvedValue(activeTenant);
    });

    it('rejects when the service is not found or not available online', async () => {
      prisma.serviceCatalog.findFirst.mockResolvedValueOnce(null);

      await expect(service.createAppointment('mix-demo', validDto)).rejects.toThrow(NotFoundException);
    });

    it('rejects when the professional is not found or not online-bookable', async () => {
      prisma.serviceCatalog.findFirst.mockResolvedValueOnce(serviceFixture);
      prisma.professional.findFirst.mockResolvedValueOnce(null);

      await expect(service.createAppointment('mix-demo', validDto)).rejects.toThrow(NotFoundException);
    });

    it('rejects a start time in the past', async () => {
      prisma.serviceCatalog.findFirst.mockResolvedValueOnce(serviceFixture);
      prisma.professional.findFirst.mockResolvedValueOnce({ id: 'prof_1' });

      await expect(
        service.createAppointment('mix-demo', { ...validDto, startAt: new Date(Date.now() - 60000).toISOString() }),
      ).rejects.toThrow(BadRequestException);
    });

    it('reuses an existing client matched by phone instead of creating a duplicate', async () => {
      prisma.serviceCatalog.findFirst.mockResolvedValueOnce(serviceFixture);
      prisma.professional.findFirst.mockResolvedValueOnce({ id: 'prof_1' });
      prisma.client.findFirst.mockResolvedValueOnce({ id: 'client_existing' });
      appointmentsService.create.mockResolvedValueOnce({ id: 'appt_1' });

      await service.createAppointment('mix-demo', validDto);

      expect(prisma.client.create).not.toHaveBeenCalled();
      expect(prisma.client.findFirst).toHaveBeenCalledWith({
        where: { tenantId: 'tenant_1', phone: '11999990000' },
      });
      expect(appointmentsService.create).toHaveBeenCalledWith(
        'tenant_1',
        null,
        expect.objectContaining({ clientId: 'client_existing', isOverbook: false, isWalkIn: false }),
        'ONLINE_BOOKING',
      );
    });

    it('creates a new client tagged with source public-booking when phone is not found', async () => {
      prisma.serviceCatalog.findFirst.mockResolvedValueOnce(serviceFixture);
      prisma.professional.findFirst.mockResolvedValueOnce({ id: 'prof_1' });
      prisma.client.findFirst.mockResolvedValueOnce(null);
      prisma.client.create.mockResolvedValueOnce({ id: 'client_new' });
      appointmentsService.create.mockResolvedValueOnce({ id: 'appt_1' });

      await service.createAppointment('mix-demo', validDto);

      expect(prisma.client.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ tenantId: 'tenant_1', source: 'public-booking' }),
        }),
      );
    });

    it('always forces isOverbook and isWalkIn to false regardless of caller input', async () => {
      prisma.serviceCatalog.findFirst.mockResolvedValueOnce(serviceFixture);
      prisma.professional.findFirst.mockResolvedValueOnce({ id: 'prof_1' });
      prisma.client.findFirst.mockResolvedValueOnce({ id: 'client_existing' });
      appointmentsService.create.mockResolvedValueOnce({ id: 'appt_1' });

      await service.createAppointment('mix-demo', validDto);

      const [, , appointmentDto] = appointmentsService.create.mock.calls[0];
      expect(appointmentDto.isOverbook).toBe(false);
      expect(appointmentDto.isWalkIn).toBe(false);
    });
  });
});
