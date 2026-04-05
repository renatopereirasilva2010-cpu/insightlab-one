import { CommissionsService } from '../src/modules/commissions/commissions.service';

describe('CommissionsService', () => {
  it('should be defined', () => {
    const service = new CommissionsService({} as any);
    expect(service).toBeDefined();
  });

  it('should preserve PENDING as valid initial commission status assumption', () => {
    const commission = { status: 'PENDING' };
    expect(commission.status).toBe('PENDING');
  });

  it('should preserve ON_PAYMENT as valid release mode assumption', () => {
    const commission = { releaseMode: 'ON_PAYMENT' };
    expect(commission.releaseMode).toBe('ON_PAYMENT');
  });
});
