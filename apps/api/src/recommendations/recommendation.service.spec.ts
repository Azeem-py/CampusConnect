import { ConfigService } from '@nestjs/config';
import { RecommendationService } from './recommendation.service';
import { PrismaService } from '../prisma/prisma.service';
import { InteractionMatrixService, InteractionMatrix } from './interaction-matrix.service';
import { TfidfService } from './tfidf.service';
import { SvdService } from './svd.service';
import { KnnService } from './knn.service';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const makeMatrix = (interactions: Record<string, Record<string, number>>): InteractionMatrix => {
  const m: InteractionMatrix = new Map();
  Object.entries(interactions).forEach(([uid, posts]) =>
    m.set(uid, new Map(Object.entries(posts).map(([pid, v]) => [pid, v]))),
  );
  return m;
};

const makePrisma = (overrides: Partial<Record<string, jest.Mock>> = {}) =>
  ({
    user: { findUnique: jest.fn() },
    post: { findMany: jest.fn() },
    ...overrides,
  }) as unknown as jest.Mocked<PrismaService>;

const makeMatrixService = (matrix: InteractionMatrix) =>
  ({
    getMatrix: jest.fn().mockResolvedValue(matrix),
    invalidate: jest.fn(),
  }) as unknown as jest.Mocked<InteractionMatrixService>;

const makeTfidf = () =>
  ({
    buildCorpus: jest.fn().mockResolvedValue(undefined),
    buildUserProfile: jest.fn().mockReturnValue(new Map()),
    scorePost: jest.fn().mockReturnValue(0.5),
    isReady: true,
  }) as unknown as jest.Mocked<TfidfService>;

const makeSvd = () =>
  ({
    recompute: jest.fn().mockResolvedValue(undefined),
    predict: jest.fn().mockReturnValue(0.2),
  }) as unknown as jest.Mocked<SvdService>;

const makeKnn = () =>
  ({
    scoreMany: jest.fn().mockResolvedValue(new Map()),
    clearCache: jest.fn(),
  }) as unknown as jest.Mocked<KnnService>;

