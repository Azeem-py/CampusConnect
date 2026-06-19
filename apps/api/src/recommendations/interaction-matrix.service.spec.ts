import { InteractionMatrixService } from './interaction-matrix.service';
import { PrismaService } from '../prisma/prisma.service';

const makePrisma = () =>
  ({
    vote: { findMany: jest.fn() },
    comment: { findMany: jest.fn() },
    pollVote: { findMany: jest.fn() },
  }) as unknown as jest.Mocked<PrismaService>;

describe('InteractionMatrixService', () => {
  let service: InteractionMatrixService;
  let prisma: jest.Mocked<PrismaService>;

  const seedPrisma = () => {
    (prisma.vote.findMany as jest.Mock).mockResolvedValue([
      { userId: 'u1', postId: 'p1', value: 1 },
      { userId: 'u2', postId: 'p1', value: -1 },
      { userId: 'u1', postId: 'p2', value: 1 },
    ]);
    (prisma.comment.findMany as jest.Mock).mockResolvedValue([
      { authorId: 'u1', postId: 'p3' },
    ]);
    (prisma.pollVote.findMany as jest.Mock).mockResolvedValue([
      { userId: 'u3', poll: { postId: 'p1' } },
    ]);
  };

  beforeEach(() => {
    prisma = makePrisma();
    seedPrisma();
    const mockRedis = { get: jest.fn().mockResolvedValue(null), set: jest.fn(), del: jest.fn() } as any;
    service = new InteractionMatrixService(prisma as PrismaService, mockRedis);
  });

  afterEach(() => jest.clearAllMocks());

  // ─── Basic correctness ───────────────────────────────────────────────────────

  describe('getMatrix', () => {
    it('builds the matrix with correct interaction weights', async () => {
      const matrix = await service.getMatrix();
      // Upvote = +3
      expect(matrix.get('u1')?.get('p1')).toBe(3);
      // Downvote = -1
      expect(matrix.get('u2')?.get('p1')).toBe(-1);
      // Comment = +1
      expect(matrix.get('u1')?.get('p3')).toBe(1);
      // Poll vote = +0.5
      expect(matrix.get('u3')?.get('p1')).toBe(0.5);
    });

    it('accumulates multiple signals for the same (user, post) pair', async () => {
      // u1 upvoted p2 (+3) and commented on p3 (+1). p2 only has upvote.
      const matrix = await service.getMatrix();
      expect(matrix.get('u1')?.get('p2')).toBe(3);
    });

    it('returns the cached matrix on a second call without re-querying', async () => {
      await service.getMatrix();
      await service.getMatrix();
      expect(prisma.vote.findMany).toHaveBeenCalledTimes(1);
    });
  });

  // ─── FIX C1 — Stampede protection ───────────────────────────────────────────

  describe('stampede protection (C1)', () => {
    it('fires only ONE set of DB queries even when called concurrently', async () => {
      // Simulate 10 concurrent callers hitting an empty cache
      const results = await Promise.all(
        Array.from({ length: 10 }, () => service.getMatrix()),
      );

      // All should return equivalent matrix data
      const first = results[0];
      results.forEach((m) => expect(m).toEqual(first));

      // DB should have been queried exactly once, not ten times
      expect(prisma.vote.findMany).toHaveBeenCalledTimes(1);
      expect(prisma.comment.findMany).toHaveBeenCalledTimes(1);
      expect(prisma.pollVote.findMany).toHaveBeenCalledTimes(1);
    });
  });

  // ─── Invalidation ────────────────────────────────────────────────────────────

  describe('invalidate', () => {
    it('forces a rebuild on the next getMatrix() call', async () => {
      await service.getMatrix(); // first build
      service.invalidate();
      await service.getMatrix(); // should rebuild
      expect(prisma.vote.findMany).toHaveBeenCalledTimes(2);
    });

    it('returns a fresh matrix after invalidation', async () => {
      await service.getMatrix();
      service.invalidate();

      // Change the underlying data
      (prisma.vote.findMany as jest.Mock).mockResolvedValue([
        { userId: 'u9', postId: 'p9', value: 1 },
      ]);
      (prisma.comment.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.pollVote.findMany as jest.Mock).mockResolvedValue([]);

      const fresh = await service.getMatrix();
      expect(fresh.has('u9')).toBe(true);
      expect(fresh.has('u1')).toBe(false);
    });
  });
});
