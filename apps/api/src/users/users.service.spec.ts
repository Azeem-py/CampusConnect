import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { InteractionMatrixService, InteractionMatrix } from '../recommendations/interaction-matrix.service';

const makeMatrix = (interactions: Record<string, Record<string, number>>): InteractionMatrix => {
  const m: InteractionMatrix = new Map();
  Object.entries(interactions).forEach(([uid, posts]) =>
    m.set(uid, new Map(Object.entries(posts).map(([pid, v]) => [pid, v]))),
  );
  return m;
};

const makePrisma = (overrides: Partial<Record<string, jest.Mock>> = {}) =>
  ({
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(),
    ...overrides,
  }) as unknown as jest.Mocked<PrismaService>;

const makeMatrixService = (matrix: InteractionMatrix) =>
  ({
    getMatrix: jest.fn().mockResolvedValue(matrix),
    invalidate: jest.fn(),
  }) as unknown as jest.Mocked<InteractionMatrixService>;

describe('UsersService - getSuggestedScholars', () => {
  let service: UsersService;
  let prisma: jest.Mocked<PrismaService>;
  let matrixService: jest.Mocked<InteractionMatrixService>;

  const mockEmitter = { emit: jest.fn() } as any;

  const rebuild = (matrixInteractions: Record<string, Record<string, number>> = {}) => {
    const matrix = makeMatrix(matrixInteractions);
    prisma = makePrisma();
    matrixService = makeMatrixService(matrix);
    service = new UsersService(prisma, matrixService, mockEmitter);
  };

  afterEach(() => jest.clearAllMocks());

  describe('getSuggestedScholars logic', () => {
    it('returns an empty array if target user is not found', async () => {
      rebuild();
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.getSuggestedScholars('u_none');
      expect(result).toEqual([]);
    });

    it('excludes target user and already followed users from recommendations', async () => {
      rebuild();
      // u1 follows u2
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'u1',
        following: [{ id: 'u2' }],
        interests: 'Physics',
        hobby: 'Chess',
        school: 'MIT',
        department: 'Physics',
        major: 'Physics',
      });

      // Candidates list contains u2 (already followed) and u3 (not followed)
      (prisma.user.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'u3',
          name: 'Elena Rostova',
          username: 'elena_bio',
          avatar: 'avatar_elena',
          interests: 'Biology',
          hobby: 'Painting',
          department: 'Biology',
          major: 'Biology',
          school: 'Berkeley',
          reputationScore: 10,
        },
      ]);

      const result = await service.getSuggestedScholars('u1');

      // Verify the query was made to exclude u1 (self) and u2 (followed)
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: {
          id: {
            notIn: ['u1', 'u2'],
          },
          isDeactivated: false,
        },
        select: expect.any(Object),
      });

      // Should return u3
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('u3');
    });

    it('calculates higher scores for overlapping interests & hobbies (Jaccard)', async () => {
      rebuild();
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'u1',
        following: [],
        interests: 'Machine Learning, NLP, Quantum',
        hobby: 'Chess, Biking',
      });

      // u2 has overlap, u3 has zero overlap
      (prisma.user.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'u2',
          name: 'Bob',
          username: 'bob_cs',
          interests: 'Machine Learning, NLP',
          hobby: 'Chess',
          reputationScore: 0,
        },
        {
          id: 'u3',
          name: 'Frank',
          username: 'frank_chem',
          interests: 'Chemistry, Organics',
          hobby: 'Sailing',
          reputationScore: 0,
        },
      ]);

      const result = await service.getSuggestedScholars('u1');

      expect(result).toHaveLength(2);
      // Bob should be ranked first due to interest overlap
      expect(result[0].id).toBe('u2');
      expect(result[1].id).toBe('u3');
    });

    it('boosts candidates with common activity (Cosine Collaborative similarity)', async () => {
      // Setup interaction matrix where u1 and u2 have highly similar post interaction vectors
      // post ratings: u1 liked p1, p2. u2 liked p1, p2. u3 liked p3.
      rebuild({
        u1: { p1: 3, p2: 3 },
        u2: { p1: 3, p2: 3 },
        u3: { p1: -1, p3: 3 },
      });

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'u1',
        following: [],
        interests: '',
        hobby: '',
      });

      (prisma.user.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'u2',
          username: 'scholar_active',
          reputationScore: 0,
        },
        {
          id: 'u3',
          username: 'scholar_dislike',
          reputationScore: 0,
        },
      ]);

      const result = await service.getSuggestedScholars('u1');

      expect(result).toHaveLength(2);
      // u2 should be the top suggestion due to interaction cosine similarity of 1.0 vs negative/zero for u3
      expect(result[0].id).toBe('u2');
      expect(result[1].id).toBe('u3');
    });

    it('applies demographic context (same department/major/school) and reputation boosts', async () => {
      rebuild();
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'u1',
        following: [],
        interests: '',
        hobby: '',
        department: 'EECS',
        major: 'Computer Science',
        school: 'MIT',
      });

      // u2 has same department, major, and school + high reputation
      // u3 has different everything
      (prisma.user.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'u2',
          username: 'u2_peer',
          department: 'EECS',
          major: 'Computer Science',
          school: 'MIT',
          reputationScore: 200,
        },
        {
          id: 'u3',
          username: 'u3_stranger',
          department: 'Bio',
          major: 'Biology',
          school: 'Stanford',
          reputationScore: 0,
        },
      ]);

      const result = await service.getSuggestedScholars('u1');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('u2');
      expect(result[1].id).toBe('u3');
    });
  });
});
