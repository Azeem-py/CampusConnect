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
    },
    ...overrides,
  }) as unknown as jest.Mocked<PrismaService>;

describe('PostsService - Repost and Quote Post', () => {
  let service: PostsService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(() => {
    prisma = makePrisma();
    service = new PostsService(prisma);
  });

  afterEach(() => jest.clearAllMocks());

  describe('repost', () => {
    it('throws NotFoundException if original post does not exist', async () => {
      (prisma.post.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.repost('u1', 'p_none')).rejects.toThrow(NotFoundException);
    });

    it('creates a new simple repost if none exists (toggle on)', async () => {
      // Original post exists
      (prisma.post.findUnique as jest.Mock).mockResolvedValue({ id: 'p1', authorId: 'u2' });
      // No existing simple repost
      (prisma.post.findFirst as jest.Mock).mockResolvedValue(null);
      // Mock create
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
      // Original post exists
      (prisma.post.findUnique as jest.Mock).mockResolvedValue({ id: 'p1', authorId: 'u2' });
      // Simple repost already exists
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
