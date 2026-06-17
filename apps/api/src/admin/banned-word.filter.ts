import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BannedWordFilter implements OnModuleInit {
  private bannedPatterns: { pattern: string; isRegex: boolean }[] = [];
  private cacheInterval!: ReturnType<typeof setInterval>;

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.refreshCache();
    this.cacheInterval = setInterval(() => this.refreshCache(), 60_000);
  }

  async refreshCache() {
    try {
      this.bannedPatterns = await this.prisma.bannedWord.findMany({
        select: { pattern: true, isRegex: true },
      });
    } catch {
      this.bannedPatterns = [];
    }
  }

  containsBannedContent(text: string): { banned: boolean; matched: string | null } {
    if (!text || this.bannedPatterns.length === 0) {
      return { banned: false, matched: null };
    }

    const lowerText = text.toLowerCase();

    for (const { pattern, isRegex } of this.bannedPatterns) {
      try {
        if (isRegex) {
          const regex = new RegExp(pattern, 'gi');
          if (regex.test(text)) {
            return { banned: true, matched: pattern };
          }
        } else {
          if (lowerText.includes(pattern.toLowerCase())) {
            return { banned: true, matched: pattern };
          }
        }
      } catch {
        continue;
      }
    }

    return { banned: false, matched: null };
  }

  onModuleDestroy() {
    if (this.cacheInterval) {
      clearInterval(this.cacheInterval);
    }
  }
}
