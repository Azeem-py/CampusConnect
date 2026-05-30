import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InteractionMatrix, InteractionMatrixService } from './interaction-matrix.service';
import { TfidfService } from './tfidf.service';
import { SvdService } from './svd.service';
import { KnnService } from './knn.service';

/**
 * Hybrid scoring weights — must sum to 1.0.
 */
const WEIGHTS = {
  TFIDF: 0.25,
  SVD: 0.35,
  KNN: 0.25,
  SOCIAL: 0.10,
  RECENCY: 0.05,
} as const;

/** Interactions below this count → cold-start fallback. */
const COLD_START_THRESHOLD = 3;

/** FIX L2 — Named constant instead of magic number. */
const MS_PER_DAY = 86_400_000;

/** Half-life of 14 days for recency decay. */
const DECAY_LAMBDA = Math.log(2) / 14;

export interface RecommendedPost {
  postId: string;
  score: number;
}

@Injectable()
export class RecommendationService implements OnModuleInit {
  private readonly logger = new Logger(RecommendationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly matrixService: InteractionMatrixService,
    private readonly tfidf: TfidfService,
    private readonly svd: SvdService,
    private readonly knn: KnnService,
  ) {}

  /**
   * Eagerly warm the corpus and SVD on startup.
   * FIX M3 — Errors are caught and logged; a startup failure never crashes
   * the module or leaves it silently degraded with no explanation.
   */
  async onModuleInit(): Promise<void> {
    try {
      await Promise.all([this.tfidf.buildCorpus(), this.svd.recompute()]);
    } catch (err) {
      this.logger.error(
        'RecommendationService: failed to warm up on startup — falling back to cold-start until next Cron tick.',
        err instanceof Error ? err.stack : String(err),
      );
    }
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  /**
   * Returns up to `limit` recommended post IDs for `userId`, ordered by score.
   * Matrix is fetched once and threaded through to avoid repeated lookups.
   */
  async recommend(userId: string, limit = 20): Promise<string[]> {
    const matrix = await this.matrixService.getMatrix();
    const userRow = matrix.get(userId) ?? new Map<string, number>();
    const interactedPostIds = [...userRow.keys()];

    if (interactedPostIds.length < COLD_START_THRESHOLD) {
      return this.coldStartFallback(userId, limit);
    }

    return this.hybridRank(userId, interactedPostIds, matrix, limit);
  }

  // ─── Hybrid Ranking ──────────────────────────────────────────────────────────

  /**
   * FIX M1 — Removed dead `userRow` parameter.
   * FIX H1 — Two parallel DB queries instead of four sequential ones:
   *           `getCandidatesWithMeta` merges what were previously two separate
   *           post queries; both run in parallel with the following query.
   * FIX C3 — `knn.scoreMany()` fetches matrix+neighbors once for all candidates.
   */
  private async hybridRank(
    userId: string,
    interactedPostIds: string[],
    matrix: InteractionMatrix,
    limit: number,
  ): Promise<string[]> {
    // FIX H1: Two queries in parallel (was four sequential)
    const [candidates, followedAuthorIds] = await Promise.all([
      this.getCandidatesWithMeta(interactedPostIds),
      this.getFollowedAuthorIds(userId),
    ]);

    if (candidates.length === 0) return [];

    const allPostIds = candidates.map((c) => c.id);
    const profileVector = this.tfidf.buildUserProfile(interactedPostIds);

    // FIX C3: One call, all posts scored in a single pass
    const knnScoreMap = await this.knn.scoreMany(userId, allPostIds);

    const scored: RecommendedPost[] = candidates.map(({ id: postId, authorId, createdAt }) => {
      const tfidfScore = this.tfidf.scorePost(profileVector, postId);
      const svdScore   = sigmoid(this.svd.predict(userId, postId));
      const knnScore   = sigmoid(knnScoreMap.get(postId) ?? 0);
      const social     = followedAuthorIds.has(authorId) ? 1 : 0;
      const recency    = this.recencyBoost(createdAt);

      const score =
        WEIGHTS.TFIDF   * tfidfScore +
        WEIGHTS.SVD     * svdScore   +
        WEIGHTS.KNN     * knnScore   +
        WEIGHTS.SOCIAL  * social     +
        WEIGHTS.RECENCY * recency;

      return { postId, score };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((r) => r.postId);
  }

  // ─── Cold-Start Fallback ─────────────────────────────────────────────────────

  /**
   * FIX H5 — Sorting is now done at the DB level via two targeted queries
   * instead of a JS-side filter over an over-fetched result set.
   */
  private async coldStartFallback(
    userId: string,
    limit: number,
  ): Promise<string[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { department: true },
    });

    const dept = user?.department;

    if (dept) {
      // Two parallel queries: same-dept first, then others
      const [sameDept, others] = await Promise.all([
        this.prisma.post.findMany({
          where: { status: 'PUBLISHED', author: { department: dept } },
          orderBy: [{ votes: { _count: 'desc' } }, { createdAt: 'desc' }],
          take: limit,
          select: { id: true },
        }),
        this.prisma.post.findMany({
          where: { status: 'PUBLISHED', NOT: { author: { department: dept } } },
          orderBy: [{ votes: { _count: 'desc' } }, { createdAt: 'desc' }],
          take: limit,
          select: { id: true },
        }),
      ]);
      return [...sameDept, ...others].slice(0, limit).map((p) => p.id);
    }

    const posts = await this.prisma.post.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: [{ votes: { _count: 'desc' } }, { createdAt: 'desc' }],
      take: limit,
      select: { id: true },
    });
    return posts.map((p) => p.id);
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  /**
   * FIX H1 — Merges the old `getCandidatePostIds` + `fetchPostMeta` into one
   * query returning all fields needed for scoring.
   */
  private async getCandidatesWithMeta(
    interactedPostIds: string[],
  ): Promise<Array<{ id: string; authorId: string; createdAt: Date }>> {
    const interactedSet = new Set(interactedPostIds);
    const posts = await this.prisma.post.findMany({
      where: { status: 'PUBLISHED' },
      select: { id: true, authorId: true, createdAt: true },
    });
    return posts.filter((p) => !interactedSet.has(p.id));
  }

  private async getFollowedAuthorIds(userId: string): Promise<Set<string>> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { following: { select: { id: true } } },
    });
    return new Set(user?.following.map((f) => f.id) ?? []);
  }

  /** FIX L2 — Uses named MS_PER_DAY constant. */
  private recencyBoost(createdAt: Date): number {
    const ageInDays = (Date.now() - createdAt.getTime()) / MS_PER_DAY;
    return Math.exp(-DECAY_LAMBDA * ageInDays);
  }
}

/**
 * FIX M2 — Merged `normaliseSvd` and `normaliseKnn` (identical bodies) into
 * one module-level sigmoid function.
 */
function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}
