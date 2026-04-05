import { ClientsService } from '../src/modules/clients/clients.service';

describe('ClientsService', () => {
  it('should be defined', () => {
    const service = new ClientsService({} as any);
    expect(service).toBeDefined();
  });
});
