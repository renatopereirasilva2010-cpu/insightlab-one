import { AvailabilityService } from '../src/modules/availability/availability.service';

describe('AvailabilityService', () => {
  let service: AvailabilityService;
  let prisma: {
    professionalAvailability: { findMany: jest.Mock };
  };

  beforeEach(() => {
    prisma = {
      professionalAvailability: { findMany: jest.fn() },
    };

    service = new AvailabilityService(prisma as any);
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
});
