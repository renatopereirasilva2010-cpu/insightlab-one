import { NotFoundException } from '@nestjs/common';
import { AvailabilityService } from '../src/modules/availability/availability.service';

describe('AvailabilityService', () => {
  let service: AvailabilityService;
  let prisma: {
    professionalAvailability: { findMany: jest.Mock };
    professional: { findFirst: jest.Mock };
    serviceCatalog: { findFirst: jest.Mock };
    appointment: { findMany: jest.Mock };
    appointmentBlock: { findMany: jest.Mock };
  };

  beforeEach(() => {
    prisma = {
      professionalAvailability: { findMany: jest.fn() },
      professional: { findFirst: jest.fn() },
      serviceCatalog: { findFirst: jest.fn() },
      appointment: { findMany: jest.fn() },
      appointmentBlock: { findMany: jest.fn() },
    };

    service = new AvailabilityService(prisma as any);
    jest.useRealTimers();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should calculate weekday from date input assumption', () => {
    const date = new Date('2026-01-05T00:00:00Z');
    expect(typeof date.getUTCDay()).toBe('number');
  });

  it('query should return both active and inactive rules for the weekday, without filtering by active', async () => {
    const rules = [
      { id: 'rule-1', active: true },
      { id: 'rule-2', active: false },
    ];
    prisma.professionalAvailability.findMany.mockResolvedValue(rules);

    const result = await service.query('tenant-1', {
      professionalId: 'prof-1',
      date: '2026-01-05',
    } as any);

    expect(prisma.professionalAvailability.findMany).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        professionalId: 'prof-1',
        weekday: 1,
      },
      orderBy: { startTime: 'asc' },
    });
    expect(result.rules).toEqual(rules);
    expect(result.totalRules).toBe(2);
  });

  describe('suggestSlots', () => {
    const fromDate = '2026-08-10';
    const weekday = new Date(`${fromDate}T00:00:00`).getDay();

    beforeEach(() => {
      prisma.professional.findFirst.mockResolvedValue({ id: 'prof-1', status: 'ACTIVE' });
      prisma.serviceCatalog.findFirst.mockResolvedValue({
        id: 'svc-1',
        durationMinutes: 60,
      });
      prisma.appointmentBlock.findMany.mockResolvedValue([]);
    });

    it('throws NotFoundException when the service does not exist', async () => {
      prisma.serviceCatalog.findFirst.mockResolvedValueOnce(null);
      prisma.professionalAvailability.findMany.mockResolvedValueOnce([]);

      await expect(
        service.suggestSlots('tenant-1', { professionalId: 'prof-1', serviceId: 'missing' } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('returns no suggestions when the professional has no active availability rules', async () => {
      prisma.professionalAvailability.findMany.mockResolvedValueOnce([]);

      const result = await service.suggestSlots('tenant-1', {
        professionalId: 'prof-1',
        serviceId: 'svc-1',
        fromDate,
      } as any);

      expect(result.suggestions).toEqual([]);
      expect(prisma.appointment.findMany).not.toHaveBeenCalled();
    });

    it('skips slots that overlap an existing appointment and suggests the next free one', async () => {
      prisma.professionalAvailability.findMany.mockResolvedValueOnce([
        { weekday, startTime: '09:00', endTime: '11:00', active: true },
      ]);

      const dayStart = new Date(`${fromDate}T00:00:00`);
      const busyStart = new Date(dayStart);
      busyStart.setHours(9, 0, 0, 0);
      const busyEnd = new Date(dayStart);
      busyEnd.setHours(10, 0, 0, 0);

      prisma.appointment.findMany.mockResolvedValueOnce([{ startAt: busyStart, endAt: busyEnd }]);

      const result = await service.suggestSlots('tenant-1', {
        professionalId: 'prof-1',
        serviceId: 'svc-1',
        fromDate,
      } as any);

      // Janela 09:00-11:00, servico de 60min, passo de 15min: só o slot que
      // começa exatamente quando o compromisso existente termina (10:00)
      // não colide com o agendamento das 09:00-10:00.
      expect(result.suggestions).toHaveLength(1);
      expect(new Date(result.suggestions[0].startAt).getHours()).toBe(10);
      expect(new Date(result.suggestions[0].startAt).getMinutes()).toBe(0);
    });

    it('excludes slots that overlap an active appointment block', async () => {
      prisma.professionalAvailability.findMany.mockResolvedValueOnce([
        { weekday, startTime: '09:00', endTime: '10:00', active: true },
      ]);
      prisma.appointment.findMany.mockResolvedValueOnce([]);

      const dayStart = new Date(`${fromDate}T00:00:00`);
      const blockStart = new Date(dayStart);
      blockStart.setHours(9, 0, 0, 0);
      const blockEnd = new Date(dayStart);
      blockEnd.setHours(10, 0, 0, 0);

      prisma.appointmentBlock.findMany.mockResolvedValueOnce([
        { startsAt: blockStart, endsAt: blockEnd },
      ]);

      const result = await service.suggestSlots('tenant-1', {
        professionalId: 'prof-1',
        serviceId: 'svc-1',
        fromDate,
      } as any);

      // Janela inteira (09:00-10:00) bloqueada por um unico bloqueio de
      // agenda que cobre exatamente o horario disponivel - zero sugestao.
      expect(result.suggestions).toEqual([]);
    });
  });
});
