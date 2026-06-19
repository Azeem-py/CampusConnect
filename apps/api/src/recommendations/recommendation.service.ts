import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
    private readonly configService: ConfigService,
  ) {}

  /**
   * Eagerly warm the corpus and SVD on startup.
   * FIX M3 — Errors are caught and logged; a startup failure never crashes
   * the module or leaves it silently degraded with no explanation.
   */
  async onModuleInit(): Promise<void> {
    const mode = this.configService.get<string>('RECOMMENDATION_MODE', 'enterprise');
    try {
      const warmed = await this.tfidf.warmFromCache();
      if (!warmed) {
        await this.tfidf.buildCorpus();
      }
      if (mode !== 'light' && !warmed) {
        await this.svd.recompute();
      }
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
    const [candidates, userProfile] = await Promise.all([
      this.getCandidatesWithMeta(interactedPostIds),
      this.getUserProfileAndFollows(userId),
    ]);

    if (candidates.length === 0) return [];

    const profileVector = this.tfidf.buildUserProfile(
      interactedPostIds,
      userProfile.interests,
      userProfile.hobby,
    );

    const mode = this.configService.get<string>('RECOMMENDATION_MODE', 'enterprise');

    let knnScoreMap: Map<string, number>;
    let weights: { TFIDF: number; SVD: number; KNN: number; SOCIAL: number; RECENCY: number };

    if (mode === 'light') {
      knnScoreMap = new Map();
      const total = WEIGHTS.TFIDF + WEIGHTS.SOCIAL + WEIGHTS.RECENCY;
      weights = {
        TFIDF: WEIGHTS.TFIDF / total,
        SVD: 0,
        KNN: 0,
        SOCIAL: WEIGHTS.SOCIAL / total,
        RECENCY: WEIGHTS.RECENCY / total,
      };
    } else {
      const allPostIds = candidates.map((c) => c.id);
      knnScoreMap = await this.knn.scoreMany(userId, allPostIds);
      weights = { ...WEIGHTS };
    }

    const scored: RecommendedPost[] = candidates.map(({ id: postId, authorId, createdAt }) => {
      const tfidfScore = this.tfidf.scorePost(profileVector, postId);
      const svdScore   = mode === 'light' ? 0 : sigmoid(this.svd.predict(userId, postId));
      const knnScore   = sigmoid(knnScoreMap.get(postId) ?? 0);
      const social     = userProfile.followedAuthorIds.has(authorId) ? 1 : 0;
      const recency    = this.recencyBoost(createdAt);

      const score =
        weights.TFIDF   * tfidfScore +
        weights.SVD     * svdScore   +
        weights.KNN     * knnScore   +
        weights.SOCIAL  * social     +
        weights.RECENCY * recency;

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
   *
   * Enhanced: Uses TF-IDF based content matching for users who have selected interests or hobbies,
   * while maintaining the exact original department/votes fallback logic for unit tests and unpersonalized users.
   */
  private async coldStartFallback(
    userId: string,
    limit: number,
  ): Promise<string[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { department: true, interests: true, hobby: true },
    });

    const dept = user?.department;

    // If the user has explicitly selected interests or hobby tags, perform premium content-based scoring fallback
    if (user?.interests || user?.hobby) {
      const profileVector = this.tfidf.buildUserProfile([], user.interests, user.hobby);

      const posts = await this.prisma.post.findMany({
        where: { status: 'PUBLISHED' },
        orderBy: { createdAt: 'desc' },
        take: 300,
        select: {
          id: true,
          createdAt: true,
          authorId: true,
          author: { select: { department: true } },
          _count: { select: { votes: true } },
        },
      });

      if (posts.length === 0) return [];

      const scored = posts.map((post) => {
        const tfidfScore = this.tfidf.scorePost(profileVector, post.id);
        const isSameDept = dept && post.author.department === dept ? 1.0 : 0.0;
        const votesCount = post._count.votes;
        const recency = this.recencyBoost(post.createdAt);

        // Score formula: balance interests, department relevance, popularity (votes), and recency
        const score =
          0.5 * tfidfScore +
          0.2 * isSameDept +
          0.2 * (1 - 1 / (1 + votesCount)) +
          0.1 * recency;

        return { postId: post.id, score };
      });

      return scored
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((r) => r.postId);
    }

    // Default cold-start behavior when no explicit interest/hobby tags exist (and for test compatibility)
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
    const excludeIds = interactedPostIds.slice(-500);
    const posts = await this.prisma.post.findMany({
      where: {
        status: 'PUBLISHED',
        id: { notIn: excludeIds },
      },
      orderBy: { createdAt: 'desc' },
      take: 300,
      select: { id: true, authorId: true, createdAt: true },
    });
    return posts;
  }

  private async getUserProfileAndFollows(userId: string): Promise<{
    interests: string | null;
    hobby: string | null;
    followedAuthorIds: Set<string>;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        interests: true,
        hobby: true,
        following: { select: { id: true } },
      },
    });
    return {
      interests: user?.interests ?? null,
      hobby: user?.hobby ?? null,
      followedAuthorIds: new Set(user?.following.map((f) => f.id) ?? []),
    };
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
  return 1 / (1 + Math.exp(-x)) - 0.5;
}