const makeConfigService = (mode = 'enterprise') =>
  ({
    get: jest.fn().mockImplementation((key: string, defaultValue?: string) => {
      if (key === 'RECOMMENDATION_MODE') return mode;
      return defaultValue;
    }),
  }) as unknown as jest.Mocked<ConfigService>;

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe('RecommendationService', () => {
  let service: RecommendationService;
  let prisma: jest.Mocked<PrismaService>;
  let matrixService: jest.Mocked<InteractionMatrixService>;
  let tfidf: jest.Mocked<TfidfService>;
  let svd: jest.Mocked<SvdService>;
  let knn: jest.Mocked<KnnService>;
  let configService: jest.Mocked<ConfigService>;

  /** Resets all mocks and rebuilds the service with fresh instances. */
  const rebuild = (
    matrixInteractions: Record<string, Record<string, number>> = {},
    mode = 'enterprise',
  ) => {
    const matrix = makeMatrix(matrixInteractions);
    prisma = makePrisma();
    matrixService = makeMatrixService(matrix);
    tfidf = makeTfidf();
    svd = makeSvd();
    knn = makeKnn();
    configService = makeConfigService(mode);
    service = new RecommendationService(prisma, matrixService, tfidf, svd, knn, configService);
  };

  afterEach(() => jest.clearAllMocks());

  // ─── onModuleInit (FIX M3) ───────────────────────────────────────────────────

  describe('onModuleInit (M3 — error handling)', () => {
    it('warms up TF-IDF and SVD on startup', async () => {
      rebuild();
      await service.onModuleInit();
      expect(tfidf.buildCorpus).toHaveBeenCalledTimes(1);
      expect(svd.recompute).toHaveBeenCalledTimes(1);
    });

    it('does NOT throw if warmup fails — logs and continues', async () => {
      rebuild();
      tfidf.buildCorpus = jest.fn().mockRejectedValue(new Error('DB down'));
      await expect(service.onModuleInit()).resolves.not.toThrow();
    });
  });

  // ─── Cold-start path ─────────────────────────────────────────────────────────

  describe('recommend — cold-start (< 3 interactions)', () => {
    beforeEach(() => {
      // User u1 has only 2 interactions → cold-start
      rebuild({ u1: { p1: 3, p2: 1 } });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ department: 'Physics' });
      (prisma.post.findMany as jest.Mock).mockImplementation((args) => {
        if (args?.where?.NOT) {
          // Others query
          return Promise.resolve([{ id: 'p11' }]);
        }
        // Same-department query
        return Promise.resolve([{ id: 'p10' }]);
      });
    });

    it('returns trending post IDs without calling SVD, KNN or TF-IDF scoring', async () => {
      const results = await service.recommend('u1', 5);
      expect(results).toHaveLength(2);
      expect(tfidf.scorePost).not.toHaveBeenCalled();
      expect(svd.predict).not.toHaveBeenCalled();
      expect(knn.scoreMany).not.toHaveBeenCalled();
    });

    it('handles a user with no interactions (empty matrix row)', async () => {
      rebuild({});
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ department: null });
      (prisma.post.findMany as jest.Mock).mockResolvedValue([{ id: 'p1' }]);
      const results = await service.recommend('u_new');
      expect(results).toEqual(['p1']);
    });
  });

  // ─── Warm (personalised) path ────────────────────────────────────────────────

  describe('recommend — warm path (≥ 3 interactions)', () => {
    const candidatePosts = [
      { id: 'p10', authorId: 'author1', createdAt: new Date() },
      { id: 'p11', authorId: 'author2', createdAt: new Date(Date.now() - 30 * 86_400_000) },
    ];

    beforeEach(() => {
      // u1 has 4 interactions → warm path
      rebuild({ u1: { p1: 3, p2: 3, p3: 1, p4: -1 } });

      (prisma.post.findMany as jest.Mock).mockResolvedValue(candidatePosts);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        following: [{ id: 'author1' }],
      });

      knn.scoreMany = jest.fn().mockResolvedValue(
        new Map([['p10', 2.0], ['p11', 0.5]]),
      );
    });

    it('returns an array of post IDs', async () => {
      const results = await service.recommend('u1', 10);
      expect(Array.isArray(results)).toBe(true);
      results.forEach((id) => expect(typeof id).toBe('string'));
    });

    it('respects the limit parameter', async () => {
      const results = await service.recommend('u1', 1);
      expect(results).toHaveLength(1);
    });

    // FIX H1 — Parallel queries
    it('issues exactly 2 DB queries in parallel (not 4 sequential)', async () => {
      const callOrder: string[] = [];
      (prisma.post.findMany as jest.Mock).mockImplementation(async () => {
        callOrder.push('post');
        return candidatePosts;
      });
      (prisma.user.findUnique as jest.Mock).mockImplementation(async () => {
        callOrder.push('user');
        return { following: [] };
      });

      await service.recommend('u1', 5);
      // Both queries should have been issued (order may vary — they're parallel)
      expect(callOrder).toContain('post');
      expect(callOrder).toContain('user');
      expect(prisma.post.findMany).toHaveBeenCalledTimes(1);
      expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
    });

    // FIX C3 — scoreMany called once
    it('calls knn.scoreMany once with all candidate IDs (not once per post)', async () => {
      await service.recommend('u1', 10);
      expect(knn.scoreMany).toHaveBeenCalledTimes(1);
      const calledWith = (knn.scoreMany as jest.Mock).mock.calls[0];
      expect(calledWith[0]).toBe('u1');
      expect(calledWith[1]).toEqual(expect.arrayContaining(['p10', 'p11']));
    });

    it('returns an empty array when there are no candidate posts', async () => {
      (prisma.post.findMany as jest.Mock).mockResolvedValue([]);
      const results = await service.recommend('u1', 10);
      expect(results).toEqual([]);
    });

    it('applies social boost — followed-author post scores higher than equally-scored unfollowed', async () => {
      // Both posts get the same SVD/KNN/TF-IDF scores but p10's author is followed
      svd.predict = jest.fn().mockReturnValue(0);
      tfidf.scorePost = jest.fn().mockReturnValue(0);
      knn.scoreMany = jest.fn().mockResolvedValue(new Map([['p10', 0], ['p11', 0]]));

      // p10: authorId = 'author1' (followed), p11: authorId = 'author2' (not followed)
      const results = await service.recommend('u1', 2);
      expect(results[0]).toBe('p10');
    });

    it('applies recency boost — newer post wins over equally-scored older post', async () => {
      const now = new Date();
      const oldDate = new Date(Date.now() - 100 * 86_400_000); // 100 days ago
      (prisma.post.findMany as jest.Mock).mockResolvedValue([
        { id: 'pOld', authorId: 'a1', createdAt: oldDate },
        { id: 'pNew', authorId: 'a2', createdAt: now },
      ]);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ following: [] });
      svd.predict = jest.fn().mockReturnValue(0);
      tfidf.scorePost = jest.fn().mockReturnValue(0);
      knn.scoreMany = jest.fn().mockResolvedValue(new Map([['pOld', 0], ['pNew', 0]]));

      const results = await service.recommend('u1', 2);
      expect(results[0]).toBe('pNew');
    });
  });

  // ─── Light mode ──────────────────────────────────────────────────────────────

  describe('light mode', () => {
    describe('onModuleInit — startup warmup', () => {
      it('does NOT trigger SVD recompute in light mode', async () => {
        rebuild({ u1: { p1: 3 } }, 'light');
        await service.onModuleInit();
        expect(tfidf.buildCorpus).toHaveBeenCalledTimes(1);
        expect(svd.recompute).not.toHaveBeenCalled();
      });
    });

    describe('cold-start', () => {
      it('returns department-based results without calling SVD or KNN', async () => {
        rebuild({ u1: { p1: 3, p2: 1 } }, 'light');
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({ department: 'Physics' });
        (prisma.post.findMany as jest.Mock).mockImplementation((args) => {
          if (args?.where?.NOT) return Promise.resolve([{ id: 'p11' }]);
          return Promise.resolve([{ id: 'p10' }]);
        });
        const results = await service.recommend('u1', 5);
        expect(results).toEqual(['p10', 'p11']);
        expect(svd.predict).not.toHaveBeenCalled();
        expect(knn.scoreMany).not.toHaveBeenCalled();
      });
    });

    describe('recommend — scoring', () => {
      const candidatePosts = [
        { id: 'p10', authorId: 'author1', createdAt: new Date() },
        { id: 'p11', authorId: 'author2', createdAt: new Date(Date.now() - 30 * 86_400_000) },
      ];

      beforeEach(() => {
        rebuild({ u1: { p1: 3, p2: 3, p3: 1, p4: -1 } }, 'light');
        (prisma.post.findMany as jest.Mock).mockResolvedValue(candidatePosts);
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({ following: [] });
      });

      it('does not invoke knn.scoreMany or svd.predict in light mode', async () => {
        svd.predict = jest.fn().mockReturnValue(0.5);
        await service.recommend('u1', 10);
        expect(knn.scoreMany).not.toHaveBeenCalled();
        expect(svd.predict).not.toHaveBeenCalled();
      });

      it('applies recency boost — newer post ranks first when scores are equal', async () => {
        tfidf.scorePost = jest.fn().mockReturnValue(0.5);
        const results = await service.recommend('u1', 10);
        expect(results).toEqual(['p10', 'p11']);
      });
    });
  });
});
