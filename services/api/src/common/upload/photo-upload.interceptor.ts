import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 3 * 1024 * 1024;

/**
 * Multer config compartilhada por profissionais/clientes/produtos/logo de tenant.
 * Salva em disco local (services/api/uploads/<subfolder>/<tenantId>/) - ver
 * plano da onda8: provedor de storage externo (S3/Cloudinary) fica em standby
 * porque depende de conta em fornecedor, fora de escopo agora.
 */
export function createPhotoUploadInterceptor(subfolder: string) {
  return FileInterceptor('photo', {
    storage: diskStorage({
      destination: (req, _file, cb) => {
        const tenantId = (req as any).user?.tenantId ?? 'unknown-tenant';
        const dir = join(process.cwd(), 'uploads', subfolder, tenantId);
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
        cb(null, dir);
      },
      filename: (req, file, cb) => {
        const entityId = (req as any).params?.id ?? 'unknown';
        cb(null, `${entityId}-${Date.now()}${extname(file.originalname)}`);
      },
    }),
    fileFilter: (_req, file, cb) => {
      cb(null, ALLOWED_MIME_TYPES.includes(file.mimetype));
    },
    limits: { fileSize: MAX_FILE_SIZE_BYTES },
  });
}

export function isAllowedPhotoMimeType(mimetype: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mimetype);
}

export function buildPhotoUrl(subfolder: string, tenantId: string, filename: string): string {
  return `/uploads/${subfolder}/${tenantId}/${filename}`;
}
