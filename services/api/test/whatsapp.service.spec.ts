import { NotFoundException } from '@nestjs/common';
import { WhatsAppService } from '../src/modules/whatsapp/whatsapp.service';

describe('WhatsAppService', () => {
  const baseAppointment = {
    id: 'appt-1',
    tenantId: 't-1',
    unitId: 'unit-1',
    clientId: 'client-1',
    startAt: new Date('2026-08-05T14:00:00.000Z'),
    client: { id: 'client-1', name: 'Cliente Teste', phone: '41999998888' },
    service: { id: 'svc-1', name: 'Corte' },
  };

  function buildPrisma(overrides: Record<string, any> = {}) {
    return {
      appointment: {
        findFirst: jest.fn().mockResolvedValue(baseAppointment),
      },
      whatsAppMessage: {
        create: jest.fn().mockImplementation(({ data }) => ({ id: 'msg-1', ...data })),
        update: jest.fn().mockImplementation(({ data }) => ({ id: 'msg-1', ...data })),
        findFirst: jest.fn().mockResolvedValue({ id: 'msg-1', tenantId: 't-1', toPhone: '5541999998888', templateName: 'agendamento_confirmado' }),
        findMany: jest.fn().mockResolvedValue([]),
      },
      ...overrides,
    };
  }

  function buildProvider(sendTemplateMessage: jest.Mock) {
    return { sendTemplateMessage };
  }

  describe('sendAppointmentConfirmation', () => {
    it('creates a PENDING message then marks it SENT on provider success', async () => {
      const prisma = buildPrisma();
      const provider = buildProvider(
        jest.fn().mockResolvedValue({ type: 'sent', providerMessageId: 'wamid-1' }),
      );
      const service = new WhatsAppService(prisma as any, provider as any);

      await service.sendAppointmentConfirmation('t-1', 'unit-1', 'appt-1');

      expect(prisma.whatsAppMessage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId: 't-1',
            unitId: 'unit-1',
            appointmentId: 'appt-1',
            clientId: 'client-1',
            toPhone: '5541999998888',
            templateName: 'agendamento_confirmado',
          }),
        }),
      );
      expect(provider.sendTemplateMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          toPhone: '5541999998888',
          templateName: 'agendamento_confirmado',
          templateParams: ['Cliente Teste', expect.any(String), 'Corte'],
        }),
      );
      const updateCall = prisma.whatsAppMessage.update.mock.calls[0][0];
      expect(updateCall.data.status).toBe('SENT');
      expect(updateCall.data.providerMessageId).toBe('wamid-1');
    });

    it('marks the message SKIPPED when the provider has no credentials configured', async () => {
      const prisma = buildPrisma();
      const provider = buildProvider(
        jest.fn().mockResolvedValue({ type: 'skipped', reason: 'Nenhuma credencial configurada.' }),
      );
      const service = new WhatsAppService(prisma as any, provider as any);

      await service.sendAppointmentConfirmation('t-1', 'unit-1', 'appt-1');

      const updateCall = prisma.whatsAppMessage.update.mock.calls[0][0];
      expect(updateCall.data.status).toBe('SKIPPED');
    });

    it('marks the message FAILED when the provider call fails', async () => {
      const prisma = buildPrisma();
      const provider = buildProvider(
        jest.fn().mockResolvedValue({ type: 'failed', errorCode: 'E1', errorMessage: 'boom' }),
      );
      const service = new WhatsAppService(prisma as any, provider as any);

      await service.sendAppointmentConfirmation('t-1', 'unit-1', 'appt-1');

      const updateCall = prisma.whatsAppMessage.update.mock.calls[0][0];
      expect(updateCall.data.status).toBe('FAILED');
      expect(updateCall.data.errorCode).toBe('E1');
    });

    it('normalizes a Brazilian local number by prefixing the 55 country code', async () => {
      const prisma = buildPrisma({
        appointment: {
          findFirst: jest.fn().mockResolvedValue({
            ...baseAppointment,
            client: { ...baseAppointment.client, phone: '(41) 99999-8888' },
          }),
        },
      });
      const provider = buildProvider(jest.fn().mockResolvedValue({ type: 'sent', providerMessageId: 'x' }));
      const service = new WhatsAppService(prisma as any, provider as any);

      await service.sendAppointmentConfirmation('t-1', null, 'appt-1');

      expect(prisma.whatsAppMessage.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ toPhone: '5541999998888' }) }),
      );
    });

    it('never throws and skips silently when the client has no phone', async () => {
      const prisma = buildPrisma({
        appointment: {
          findFirst: jest
            .fn()
            .mockResolvedValue({ ...baseAppointment, client: { ...baseAppointment.client, phone: null } }),
        },
      });
      const provider = buildProvider(jest.fn());
      const service = new WhatsAppService(prisma as any, provider as any);

      await expect(service.sendAppointmentConfirmation('t-1', null, 'appt-1')).resolves.toBeUndefined();
      expect(prisma.whatsAppMessage.create).not.toHaveBeenCalled();
      expect(provider.sendTemplateMessage).not.toHaveBeenCalled();
    });

    it('never throws when the appointment does not exist', async () => {
      const prisma = buildPrisma({ appointment: { findFirst: jest.fn().mockResolvedValue(null) } });
      const provider = buildProvider(jest.fn());
      const service = new WhatsAppService(prisma as any, provider as any);

      await expect(service.sendAppointmentConfirmation('t-1', null, 'missing')).resolves.toBeUndefined();
    });

    it('never throws when the prisma lookup itself throws', async () => {
      const prisma = buildPrisma({
        appointment: { findFirst: jest.fn().mockRejectedValue(new Error('db down')) },
      });
      const provider = buildProvider(jest.fn());
      const service = new WhatsAppService(prisma as any, provider as any);

      await expect(service.sendAppointmentConfirmation('t-1', null, 'appt-1')).resolves.toBeUndefined();
    });
  });

  describe('resend', () => {
    it('throws NotFoundException when the message does not exist for the tenant', async () => {
      const prisma = buildPrisma({ whatsAppMessage: { findFirst: jest.fn().mockResolvedValue(null) } });
      const provider = buildProvider(jest.fn());
      const service = new WhatsAppService(prisma as any, provider as any);

      await expect(service.resend('t-1', 'missing')).rejects.toThrow(NotFoundException);
    });

    it('re-invokes the provider with the stored phone and template', async () => {
      const prisma = buildPrisma();
      const provider = buildProvider(jest.fn().mockResolvedValue({ type: 'sent', providerMessageId: 'y' }));
      const service = new WhatsAppService(prisma as any, provider as any);

      await service.resend('t-1', 'msg-1');

      expect(provider.sendTemplateMessage).toHaveBeenCalledWith(
        expect.objectContaining({ toPhone: '5541999998888', templateName: 'agendamento_confirmado' }),
      );
    });
  });
});
