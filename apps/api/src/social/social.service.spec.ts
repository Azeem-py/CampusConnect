import { Test, TestingModule } from '@nestjs/testing';
import { SocialService } from './social.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('SocialService', () => {
  let service: SocialService;
  let prisma: PrismaService;

  const mockPrisma: any = {
    $transaction: jest.fn((cb) => cb(mockPrisma)),
    post: {
      findUnique: jest.fn(),
    },
    comment: {
      findUnique: jest.fn(),
    },
    vote: {
      findFirst: jest.fn(),
      upsert: jest.fn(),
    },
    user: {
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SocialService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SocialService>(SocialService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('vote', () => {
    it('should throw BadRequestException if neither postId nor commentId is provided', async () => {
      await expect(service.vote('user1', { value: 1 }))
        .rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if post does not exist', async () => {
      mockPrisma.post.findUnique.mockResolvedValue(null);
      await expect(service.vote('user1', { postId: 'post1', value: 1 }))
        .rejects.toThrow(NotFoundException);
    });

    it('should update reputation correctly when casting a new upvote', async () => {
      mockPrisma.post.findUnique.mockResolvedValue({ authorId: 'author1' });
      mockPrisma.vote.findFirst.mockResolvedValue(null); // No existing vote
      
      await service.vote('user1', { postId: 'post1', value: 1 });

      // Upvote is +5 reputation
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'author1' },
        data: { reputationScore: { increment: 5 } }
      });
    });

    it('should update reputation correctly when switching from upvote to downvote', async () => {
      mockPrisma.post.findUnique.mockResolvedValue({ authorId: 'author1' });
      mockPrisma.vote.findFirst.mockResolvedValue({ value: 1 }); // Existing upvote (+5)
      
      await service.vote('user1', { postId: 'post1', value: -1 });

      // Switch from +5 to -2 = diff of -7
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'author1' },
        data: { reputationScore: { increment: -7 } }
      });
    });
  });
});
