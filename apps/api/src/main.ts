import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.useLogger(app.get(Logger));

  // Global validation pipe for strict DTO handling
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global exception filter for consistent error responses
  app.useGlobalFilters(new AllExceptionsFilter());

  // Cookie parser for httpOnly JWT cookies
  app.use(cookieParser());

  // Enable CORS for frontend communication
  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
  });

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('CampusConnect / ScholarSphare API')
    .setDescription(
      'REST API for the academic social network. Uses httpOnly cookies for JWT authentication.',
    )
    .setVersion('1.0')
    .addCookieAuth('token')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT || 3000);

  const logger = app.get(Logger);
  logger.log(`Application is running on: ${await app.getUrl()}`);
  logger.log(`Swagger docs available at: ${await app.getUrl()}/api/docs`);
}
bootstrap();
