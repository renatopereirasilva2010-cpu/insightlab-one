import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

const ALLOWED_MIME_TYPES = [
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  // Alguns navegadores/exports mandam CSV como text/plain ou octet-stream.
  'text/plain',
  'application/octet-stream',
];
const ALLOWED_EXTENSIONS = new Set(['.csv', '.xls', '.xlsx']);
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

/**
 * Multer config pra upload de planilha de importação (CSV/XLS/XLSX) - mesmo
 * padrão de disco local do photo-upload.interceptor.ts, pasta própria
 * (uploads/migrations/<tenantId>/) já que o arquivo precisa sobreviver entre
 * o passo de análise e o de commit (ver data-import - onda12).
 */
export function createSpreadsheetUploadInterceptor() {
  return FileInterceptor('file', {
    storage: diskStorage({
      destination: (req, _file, cb) => {
        const tenantId = (req as any).user?.tenantId ?? 'unknown-tenant';
        const dir = join(process.cwd(), 'uploads', 'migrations', tenantId);
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
        cb(null, dir);
      },
      filename: (_req, file, cb) => {
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`);
      },
    }),
    fileFilter: (_req, file, cb) => {
      const ext = extname(file.originalname).toLowerCase();
      cb(null, ALLOWED_EXTENSIONS.has(ext) && ALLOWED_MIME_TYPES.includes(file.mimetype));
    },
    limits: { fileSize: MAX_FILE_SIZE_BYTES },
  });
}
