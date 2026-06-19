import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

export type TermVector = Map<string, number>;

const CORPUS_KEY = ['tfidf', 'corpus'];
const CACHE_TTL_S = 3600;

@Injectable()
export class TfidfService {
  private readonly logger = new Logger(TfidfService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  private postVectors: Map<string, TermVector> = new Map();
  private buildPromise: Promise<void> | null = null;

  scorePost(userProfileVector: TermVector, postId: string): number {
    const postVec = this.postVectors.get(postId);
    if (!postVec || userProfileVector.size === 0) return 0;
    return this.cosineSimilarity(userProfileVector, postVec);
  }

  buildUserProfile(
    interactedPostIds: string[],
    interests?: string | null,
    hobby?: string | null,
  ): TermVector {
    const profile: TermVector = new Map();

    if (this.postVectors.size > 0 && interactedPostIds.length > 0) {
      const postInteractionAccum: TermVector = new Map();
      interactedPostIds.forEach((postId) => {
        const vec = this.postVectors.get(postId);
        if (!vec) return;
        vec.forEach((weight, term) => {
          postInteractionAccum.set(term, (postInteractionAccum.get(term) ?? 0) + weight);
        });
      });

      let normSq = 0;
      postInteractionAccum.forEach((w) => { normSq += w * w; });
      const norm = Math.sqrt(normSq);

      if (norm > 0) {
        postInteractionAccum.forEach((w, term) => {
          profile.set(term, w / norm);
        });
      }
    }

    const rawTokens: string[] = [];
    if (interests) {
      interests.split(',').forEach((val) => {
        rawTokens.push(...this.tokenize(val));
      });
    }
    if (hobby) {
      hobby.split(',').forEach((val) => {
        rawTokens.push(...this.tokenize(val));
      });
    }

    rawTokens.forEach((token) => {
      profile.set(token, (profile.get(token) ?? 0) + 1.5);
    });

    return profile;
  }

  getAllPostIds(): string[] {
    return [...this.postVectors.keys()];
  }

  get isReady(): boolean {
    return this.postVectors.size > 0;
  }

  @Cron(CronExpression.EVERY_HOUR)
  async buildCorpus(): Promise<void> {
    if (this.buildPromise) return this.buildPromise;
    this.buildPromise = this.doBuildCorpus().finally(() => {
      this.buildPromise = null;
    });
    return this.buildPromise;
  }

  private async doBuildCorpus(): Promise<void> {
    const posts = await this.prisma.post.findMany({
      where: { status: 'PUBLISHED' },
      select: {
        id: true,
        title: true,
        content: true,
        courseCode: true,
        tags: true,
        author: { select: { department: true, major: true } },
      },
    });

    const N = posts.length;
    if (N === 0) return;

    const rawTf = new Map<string, Map<string, number>>();
    const df = new Map<string, number>();

    posts.forEach(({ id, title, content, courseCode, tags, author }) => {
      const text = [
        title ?? '',
        content,
        courseCode ?? '',
        author.department ?? '',
        author.major ?? '',
        (tags ?? []).map((t: any) => typeof t === 'string' ? t : t.name).join(' '),
      ].join(' ');

      const termCounts = new Map<string, number>();
      this.tokenize(text).forEach((t) =>
        termCounts.set(t, (termCounts.get(t) ?? 0) + 1),
      );
      rawTf.set(id, termCounts);
      termCounts.forEach((_, term) => df.set(term, (df.get(term) ?? 0) + 1));
    });

    const idfMap = new Map<string, number>();
    df.forEach((docCount, term) =>
      idfMap.set(term, Math.log((N + 1) / (docCount + 1)) + 1),
    );

    const vectors = new Map<string, TermVector>();
    rawTf.forEach((termCounts, postId) => {
      const totalTerms = [...termCounts.values()].reduce((a, b) => a + b, 0);
      const vec: TermVector = new Map();
      termCounts.forEach((count, term) => {
        vec.set(term, (count / totalTerms) * (idfMap.get(term) ?? 0));
      });
      vectors.set(postId, vec);
    });

    this.postVectors = vectors;

    this.redis.set(CORPUS_KEY, this.serialize(vectors), CACHE_TTL_S);
  }

  /** Load cached corpus from Redis into memory. Returns true if loaded. */
  async warmFromCache(): Promise<boolean> {
    const cached = await this.redis.get<Record<string, Record<string, number>>>(...CORPUS_KEY);
    if (!cached) return false;
    this.postVectors = this.deserialize(cached);
    this.logger.log(`Warmed TF-IDF corpus from Redis (${this.postVectors.size} posts)`);
    return true;
  }

  private serialize(
    vectors: Map<string, TermVector>,
  ): Record<string, Record<string, number>> {
    const obj: Record<string, Record<string, number>> = {};
    vectors.forEach((vec, postId) => {
      obj[postId] = {};
      vec.forEach((w, term) => { obj[postId][term] = w; });
    });
    return obj;
  }

  private deserialize(
    obj: Record<string, Record<string, number>>,
  ): Map<string, TermVector> {
    const map = new Map<string, TermVector>();
    for (const [postId, vec] of Object.entries(obj)) {
      map.set(postId, new Map(Object.entries(vec)));
    }
    return map;
  }

  private cosineSimilarity(a: TermVector, b: TermVector): number {
    let dot = 0;
    let normA = 0;
    let normB = 0;

    a.forEach((w, term) => {
      dot += w * (b.get(term) ?? 0);
      normA += w * w;
    });
    b.forEach((w) => (normB += w * w));

    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dot / denom;
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2 && !STOP_WORDS.has(t));
  }
}

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her',
  'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how',
  'its', 'new', 'now', 'old', 'see', 'two', 'who', 'did', 'let', 'may',
  'use', 'she', 'way', 'from', 'this', 'that', 'with', 'have', 'more',
  'will', 'your', 'they', 'been', 'into', 'than', 'then', 'when', 'also',
  'each', 'just', 'like', 'make', 'many', 'over', 'such', 'take', 'very',
  'well', 'what', 'where', 'which', 'while', 'time', 'these', 'those',
]);
