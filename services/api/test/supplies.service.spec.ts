import { SuppliesService } from '../src/modules/supplies/supplies.service';

describe('SuppliesService', () => {
  it('should be defined', () => {
    const service = new SuppliesService({} as any);
    expect(service).toBeDefined();
  });
});
