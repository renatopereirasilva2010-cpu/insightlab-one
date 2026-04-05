import { ServicesCatalogService } from '../src/modules/services-catalog/services-catalog.service';

describe('ServicesCatalogService', () => {
  it('should be defined', () => {
    const service = new ServicesCatalogService({} as any);
    expect(service).toBeDefined();
  });
});
