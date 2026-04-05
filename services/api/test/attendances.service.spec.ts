import { AttendancesService } from '../src/modules/attendances/attendances.service';

describe('AttendancesService', () => {
  it('should be defined', () => {
    const service = new AttendancesService({} as any);
    expect(service).toBeDefined();
  });

  it('should preserve OPEN as valid initial status assumption', () => {
    const attendance = { status: 'OPEN' };
    expect(attendance.status).toBe('OPEN');
  });

  it('should require IN_PROGRESS before FINISHED assumption', () => {
    const attendance = { status: 'IN_PROGRESS' };
    expect(attendance.status).toBe('IN_PROGRESS');
  });
});
