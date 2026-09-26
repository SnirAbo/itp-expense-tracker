import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import pinoHttp from 'pino-http';
import { randomUUID } from 'crypto';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  const requestLogger = pinoHttp({
    genReqId: (req, res) => {
      const existing = req.headers['x-request-id'] as string | undefined;
      const id = existing || randomUUID();
      res.setHeader('x-request-id', id);
      return id;
    },
    customProps: (req) => ({ userId: (req as any).userId ?? null }),
    messageKey: 'message',
  });
  app.use(requestLogger as any);

  app.use(helmet());
  app.use(cookieParser());
  app.use(
    cors({
      origin: (origin, cb) => {
        const allow = process.env.CORS_ORIGIN?.split(',').map((s) => s.trim()) || [];
        if (!origin || allow.includes(origin)) return cb(null, true);
        return cb(new Error('Not allowed by CORS'));
      },
      credentials: true,
    }) as any,
  );

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // OpenAPI (non-prod serve UI)
  const config = new DocumentBuilder()
    .setTitle('ITP API')
    .setDescription('Expense tracker API')
    .setVersion('0.1.0')
    .addCookieAuth('access_token')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  if (process.env.NODE_ENV !== 'production') {
    SwaggerModule.setup('docs', app, document);
  }

  const port = Number(process.env.PORT || 3000);
  await app.listen(port, '0.0.0.0');
  console.log(`API listening on :${port}`);
}
bootstrap();
