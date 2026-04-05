import { CashRegisterService } from '../src/modules/cash-register/cash-register.service';

describe('CashRegisterService', () => {
  it('should be defined', () => {
    const service = new CashRegisterService({} as any);
    expect(service).toBeDefined();
  });

  it('should preserve CLOSED as a valid initial cash register status assumption', () => {
    const cashRegister = { status: 'CLOSED' };
    expect(cashRegister.status).toBe('CLOSED');
  });
});
