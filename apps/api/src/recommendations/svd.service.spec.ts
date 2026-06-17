import { ConfigService } from '@nestjs/config';
import { SvdService } from './svd.service';
import { InteractionMatrixService, InteractionMatrix } from './interaction-matrix.service';

/** Builds a 6-user × 6-post sparse matrix with two clear clusters. */
const buildMockMatrix = (): InteractionMatrix => {
  const m: InteractionMatrix = new Map();
  // Physics cluster
  m.set('u1', new Map([['p1', 3], ['p2', 3], ['p3', 1], ['p4', -1]]));
  m.set('u2', new Map([['p1', 2], ['p2', 3], ['p3', 2]]));
  m.set('u3', new Map([['p1', 3], ['p3', 3], ['p4', -1], ['p5', 1]]));
  // CS cluster
  m.set('u4', new Map([['p4', 3], ['p5', 3], ['p6', 2], ['p1', -1]]));
  m.set('u5', new Map([['p4', 2], ['p5', 3], ['p6', 3]]));
  m.set('u6', new Map([['p4', 3], ['p5', 1], ['p6', 3], ['p2', -1]]));
  return m;
};

const makeMockMatrixService = (matrix = buildMockMatrix()) =>
  ({
    getMatrix: jest.fn().mockResolvedValue(matrix),
    invalidate: jest.fn(),
  }) as unknown as jest.Mocked<InteractionMatrixService>;

const makeConfigService = (mode = 'enterprise') =>
  ({
    get: jest.fn().mockImplementation((key: string, defaultValue?: string) => {
      if (key === 'RECOMMENDATION_MODE') return mode;
      return defaultValue;
    }),
  }) as unknown as jest.Mocked<ConfigService>;

describe('SvdService', () => {
  let service: SvdService;
  let matrixService: jest.Mocked<InteractionMatrixService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    matrixService = makeMockMatrixService();
    configService = makeConfigService();
    service = new SvdService(matrixService, configService);
    await service.recompute();
  });

  afterEach(() => jest.clearAllMocks());

  // ─── Cold-start / unknown IDs ────────────────────────────────────────────────

  describe('predict — cold-start', () => {
    it('returns 0 for an unknown user', () => {
      expect(service.predict('u_unknown', 'p1')).toBe(0);
    });

    it('returns 0 for an unknown post', () => {
      expect(service.predict('u1', 'p_unknown')).toBe(0);
    });

    it('returns 0 before any recompute', () => {
      const fresh = new SvdService(matrixService, configService);
      expect(fresh.predict('u1', 'p1')).toBe(0);
    });
  });

  // ─── Numerical correctness ───────────────────────────────────────────────────

  describe('predict — correctness', () => {
    it('returns a finite number for all known (user, post) pairs', () => {
      ['u1', 'u2', 'u4', 'u5'].forEach((uid) => {
        ['p1', 'p2', 'p4', 'p5'].forEach((pid) => {
          expect(Number.isFinite(service.predict(uid, pid))).toBe(true);
        });
      });
    });

    it('produces distinct scores for different (user, post) pairs', () => {
      const scores = new Set([
        service.predict('u1', 'p1'),
        service.predict('u1', 'p4'),
        service.predict('u4', 'p1'),
        service.predict('u4', 'p4'),
      ]);
      expect(scores.size).toBeGreaterThan(1);
    });

    it('never returns NaN', () => {
      ['u1', 'u2', 'u3', 'u4', 'u5', 'u6'].forEach((uid) => {
        ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'].forEach((pid) => {
          expect(service.predict(uid, pid)).not.toBeNaN();
        });
      });
    });
  });

  // ─── FIX C4 — Sparse: no dense matrix allocated ──────────────────────────────

  describe('sparse implementation (C4)', () => {
    it('handles an empty matrix gracefully', async () => {
      const empty = new SvdService(makeMockMatrixService(new Map()), configService);
      await expect(empty.recompute()).resolves.not.toThrow();
      expect(empty.predict('u1', 'p1')).toBe(0);
    });

    it('works correctly with a single-user single-post matrix', async () => {
      const tiny = new Map([['u1', new Map([['p1', 3]])]]);
      const svc = new SvdService(makeMockMatrixService(tiny), configService);
      await svc.recompute();
      expect(Number.isFinite(svc.predict('u1', 'p1'))).toBe(true);
    });
  });

  // ─── FIX H3 — Async / event-loop yields ─────────────────────────────────────

  describe('event-loop friendly (H3)', () => {
    it('recompute() returns a Promise (is async)', () => {
      const result = service.recompute();
      expect(result).toBeInstanceOf(Promise);
      return result;
    });

    it('concurrent recompute() calls share one in-flight Promise', async () => {
      const svc = new SvdService(matrixService, configService);
      jest.clearAllMocks();
      await Promise.all([svc.recompute(), svc.recompute(), svc.recompute()]);
      // Matrix was only fetched once, not three times
      expect(matrixService.getMatrix).toHaveBeenCalledTimes(1);
    });
  });

  // ─── Light mode ──────────────────────────────────────────────────────────────

  describe('light mode', () => {
    it('skips decomposition and returns 0 for all predictions', async () => {
      const freshMatrixService = makeMockMatrixService();
      const lightConfig = makeConfigService('light');
      const lightSvc = new SvdService(freshMatrixService, lightConfig);
      await lightSvc.recompute();
      expect(freshMatrixService.getMatrix).not.toHaveBeenCalled();
      expect(lightSvc.predict('u1', 'p1')).toBe(0);
    });
  });

  // ─── getPostIds ──────────────────────────────────────────────────────────────

  describe('getPostIds', () => {
    it('returns all post IDs from the interaction matrix', () => {
      const ids = service.getPostIds();
      ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'].forEach((pid) =>
        expect(ids).toContain(pid),
      );
    });

    it('returns [] before any recompute', () => {
      const fresh = new SvdService(matrixService, configService);
      expect(fresh.getPostIds()).toEqual([]);
    });
  });
});
