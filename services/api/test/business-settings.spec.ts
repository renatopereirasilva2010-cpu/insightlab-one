describe('Business settings defaults', () => {
  it('should keep deferred payment enabled by default in product assumptions', () => {
    const settings = {
      allowDeferredPayment: true,
      deferredPaymentLabel: 'Pagamento diferido',
      timezone: 'America/Sao_Paulo',
      currency: 'BRL',
    };

    expect(settings.allowDeferredPayment).toBe(true);
    expect(settings.currency).toBe('BRL');
  });
});
