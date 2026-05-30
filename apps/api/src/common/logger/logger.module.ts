import { Module, Global } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';

@Global()
@Module({
  imports: [
    PinoLoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? 'info',
        redact: {
          paths: ['req.headers.cookie', 'req.headers.authorization'],
          censor: '[REDACTED]',
        },
        transport: {
          targets: [
            {
              target: 'pino-pretty',
              level: process.env.LOG_LEVEL ?? 'info',
              options: {
                colorize: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname',
              },
            },
            {
              target: 'pino/file',
              level: 'error',
              options: { destination: './logs/api-error.log', mkdir: true },
            },
            {
              target: 'pino/file',
              level: 'info',
              options: { destination: './logs/api-combined.log', mkdir: true },
            },
          ],
        },
      },
      exclude: [],
    }),
  ],
  exports: [PinoLoggerModule],
})
export class LoggerModule {}
