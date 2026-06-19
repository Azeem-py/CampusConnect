import { TfidfService } from './tfidf.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPosts = [
  {
    id: 'p1',
    title: 'Quantum Computing Qubits',
    content: 'Quantum entanglement enables faster computing algorithms.',
    courseCode: 'PHYS-8.421',
    author: { department: 'Physics', major: 'Quantum Engineering' },
  },
  {
    id: 'p2',
    title: 'Deep Learning Transformers',
    content: 'Attention mechanisms power modern NLP models.',
    courseCode: 'CS-6.862',
    author: { department: 'Computer Science', major: 'Computer Science' },
  },
  {
    id: 'p3',
    title: 'Quantum Neural Networks',
    content: 'Combining quantum circuits with neural network architectures.',
    courseCode: 'PHYS-101',
    author: { department: 'Physics', major: 'Physics' },
  },
];

const makePrisma = (posts = mockPosts) =>
  ({
    post: { findMany: jest.fn().mockResolvedValue(posts) },
  }) as unknown as jest.Mocked<PrismaService>;

const makeRedis = () =>
  ({ get: jest.fn().mockResolvedValue(null), set: jest.fn(), del: jest.fn() }) as any;

describe('TfidfService', () => {
  let service: TfidfService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    prisma = makePrisma();
    service = new TfidfService(prisma as PrismaService, makeRedis());
    await service.buildCorpus();
  });

  afterEach(() => jest.clearAllMocks());

  // ─── Corpus building ─────────────────────────────────────────────────────────

  describe('buildCorpus', () => {
    it('indexes all post IDs', () => {
      expect(service.getAllPostIds()).toHaveLength(3);
      ['p1', 'p2', 'p3'].forEach((id) =>
        expect(service.getAllPostIds()).toContain(id),
      );
    });

    it('marks the service as ready after a successful build', () => {
      expect(service.isReady).toBe(true);
    });

    it('handles an empty post list without error', async () => {
      const empty = new TfidfService(makePrisma([]), makeRedis());
      await expect(empty.buildCorpus()).resolves.not.toThrow();
      expect(empty.isReady).toBe(false);
    });

    // FIX C2 — Concurrent build lock
    it('runs only one DB query even when called concurrently', async () => {
      const freshService = new TfidfService(prisma as PrismaService, makeRedis());
      jest.clearAllMocks();
      // 5 concurrent callers
      await Promise.all(Array.from({ length: 5 }, () => freshService.buildCorpus()));
      expect(prisma.post.findMany).toHaveBeenCalledTimes(1);
    });
  });

  // ─── buildUserProfile ────────────────────────────────────────────────────────

  describe('buildUserProfile', () => {
    it('returns an empty map for unknown post IDs', () => {
      expect(service.buildUserProfile(['unknown'])).toEqual(new Map());
    });

    it('returns an empty map when the corpus is empty', async () => {
      const empty = new TfidfService(makePrisma([]), makeRedis());
      await empty.buildCorpus();
      expect(empty.buildUserProfile(['p1']).size).toBe(0);
    });

    it('accumulates terms across multiple interacted posts', () => {
      const single = service.buildUserProfile(['p1']);
      const multi  = service.buildUserProfile(['p1', 'p3']);
      expect(multi.size).toBeGreaterThanOrEqual(single.size);
    });
  });

  // ─── scorePost ───────────────────────────────────────────────────────────────

  describe('scorePost', () => {
    it('returns 0 for an empty profile vector', () => {
      expect(service.scorePost(new Map(), 'p1')).toBe(0);
    });

    it('returns 0 for an unknown post ID', () => {
      const profile = service.buildUserProfile(['p1']);
      expect(service.scorePost(profile, 'unknown')).toBe(0);
    });

    it('returns a score in [0, 1]', () => {
      const profile = service.buildUserProfile(['p1']);
      const score = service.scorePost(profile, 'p3');
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('scores a post against its own profile as 1.0', () => {
      const profile = service.buildUserProfile(['p2']);
      expect(service.scorePost(profile, 'p2')).toBeCloseTo(1.0, 5);
    });

    it('scores a physics post higher for a physics user than a CS post', () => {
      const profile = service.buildUserProfile(['p1']); // quantum physics
      const scorePhysics = service.scorePost(profile, 'p3'); // also physics
      const scoreCS      = service.scorePost(profile, 'p2'); // deep learning
      expect(scorePhysics).toBeGreaterThan(scoreCS);
    });

    it('scores a post with matching hashtags higher', () => {
      const postsWithTags = [
        {
          id: 'p1',
          title: 'Quantum Physics',
          content: 'Intro to quantum particles.',
          courseCode: 'PHYS-101',
          tags: ['quantum', 'particles'],
          author: { department: 'Physics', major: 'Physics' },
        },
        {
          id: 'p2',
          title: 'Deep Learning NLP',
          content: 'Transformer models are powerful.',
          courseCode: 'CS-412',
          tags: ['ai', 'transformers'],
          author: { department: 'Computer Science', major: 'Computer Science' },
        },
      ];
      const tagService = new TfidfService(makePrisma(postsWithTags), makeRedis());
      return tagService.buildCorpus().then(() => {
        const profile = tagService.buildUserProfile([], 'transformers', null);
        const scoreP1 = tagService.scorePost(profile, 'p1');
        const scoreP2 = tagService.scorePost(profile, 'p2');
        expect(scoreP2).toBeGreaterThan(scoreP1);
        expect(scoreP2).toBeGreaterThan(0);
      });
    });
  });
});
