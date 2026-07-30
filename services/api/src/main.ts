import { join } from 'path';
import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TraceIdInterceptor } from './common/interceptors/trace-id.interceptor';
import { StructuredLogger } from './common/logging/structured-logger.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: new StructuredLogger(),
  });
  const reflector = app.get(Reflector);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());
  // AuditInterceptor agora e registrado via APP_INTERCEPTOR no AuditLogModule
  // (precisa do container de DI pra injetar o AuditLogService).
  app.useGlobalInterceptors(new TraceIdInterceptor());
  // process.cwd() (nao __dirname) pra funcionar igual em dev (nest start,
  // cwd = services/api) e producao (node dist/src/main.js, WorkingDirectory
  // do systemd tambem e services/api) sem depender da profundidade do build.
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });

  const port = Number(process.env.PORT || 4000);
  await app.listen(port);
}
bootstrap();
