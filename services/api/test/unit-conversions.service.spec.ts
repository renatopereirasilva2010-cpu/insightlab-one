import { UnitConversionsService } from '../src/modules/unit-conversions/unit-conversions.service';

describe('UnitConversionsService', () => {
  it('should be defined', () => {
    const service = new UnitConversionsService({} as any);
    expect(service).toBeDefined();
  });
});
