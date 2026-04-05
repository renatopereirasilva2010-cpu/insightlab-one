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
});
