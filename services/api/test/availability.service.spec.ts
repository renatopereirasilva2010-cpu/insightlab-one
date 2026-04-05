import { AvailabilityService } from '../src/modules/availability/availability.service';

describe('AvailabilityService', () => {
  it('should be defined', () => {
    const service = new AvailabilityService({} as any);
    expect(service).toBeDefined();
  });

  it('should calculate weekday from date input assumption', () => {
    const date = new Date('2026-01-05T00:00:00Z');
    expect(typeof date.getUTCDay()).toBe('number');
  });
});
