import { buildPhotoUrl, isAllowedPhotoMimeType } from '../src/common/upload/photo-upload.interceptor';

describe('photo-upload helpers', () => {
  describe('isAllowedPhotoMimeType', () => {
    it.each(['image/png', 'image/jpeg', 'image/webp'])('accepts %s', (mimetype) => {
      expect(isAllowedPhotoMimeType(mimetype)).toBe(true);
    });

    it.each(['image/gif', 'application/pdf', 'text/html', ''])('rejects %s', (mimetype) => {
      expect(isAllowedPhotoMimeType(mimetype)).toBe(false);
    });
  });

  describe('buildPhotoUrl', () => {
    it('builds a relative URL scoped by subfolder and tenant', () => {
      expect(buildPhotoUrl('clients', 'tenant-1', 'client-1-123.png')).toBe(
        '/uploads/clients/tenant-1/client-1-123.png',
      );
    });
  });
});
