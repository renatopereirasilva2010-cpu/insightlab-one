import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { MulterError } from 'multer';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const traceId = request.traceId ?? null;

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      response.status(status).json({
        code: typeof exceptionResponse === 'object' ? (exceptionResponse as any).code ?? 'HTTP_ERROR' : 'HTTP_ERROR',
        title: typeof exceptionResponse === 'object' ? (exceptionResponse as any).title ?? 'Erro na requisição' : 'Erro na requisição',
        message: typeof exceptionResponse === 'object' ? (exceptionResponse as any).message ?? 'Não foi possível concluir a ação.' : String(exceptionResponse),
        recommendedAction:
          typeof exceptionResponse === 'object'
            ? (exceptionResponse as any).recommendedAction ?? 'Revise a ação e tente novamente.'
            : 'Revise a ação e tente novamente.',
        traceId,
      });
      return;
    }

    if (exception instanceof MulterError && exception.code === 'LIMIT_FILE_SIZE') {
      response.status(HttpStatus.BAD_REQUEST).json({
        code: 'PHOTO_TOO_LARGE',
        title: 'Imagem muito grande',
        message: 'O arquivo enviado passa do limite de 3MB.',
        recommendedAction: 'Envie uma imagem menor e tente novamente.',
        traceId,
      });
      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      code: 'INTERNAL_SERVER_ERROR',
      title: 'Erro interno',
      message: 'Ocorreu um erro inesperado.',
      recommendedAction: 'Tente novamente em instantes. Se o erro persistir, acione o suporte.',
      traceId,
    });
  }
}
