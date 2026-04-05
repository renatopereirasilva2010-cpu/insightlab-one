import { ProductsService } from '../src/modules/products/products.service';

describe('ProductsService', () => {
  it('should be defined', () => {
    const service = new ProductsService({} as any);
    expect(service).toBeDefined();
  });
});
