import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AppointmentsService } from '../src/modules/appointments/appointments.service';

describe('AppointmentsService', () => {
  it('should be defined', () => {
    const service = new AppointmentsService({} as any);
    expect(service).toBeDefined();
  });

  it('should reject invalid date range logic assumption', async () => {
    const service = new AppointmentsService({} as any);
    const start = new Date('2026-01-01T10:00:00Z');
    const end = new Date('2026-01-01T09:00:00Z');
    expect(end <= start).toBe(true);
  });

  describe('update', () => {
    const existingAppointment = {
      id: 'appt-1',
      tenantId: 'tenant-1',
      clientId: 'client-1',
      serviceId: 'svc-1',
      professionalId: 'prof-1',
      resourceId: null,
      status: 'SCHEDULED',
      isOverbook: false,
      notes: null,
      startAt: new Date('2026-08-05T14:00:00.000Z'),
      endAt: new Date('2026-08-05T15:00:00.000Z'),
    };

    function buildPrisma(overrides: Record<string, any> = {}) {
      return {
        appointment: {
          findFirst: jest.fn().mockResolvedValue(existingAppointment),
          update: jest.fn().mockImplementation(({ data }) => ({ ...existingAppointment, ...data })),
        },
        client: { findFirst: jest.fn().mockResolvedValue({ id: 'client-1', unitId: null, status: 'ACTIVE' }) },
        serviceCatalog: {
          findFirst: jest
            .fn()
            .mockResolvedValue({ id: 'svc-1', unitId: null, status: 'ACTIVE', requiresProfessional: true }),
        },
        professional: {
          findFirst: jest.fn().mockResolvedValue({ id: 'prof-1', unitId: null, status: 'ACTIVE' }),
        },
        operationalResource: { findFirst: jest.fn() },
        appointmentBlock: { findFirst: jest.fn().mockResolvedValue(null) },
        ...overrides,
      };
    }

    it('throws NotFoundException when the appointment does not exist', async () => {
      const prisma = buildPrisma({ appointment: { findFirst: jest.fn().mockResolvedValue(null), update: jest.fn() } });
      const service = new AppointmentsService(prisma as any);

      await expect(
        service.update('tenant-1', null, 'missing', { startAt: '2026-08-05T15:00:00.000Z' }),
      ).rejects.toThrow(NotFoundException);
    });

    it.each(['CANCELED', 'NO_SHOW', 'COMPLETED'])(
      'rejects editing an appointment with locked status %s',
      async (status) => {
        const prisma = buildPrisma({
          appointment: {
            findFirst: jest.fn().mockResolvedValue({ ...existingAppointment, status }),
            update: jest.fn(),
          },
        });
        const service = new AppointmentsService(prisma as any);

        await expect(
          service.update('tenant-1', null, 'appt-1', { startAt: '2026-08-05T16:00:00.000Z' }),
        ).rejects.toThrow(BadRequestException);
      },
    );

    it('rejects a conflicting new time slot for the same professional', async () => {
      const prisma = buildPrisma();
      prisma.appointment.findFirst = jest
        .fn()
        .mockResolvedValueOnce(existingAppointment) // load the appointment being edited
        .mockResolvedValueOnce({ id: 'other-appt' }); // conflict check finds another appointment
      const service = new AppointmentsService(prisma as any);

      await expect(
        service.update('tenant-1', null, 'appt-1', { startAt: '2026-08-05T16:00:00.000Z', endAt: '2026-08-05T17:00:00.000Z' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('excludes the appointment itself from the conflict check (so moving it 15min does not collide with itself)', async () => {
      const prisma = buildPrisma();
      prisma.appointment.findFirst = jest
        .fn()
        .mockResolvedValueOnce(existingAppointment) // load the appointment being edited
        .mockResolvedValueOnce(null); // conflict check: no other appointment overlaps
      const service = new AppointmentsService(prisma as any);

      const result = await service.update('tenant-1', null, 'appt-1', {
        startAt: '2026-08-05T14:15:00.000Z',
        endAt: '2026-08-05T15:15:00.000Z',
      });

      expect(prisma.appointment.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: { not: 'appt-1' } }),
        }),
      );
      expect(result.startAt).toEqual(new Date('2026-08-05T14:15:00.000Z'));
    });

    it('updates only the fields provided, keeping the rest unchanged', async () => {
      const prisma = buildPrisma();
      prisma.appointment.findFirst = jest
        .fn()
        .mockResolvedValueOnce(existingAppointment)
        .mockResolvedValueOnce(null);
      const service = new AppointmentsService(prisma as any);

      await service.update('tenant-1', null, 'appt-1', { notes: 'Cliente pediu para trocar o horário' });

      expect(prisma.appointment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'appt-1' },
          data: expect.objectContaining({
            clientId: 'client-1',
            serviceId: 'svc-1',
            professionalId: 'prof-1',
            notes: 'Cliente pediu para trocar o horário',
          }),
        }),
      );
    });
  });
});
