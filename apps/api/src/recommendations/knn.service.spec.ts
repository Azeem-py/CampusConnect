import { KnnService } from './knn.service';
import { InteractionMatrixService, InteractionMatrix } from './interaction-matrix.service';

const buildMockMatrix = (): InteractionMatrix => {
  const m: InteractionMatrix = new Map();
  m.set('u1', new Map([['p1', 3], ['p3', 3], ['p4', -1]]));
  m.set('u2', new Map([['p2', 3], ['p4', 3]]));
  m.set('u3', new Map([['p1', 3], ['p3', 2], ['p5', 1]]));
  return m;
};

const makeMockMatrixService = (matrix = buildMockMatrix()) =>
  ({
    getMatrix: jest.fn().mockResolvedValue(matrix),
    invalidate: jest.fn(),
  }) as unknown as jest.Mocked<InteractionMatrixService>;

describe('KnnService', () => {
  let service: KnnService;
  let matrixService: jest.Mocked<InteractionMatrixService>;

  beforeEach(() => {
    matrixService = makeMockMatrixService();
    service = new KnnService(matrixService);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── getNeighbors ────────────────────────────────────────────────────────────

  describe('getNeighbors', () => {
    it('returns neighbors sorted descending by similarity', async () => {
      const neighbors = await service.getNeighbors('u1');
      // u3 shares p1 & p3 — highest similarity
      expect(neighbors[0].userId).toBe('u3');
      expect(neighbors[0].similarity).toBeGreaterThan(0);
    });

    it('returns [] for a user with no interactions', async () => {
      expect(await service.getNeighbors('u_new')).toHaveLength(0);
    });

    it('never includes the target user itself', async () => {
      const neighbors = await service.getNeighbors('u1');
      expect(neighbors.find((n) => n.userId === 'u1')).toBeUndefined();
    });

    it('caches results — matrix fetched only once on repeated calls', async () => {
      await service.getNeighbors('u1');
      await service.getNeighbors('u1');
      expect(matrixService.getMatrix).toHaveBeenCalledTimes(1);
    });
  });

  // ─── FIX C3 — scoreMany ──────────────────────────────────────────────────────

  describe('scoreMany (C3)', () => {
    it('returns a Map with an entry for every requested post ID', async () => {
      const postIds = ['p1', 'p2', 'p3', 'p5', 'unknown'];
      const scores = await service.scoreMany('u1', postIds);
      postIds.forEach((pid) => expect(scores.has(pid)).toBe(true));
    });

    it('returns 0 for a post no neighbor has rated', async () => {
      const scores = await service.scoreMany('u1', ['unknown']);
      expect(scores.get('unknown')).toBe(0);
    });

    it('returns a positive score for a post rated by a neighbor', async () => {
      // u3 (u1's top neighbor) rated p5 positively
      const scores = await service.scoreMany('u1', ['p5']);
      expect(scores.get('p5')).toBeGreaterThan(0);
    });

    it('fetches the matrix only once regardless of how many posts are scored', async () => {
      await service.scoreMany('u1', ['p1', 'p2', 'p3', 'p4', 'p5']);
      // Matrix fetched once in scoreMany(), not once per post
      expect(matrixService.getMatrix).toHaveBeenCalledTimes(1);
    });

    it('returns finite numbers for all entries', async () => {
      const scores = await service.scoreMany('u1', ['p1', 'p3', 'p5']);
      scores.forEach((score) => expect(Number.isFinite(score)).toBe(true));
    });
  });

  // ─── FIX H4 — Bounded cache ──────────────────────────────────────────────────

  describe('bounded cache (H4)', () => {
    it('clears all cached entries via clearCache()', async () => {
      await service.getNeighbors('u1');
      service.clearCache();
      // After clear, next call must re-fetch
      await service.getNeighbors('u1');
      expect(matrixService.getMatrix).toHaveBeenCalledTimes(2);
    });

    it('invalidates cache when matrix is invalidated (Bug #3 sync)', async () => {
      await service.getNeighbors('u1');
      
      // Update lastInvalidatedAt on matrix service mock to be in the future (strictly greater)
      (matrixService as any).lastInvalidatedAt = Date.now() + 1000;
      
      // The next call to getNeighbors should trigger a fresh getMatrix call
      await service.getNeighbors('u1');
      expect(matrixService.getMatrix).toHaveBeenCalledTimes(2);
    });

    it('evicts oldest entries when MAX_CACHE_ENTRIES (500) is exceeded', async () => {
      // Fill the cache beyond the 500-entry limit using unique user IDs.
      // We add 501 entries by calling getNeighbors for 501 different users
      // (they all get an empty neighbor list, but the cache entry is still set).
      const matrix = buildMockMatrix();
      // Add 502 new users with empty rows so they each get an empty neighbor cache entry
      for (let i = 0; i < 502; i++) {
        matrix.set(`synthetic_${i}`, new Map());
      }
      const bigMatrixService = makeMockMatrixService(matrix);
      const bigService = new KnnService(bigMatrixService);

      for (let i = 0; i < 502; i++) {
        await bigService.getNeighbors(`synthetic_${i}`, matrix);
      }

      // The cache should not exceed MAX_CACHE_ENTRIES (500)
      // We can't access the private field directly, but we can verify that
      // the first user (synthetic_0) was evicted — calling getNeighbors for
      // it again should require a fresh matrix fetch.
      const callsBefore = (bigMatrixService.getMatrix as jest.Mock).mock.calls.length;
      // synthetic_0 should have been evicted — it won't be in cache
      await bigService.getNeighbors('synthetic_0', undefined);
      // getMatrix was called again because cache miss
      const callsAfter = (bigMatrixService.getMatrix as jest.Mock).mock.calls.length;
      expect(callsAfter).toBeGreaterThan(callsBefore);
    });
  });
});
