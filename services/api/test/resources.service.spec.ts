import { ResourcesService } from '../src/modules/resources/resources.service';

describe('ResourcesService', () => {
  it('should be defined', () => {
    const service = new ResourcesService({} as any);
    expect(service).toBeDefined();
  });
});
