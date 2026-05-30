import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  private postInclude = {
    author: {
      select: { id: true, name: true, username: true, avatar: true, reputationScore: true },
    },
    event: true,
    poll: {
      include: {
        options: {
          include: { _count: { select: { votes: true } } },
        },
      },
    },
    _count: { select: { votes: true, comments: true } },
  } as const;

  async create(authorId: string, dto: CreatePostDto) {
    const eventData = dto.event
      ? {
          title: dto.event.title,
          date: this.combineDateAndTime(dto.event.date, dto.event.time),
          location: dto.event.location ?? null,
          description: dto.event.description ?? null,
        }
      : undefined;

    const pollData = dto.poll
      ? {
          question: dto.poll.question,
          options: {
            create: dto.poll.options.map((text) => ({ text })),
          },
        }
      : undefined;

    return this.prisma.post.create({
      data: {
        title: dto.title ?? null,
        content: dto.content,
        status: dto.status ?? 'DRAFT',
        courseCode: dto.courseCode ?? null,
        authorId,
        event: eventData ? { create: eventData } : undefined,
        poll: pollData ? { create: pollData } : undefined,
      },
      include: this.postInclude,
    });
  }

  async findAllPublished(page = 1, limit = 20, authorId?: string, votedBy?: string, followingOf?: string) {
    const skip = (page - 1) * limit;
    const where: any = { status: 'PUBLISHED' as const };
    
    if (authorId) {
      where.authorId = authorId;
    }
    
    if (votedBy) {
      where.votes = {
        some: {
          userId: votedBy,
          value: 1, // Only retrieve upvotes/likes
        },
      };
    }

    if (followingOf) {
      where.author = {
        followers: {
          some: {
            id: followingOf,
          },
        },
      };
    }

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: this.postInclude,
      }),
      this.prisma.post.count({ where }),
    ]);
    return { posts, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Batch-fetch posts by IDs (used by the recommendation endpoint to hydrate
   * ranked post IDs into full post documents in a single DB round-trip).
   */
  async findManyByIds(ids: string[]) {
    return this.prisma.post.findMany({
      where: { id: { in: ids }, status: 'PUBLISHED' },
      include: this.postInclude,
    });
  }

  async findDrafts(userId: string) {
    return this.prisma.post.findMany({
      where: { authorId: userId, status: 'DRAFT' },
      orderBy: { updatedAt: 'desc' },
      include: this.postInclude,
    });
  }

  async findOne(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        ...this.postInclude,
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: {
              select: { id: true, name: true, username: true, avatar: true },
            },
          },
        },
      },
    });

    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async update(id: string, userId: string, dto: UpdatePostDto) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.authorId !== userId) throw new ForbiddenException('You can only edit your own posts');

    const updateData: Record<string, unknown> = {};
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.content !== undefined) updateData.content = dto.content;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.courseCode !== undefined) updateData.courseCode = dto.courseCode;

    if (dto.event !== undefined) {
      if (dto.event === null) {
        await this.prisma.event.deleteMany({ where: { postId: id } });
      } else {
        const eventDate = this.combineDateAndTime(dto.event.date, dto.event.time);
        await this.prisma.event.upsert({
          where: { postId: id },
          create: {
            postId: id,
            title: dto.event.title,
            date: eventDate,
            location: dto.event.location ?? null,
            description: dto.event.description ?? null,
          },
          update: {
            title: dto.event.title,
            date: eventDate,
            location: dto.event.location ?? null,
            description: dto.event.description ?? null,
          },
        });
      }
    }

    if (dto.poll !== undefined) {
      if (dto.poll === null) {
        await this.prisma.pollVote.deleteMany({ where: { poll: { postId: id } } });
        await this.prisma.pollOption.deleteMany({ where: { poll: { postId: id } } });
        await this.prisma.poll.deleteMany({ where: { postId: id } });
      } else {
        const existingPoll = await this.prisma.poll.findUnique({ where: { postId: id } });
        if (existingPoll) {
          await this.prisma.pollVote.deleteMany({ where: { pollId: existingPoll.id } });
          await this.prisma.pollOption.deleteMany({ where: { pollId: existingPoll.id } });
          await this.prisma.poll.update({
            where: { id: existingPoll.id },
            data: {
              question: dto.poll.question,
              options: {
                create: dto.poll.options.map((text) => ({ text })),
              },
            },
          });
        } else {
          await this.prisma.poll.create({
            data: {
              postId: id,
              question: dto.poll.question,
              options: {
                create: dto.poll.options.map((text) => ({ text })),
              },
            },
          });
        }
      }
    }

    return this.prisma.post.update({
      where: { id },
      data: updateData,
      include: this.postInclude,
    });
  }

  async publish(id: string, userId: string) {
    return this.update(id, userId, { status: 'PUBLISHED' });
  }

  async delete(id: string, userId: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.authorId !== userId) throw new ForbiddenException('You can only delete your own posts');
    await this.prisma.post.delete({ where: { id } });
    return { message: 'Post deleted successfully' };
  }

  async votePoll(pollId: string, userId: string, pollOptionId: string) {
    const option = await this.prisma.pollOption.findUnique({ where: { id: pollOptionId } });
    if (!option || option.pollId !== pollId) throw new NotFoundException('Poll option not found');

    const existing = await this.prisma.pollVote.findUnique({
      where: { pollId_userId: { pollId, userId } },
    });

    if (existing) {
      if (existing.pollOptionId === pollOptionId) {
        await this.prisma.pollVote.delete({ where: { id: existing.id } });
        return { voted: false, pollOptionId: null };
      }
      await this.prisma.pollVote.update({
        where: { id: existing.id },
        data: { pollOptionId },
      });
      return { voted: true, pollOptionId };
    }

    await this.prisma.pollVote.create({
      data: { pollId, pollOptionId, userId },
    });
    return { voted: true, pollOptionId };
  }

  async findUpcomingEvents(limit = 10) {
    return this.prisma.event.findMany({
      where: { date: { gte: new Date() } },
      orderBy: { date: 'asc' },
      take: limit,
      include: {
        post: {
          select: {
            id: true,
            title: true,
            courseCode: true,
            author: { select: { id: true, name: true, username: true, avatar: true } },
          },
        },
      },
    });
  }

  private combineDateAndTime(dateStr: string, timeStr?: string): Date {
    if (timeStr) {
      return new Date(`${dateStr}T${timeStr}:00`);
    }
    return new Date(`${dateStr}T00:00:00`);
  }
}
