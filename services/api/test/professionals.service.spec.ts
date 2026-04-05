import { ProfessionalsService } from '../src/modules/professionals/professionals.service';

describe('ProfessionalsService', () => {
  it('should be defined', () => {
    const service = new ProfessionalsService({} as any);
    expect(service).toBeDefined();
  });
});
