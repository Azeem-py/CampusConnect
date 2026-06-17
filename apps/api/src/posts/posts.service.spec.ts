import { PostsService } from './posts.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

const makePrisma = (overrides: Partial<Record<string, jest.Mock>> = {}) =>
  ({
    post: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    ...overrides,
  }) as unknown as jest.Mocked<PrismaService>;

const mockPost = (id: string, votes = 0, comments = 0, reposts = 0) => ({
  id,
  title: null,
  content: 'test',
  status: 'PUBLISHED',
  courseCode: null,
  authorId: 'u1',
  author: { id: 'u1', name: 'Test', username: 'test', avatar: null, reputationScore: 0 },
  event: null,
  poll: null,
  images: [],
  votes: [],
  bookmarks: [],
  originalPostId: null,
  originalPost: null,
  _count: { votes, comments, reposts },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

describe('PostsService', () => {
  let service: PostsService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(() => {
    prisma = makePrisma();
    const mockEmitter = { emit: jest.fn() } as any;
    const mockBannedFilter = { containsBannedContent: jest.fn().mockReturnValue({ banned: false, matched: null }) } as any;
    service = new PostsService(prisma, mockEmitter, mockBannedFilter);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAllPublished — period filter', () => {
    it('does not add createdAt filter when period is "all"', async () => {
      (prisma.post.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.post.count as jest.Mock).mockResolvedValue(0);

      await service.findAllPublished(1, 20, undefined, undefined, undefined, undefined, 'latest', 'all');

      const where = (prisma.post.findMany as jest.Mock).mock.calls[0][0].where;
      expect(where.createdAt).toBeUndefined();
    });

    it('adds 7-day filter when period is "week"', async () => {
      (prisma.post.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.post.count as jest.Mock).mockResolvedValue(0);
      const before = Date.now();

      await service.findAllPublished(1, 20, undefined, undefined, undefined, undefined, 'latest', 'week');

      const where = (prisma.post.findMany as jest.Mock).mock.calls[0][0].where;
      expect(where.createdAt).toBeDefined();
      expect(where.createdAt.gte).toBeInstanceOf(Date);
      const diff = before - where.createdAt.gte.getTime();
      expect(diff).toBeGreaterThanOrEqual(6.9 * 24 * 60 * 60 * 1000);
      expect(diff).toBeLessThanOrEqual(7.1 * 24 * 60 * 60 * 1000);
    });

    it('adds 30-day filter when period is "month"', async () => {
      (prisma.post.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.post.count as jest.Mock).mockResolvedValue(0);
      const before = Date.now();

      await service.findAllPublished(1, 20, undefined, undefined, undefined, undefined, 'latest', 'month');

      const where = (prisma.post.findMany as jest.Mock).mock.calls[0][0].where;
      expect(where.createdAt).toBeDefined();
      expect(where.createdAt.gte).toBeInstanceOf(Date);
      const diff = before - where.createdAt.gte.getTime();
      expect(diff).toBeGreaterThanOrEqual(29.9 * 24 * 60 * 60 * 1000);
      expect(diff).toBeLessThanOrEqual(30.1 * 24 * 60 * 60 * 1000);
    });

    it('composes period with followingOf', async () => {
      (prisma.post.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.post.count as jest.Mock).mockResolvedValue(0);

      await service.findAllPublished(1, 20, undefined, undefined, 'u_follow', undefined, 'latest', 'week');

      const where = (prisma.post.findMany as jest.Mock).mock.calls[0][0].where;
      expect(where.createdAt).toBeDefined();
      expect(where.author).toBeDefined();
      expect(where.author.followers.some.id).toBe('u_follow');
    });
  });

  describe('findAllPublished — sort=top (engagement scoring)', () => {
    it('returns posts sorted by engagement score descending', async () => {
      const posts = [
        mockPost('p_low', 1, 0, 0),
        mockPost('p_high', 10, 5, 2),
        mockPost('p_mid', 3, 2, 1),
      ];
      (prisma.post.findMany as jest.Mock).mockResolvedValue(posts);

      const result = await service.findAllPublished(1, 20, undefined, undefined, undefined, undefined, 'top', 'all');

      expect(result.posts[0].id).toBe('p_high');
      expect(result.posts[1].id).toBe('p_mid');
      expect(result.posts[2].id).toBe('p_low');
      expect(result.total).toBe(3);
    });

    it('applies correct pagination on sorted results', async () => {
      const posts = [
        mockPost('p1', 1, 0, 0),
        mockPost('p2', 2, 0, 0),
        mockPost('p3', 3, 0, 0),
        mockPost('p4', 4, 0, 0),
        mockPost('p5', 5, 0, 0),
      ];
      (prisma.post.findMany as jest.Mock).mockResolvedValue(posts);

      const page1 = await service.findAllPublished(1, 2, undefined, undefined, undefined, undefined, 'top', 'all');
      expect(page1.posts).toHaveLength(2);
      expect(page1.posts[0].id).toBe('p5');
      expect(page1.posts[1].id).toBe('p4');
      expect(page1.total).toBe(5);
      expect(page1.totalPages).toBe(3);

      const page3 = await service.findAllPublished(3, 2, undefined, undefined, undefined, undefined, 'top', 'all');
      expect(page3.posts).toHaveLength(1);
      expect(page3.posts[0].id).toBe('p1');
    });

    it('handles null _count gracefully', async () => {
      const postWithNullCount = {
        ...mockPost('p_null'),
        _count: null,
      };
      (prisma.post.findMany as jest.Mock).mockResolvedValue([postWithNullCount]);

      const result = await service.findAllPublished(1, 20, undefined, undefined, undefined, undefined, 'top', 'all');

      expect(result.posts).toHaveLength(1);
      expect(result.posts[0].id).toBe('p_null');
    });

    it('composes top sort with followingOf filter', async () => {
      const posts = [mockPost('p1', 5, 0, 0), mockPost('p2', 1, 0, 0)];
      (prisma.post.findMany as jest.Mock).mockResolvedValue(posts);

      await service.findAllPublished(1, 20, undefined, undefined, 'u_follow', undefined, 'top', 'month');

      const where = (prisma.post.findMany as jest.Mock).mock.calls[0][0].where;
      expect(where.author.followers.some.id).toBe('u_follow');
      expect(where.createdAt).toBeDefined();
    });
  });

  describe('repost', () => {
    it('throws NotFoundException if original post does not exist', async () => {
      (prisma.post.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.repost('u1', 'p_none')).rejects.toThrow(NotFoundException);
    });

    it('creates a new simple repost if none exists (toggle on)', async () => {
      (prisma.post.findUnique as jest.Mock).mockResolvedValue({ id: 'p1', authorId: 'u2' });
      (prisma.post.findFirst as jest.Mock).mockResolvedValue(null);
      const mockCreated = { id: 'repost_id', authorId: 'u1', originalPostId: 'p1', content: '' };
      (prisma.post.create as jest.Mock).mockResolvedValue(mockCreated);

      const result = await service.repost('u1', 'p1');

      expect(prisma.post.create).toHaveBeenCalledWith({
        data: {
          authorId: 'u1',
          originalPostId: 'p1',
          content: '',
          status: 'PUBLISHED',
        },
        include: expect.any(Object),
      });
      expect(result).toEqual({ reposted: true, post: mockCreated });
    });

    it('deletes an existing simple repost if it already exists (toggle off)', async () => {
      (prisma.post.findUnique as jest.Mock).mockResolvedValue({ id: 'p1', authorId: 'u2' });
      const mockExisting = { id: 'repost_id', authorId: 'u1', originalPostId: 'p1', content: '' };
      (prisma.post.findFirst as jest.Mock).mockResolvedValue(mockExisting);

      const result = await service.repost('u1', 'p1');

      expect(prisma.post.delete).toHaveBeenCalledWith({
        where: { id: 'repost_id' },
      });
      expect(result).toEqual({ reposted: false, post: null });
    });
  });

  describe('quote', () => {
    it('throws NotFoundException if original post does not exist', async () => {
      (prisma.post.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.quote('u1', 'p_none', 'Good post')).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException if commentary content is empty', async () => {
      (prisma.post.findUnique as jest.Mock).mockResolvedValue({ id: 'p1' });

      await expect(service.quote('u1', 'p1', '')).rejects.toThrow(BadRequestException);
      await expect(service.quote('u1', 'p1', '   ')).rejects.toThrow(BadRequestException);
    });

    it('creates a new quote post successfully', async () => {
      (prisma.post.findUnique as jest.Mock).mockResolvedValue({ id: 'p1', authorId: 'u2' });
      const mockCreated = { id: 'quote_id', authorId: 'u1', originalPostId: 'p1', content: 'Incredible math!' };
      (prisma.post.create as jest.Mock).mockResolvedValue(mockCreated);

      const result = await service.quote('u1', 'p1', 'Incredible math!');

      expect(prisma.post.create).toHaveBeenCalledWith({
        data: {
          authorId: 'u1',
          originalPostId: 'p1',
          content: 'Incredible math!',
          status: 'PUBLISHED',
        },
        include: expect.any(Object),
      });
      expect(result).toEqual(mockCreated);
    });
  });
});
