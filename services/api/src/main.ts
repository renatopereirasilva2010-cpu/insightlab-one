import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TraceIdInterceptor } from './common/interceptors/trace-id.interceptor';
import { StructuredLogger } from './common/logging/structured-logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new StructuredLogger(),
  });
  const reflector = app.get(Reflector);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());
  // AuditInterceptor agora e registrado via APP_INTERCEPTOR no AuditLogModule
  // (precisa do container de DI pra injetar o AuditLogService).
  app.useGlobalInterceptors(new TraceIdInterceptor());

  const port = Number(process.env.PORT || 4000);
  await app.listen(port);
}
bootstrap();
