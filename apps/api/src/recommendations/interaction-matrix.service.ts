import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

const WEIGHT = {
  UPVOTE: 3,
  DOWNVOTE: -1,
  COMMENT: 1,
  POLL_VOTE: 0.5,
} as const;

export type InteractionMatrix = Map<string, Map<string, number>>;

const CACHE_KEY = ['interaction', 'matrix'];
const CACHE_TTL_S = 300;
const LOCK_KEY = 'interaction:matrix';

@Injectable()
export class InteractionMatrixService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  private cache: InteractionMatrix | null = null;
  private cacheBuiltAt = 0;
  private readonly TTL_MS = CACHE_TTL_S * 1_000;
  public lastInvalidatedAt = 0;
  private rebuildPromise: Promise<InteractionMatrix> | null = null;

  async getMatrix(): Promise<InteractionMatrix> {
    if (this.cache && Date.now() - this.cacheBuiltAt < this.TTL_MS) {
      return this.cache;
    }
    if (this.rebuildPromise) return this.rebuildPromise;

    this.rebuildPromise = this.tryRedisOrRebuild().finally(() => {
      this.rebuildPromise = null;
    });
    return this.rebuildPromise;
  }

  private async tryRedisOrRebuild(): Promise<InteractionMatrix> {
    const cached = await this.redis.get<Record<string, Record<string, number>>>(...CACHE_KEY);
    if (cached) {
      this.cache = this.deserialize(cached);
      this.cacheBuiltAt = Date.now();
      return this.cache!;
    }
    return this.rebuild();
  }

  invalidate(): void {
    this.cache = null;
    this.lastInvalidatedAt = Date.now();
    this.redis.del(...CACHE_KEY);
  }

  private async rebuild(): Promise<InteractionMatrix> {
    const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    let [votes, comments, pollVotes] = await Promise.all([
      this.prisma.vote.findMany({
        where: { postId: { not: null }, createdAt: { gte: cutoff } },
        select: { userId: true, postId: true, value: true },
      }),
      this.prisma.comment.findMany({
        where: { createdAt: { gte: cutoff } },
        select: { authorId: true, postId: true },
      }),
      this.prisma.pollVote.findMany({
        where: { createdAt: { gte: cutoff } },
        select: { userId: true, poll: { select: { postId: true } } },
      }),
    ]);

    if (votes.length === 0) {
      votes = await this.prisma.vote.findMany({
        where: { postId: { not: null } },
        select: { userId: true, postId: true, value: true },
      });
    }
    if (comments.length === 0) {
      comments = await this.prisma.comment.findMany({
        select: { authorId: true, postId: true },
      });
    }
    if (pollVotes.length === 0) {
      pollVotes = await this.prisma.pollVote.findMany({
        select: { userId: true, poll: { select: { postId: true } } },
      });
    }

    const matrix: InteractionMatrix = new Map();
    const add = (userId: string, postId: string, delta: number): void => {
      if (!matrix.has(userId)) matrix.set(userId, new Map());
      const row = matrix.get(userId)!;
      row.set(postId, (row.get(postId) ?? 0) + delta);
    };

    votes.forEach(({ userId, postId, value }) => {
      if (postId) add(userId, postId, value === 1 ? WEIGHT.UPVOTE : WEIGHT.DOWNVOTE);
    });
    comments.forEach(({ authorId, postId }) => add(authorId, postId, WEIGHT.COMMENT));
    pollVotes.forEach(({ userId, poll }) => {
      if (poll?.postId) add(userId, poll.postId, WEIGHT.POLL_VOTE);
    });

    this.cache = matrix;
    this.cacheBuiltAt = Date.now();

    this.redis.set(CACHE_KEY, this.serialize(matrix), CACHE_TTL_S);

    return matrix;
  }

  private serialize(matrix: InteractionMatrix): Record<string, Record<string, number>> {
    const obj: Record<string, Record<string, number>> = {};
    matrix.forEach((row, userId) => {
      obj[userId] = {};
      row.forEach((val, postId) => {
        obj[userId][postId] = val;
      });
    });
    return obj;
  }

  private deserialize(obj: Record<string, Record<string, number>>): InteractionMatrix {
    const matrix: InteractionMatrix = new Map();
    for (const [userId, row] of Object.entries(obj)) {
      matrix.set(userId, new Map(Object.entries(row)));
    }
    return matrix;
  }
}
