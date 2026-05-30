import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Interaction weights — tuned so that explicit votes dominate implicit signals.
 */
const WEIGHT = {
  UPVOTE: 3,
  DOWNVOTE: -1,
  COMMENT: 1,
  POLL_VOTE: 0.5,
} as const;

/** Sparse matrix: userId → postId → interaction score. */
export type InteractionMatrix = Map<string, Map<string, number>>;

@Injectable()
export class InteractionMatrixService {
  constructor(private readonly prisma: PrismaService) {}

  private cache: InteractionMatrix | null = null;
  private cacheBuiltAt = 0;
  private readonly TTL_MS = 5 * 60 * 1_000; // 5 minutes

  /**
   * FIX C1 — Cache stampede protection.
   *
   * If a rebuild is already running, all concurrent callers piggyback on
   * the same in-flight Promise instead of each firing their own DB queries.
   */
  private rebuildPromise: Promise<InteractionMatrix> | null = null;

  async getMatrix(): Promise<InteractionMatrix> {
    if (this.cache && Date.now() - this.cacheBuiltAt < this.TTL_MS) {
      return this.cache;
    }
    if (this.rebuildPromise) return this.rebuildPromise;

    this.rebuildPromise = this.rebuild().finally(() => {
      this.rebuildPromise = null;
    });
    return this.rebuildPromise;
  }

  /** Force-clears the cache so the next call to getMatrix() triggers a rebuild. */
  invalidate(): void {
    this.cache = null;
    // Note: an in-progress rebuild will still complete and cache its result,
    // but the NEXT call after that will see cache=null and rebuild again.
  }

  // ─── Private Helpers ────────────────────────────────────────────────────────

  private async rebuild(): Promise<InteractionMatrix> {
    const [votes, comments, pollVotes] = await Promise.all([
      this.prisma.vote.findMany({
        where: { postId: { not: null } },
        select: { userId: true, postId: true, value: true },
      }),
      this.prisma.comment.findMany({
        select: { authorId: true, postId: true },
      }),
      this.prisma.pollVote.findMany({
        select: {
          userId: true,
          poll: {
            select: { postId: true },
          },
        },
      }),
    ]);

    const matrix: InteractionMatrix = new Map();

    const add = (userId: string, postId: string, delta: number): void => {
      if (!matrix.has(userId)) matrix.set(userId, new Map());
      const row = matrix.get(userId)!;
      row.set(postId, (row.get(postId) ?? 0) + delta);
    };

    votes.forEach(({ userId, postId, value }) => {
      if (postId) add(userId, postId, value === 1 ? WEIGHT.UPVOTE : WEIGHT.DOWNVOTE);
    });

    comments.forEach(({ authorId, postId }) =>
      add(authorId, postId, WEIGHT.COMMENT),
    );

    pollVotes.forEach(({ userId, poll }) => {
      if (poll?.postId) add(userId, poll.postId, WEIGHT.POLL_VOTE);
    });

    this.cache = matrix;
    this.cacheBuiltAt = Date.now();
    return matrix;
  }
}
