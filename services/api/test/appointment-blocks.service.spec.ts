import { AppointmentBlocksService } from '../src/modules/appointment-blocks/appointment-blocks.service';

describe('AppointmentBlocksService', () => {
  it('should be defined', () => {
    const service = new AppointmentBlocksService({} as any);
    expect(service).toBeDefined();
  });
});
