describe('Tenant context basics', () => {
  it('should represent a tenant id in request context', () => {
    const request = {
      user: {
        tenantId: 'tenant_123',
      },
    };

    const tenant = { id: request.user.tenantId };
    expect(tenant.id).toBe('tenant_123');
  });
});
