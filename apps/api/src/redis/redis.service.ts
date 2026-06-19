import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;
  private readonly prefix: string;

  constructor() {
    this.prefix = process.env.REDIS_PREFIX || 'campus-connect:';
    this.client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

    this.client.on('error', (err) => {
      this.logger.warn('Redis connection error (caching degraded):', err.message);
    });

    this.client.on('connect', () => {
      this.logger.log('Connected to Redis');
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }

  private k(...parts: string[]): string {
    return `${this.prefix}${parts.join(':')}`;
  }

  async get<T>(...keyParts: string[]): Promise<T | null> {
    try {
      const val = await this.client.get(this.k(...keyParts));
      return val ? JSON.parse(val) : null;
    } catch {
      return null;
    }
  }

  async set(keyParts: string[], value: unknown, ttlSeconds?: number): Promise<void> {
    try {
      const fullKey = this.k(...keyParts);
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await this.client.setex(fullKey, ttlSeconds, serialized);
      } else {
        await this.client.set(fullKey, serialized);
      }
    } catch (err) {
      this.logger.warn('Redis set failed:', (err as Error).message);
    }
  }

  async del(...keyParts: string[]): Promise<void> {
    try {
      await this.client.del(this.k(...keyParts));
    } catch {
      // silently ignore
    }
  }

  async acquireLock(lockKey: string, ttlSeconds = 30): Promise<boolean> {
    try {
      const result = await this.client.setnx(this.k('lock', lockKey), '1');
      if (result === 1) {
        await this.client.expire(this.k('lock', lockKey), ttlSeconds);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async releaseLock(lockKey: string): Promise<void> {
    await this.del('lock', lockKey);
  }

  getClient(): Redis {
    return this.client;
  }
}
