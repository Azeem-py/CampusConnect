import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { NOTIFICATION_EVENT } from '../notifications/notification-listener.service';
import { BannedWordFilter } from '../admin/banned-word.filter';

@Injectable()
export class PostsService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private eventEmitter: EventEmitter2,
    private bannedWordFilter: BannedWordFilter,
  ) {}

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
    votes: {
      select: {
        userId: true,
        value: true,
      },
    },
    bookmarks: {
      select: {
        userId: true,
      },
    },
    tags: true,
    originalPost: {
      include: {
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
        votes: {
          select: {
            userId: true,
            value: true,
          },
        },
        bookmarks: {
          select: {
            userId: true,
          },
        },
        tags: true,
        _count: { select: { votes: true, comments: true, reposts: true } },
      },
    },
    _count: { select: { votes: true, comments: true, reposts: true } },
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

    const extractedTags = this.extractHashtags(dto.content);
    const mergedTags = Array.from(new Set([...(dto.tags ?? []), ...extractedTags]));

    const bannedCheck = this.bannedWordFilter.containsBannedContent(dto.content);
    if (bannedCheck.banned) {
      throw new BadRequestException(
        `Your post contains prohibited content (matched: "${bannedCheck.matched}"). Please remove it and try again.`,
      );
    }

    const post = await this.prisma.post.create({
      data: {
        title: dto.title ?? null,
        content: dto.content,
        status: dto.status ?? 'DRAFT',
        courseCode: dto.courseCode ?? null,
        authorId,
        communityId: dto.communityId ?? null,
        groupId: dto.groupId ?? null,
        event: eventData ? { create: eventData } : undefined,
        poll: pollData ? { create: pollData } : undefined,
        images: dto.images ?? [],
        tags: {
          connectOrCreate: mergedTags.map((tag) => ({
            where: { name: tag },
            create: { name: tag },
          })),
        },
      },
      include: this.postInclude,
    });

    // Handle mentions
    const mentionedUsernames = this.extractMentions(dto.content);
    if (mentionedUsernames.length > 0 && post.status === 'PUBLISHED') {
      const mentionedUsers = await this.prisma.user.findMany({
        where: {
          username: { in: mentionedUsernames },
          isDeactivated: false,
        },
        select: { id: true },
      });

      for (const targetUser of mentionedUsers) {
        if (targetUser.id !== authorId) {
          this.eventEmitter.emit(NOTIFICATION_EVENT, {
            recipientId: targetUser.id,
            type: 'MENTION',
            actorId: authorId,
            postId: post.id,
            metadata: {},
          });
        }
      }
    }

    return post;
  }

  async findAllPublished(
    page = 1,
    limit = 20,
    authorId?: string,
    votedBy?: string,
    followingOf?: string,
    search?: string,
    sort: 'latest' | 'top' = 'latest',
    period: 'all' | 'week' | 'month' = 'all',
    communityId?: string,
  ) {
    const skip = (page - 1) * limit;
    const where: any = {
      status: 'PUBLISHED' as const,
      author: {
        isDeactivated: false,
      },
    };
    
    if (authorId) {
      where.authorId = authorId;
    }
    
    if (votedBy) {
      where.votes = {
        some: {
          userId: votedBy,
          value: 1,
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

    if (communityId) {
      where.communityId = communityId;
    }

    if (period === 'week') {
      where.createdAt = {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      };
    } else if (period === 'month') {
      where.createdAt = {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      };
    }

    if (search) {
      const cleanSearch = search.trim();
      if (cleanSearch) {
        const isHashtag = cleanSearch.startsWith('#');
        const searchWord = isHashtag ? cleanSearch.substring(1) : cleanSearch;

        where.OR = [
          { content: { contains: cleanSearch, mode: 'insensitive' } },
          { title: { contains: cleanSearch, mode: 'insensitive' } },
          { courseCode: { contains: cleanSearch, mode: 'insensitive' } },
          { courseCode: { contains: searchWord, mode: 'insensitive' } },
          { author: { name: { contains: cleanSearch, mode: 'insensitive' } } },
          { author: { username: { contains: cleanSearch, mode: 'insensitive' } } },
        ];

        if (isHashtag) {
          where.OR.push(
            { content: { contains: searchWord, mode: 'insensitive' } },
            { title: { contains: searchWord, mode: 'insensitive' } }
          );
        }
      }
    }

    if (sort === 'top') {
      const allPosts = await this.prisma.post.findMany({
        where,
        include: this.postInclude,
      });

      const scored = allPosts
        .map((post) => ({
          post,
          score:
            (post._count?.votes ?? 0) * 2 +
            (post._count?.comments ?? 0) * 3 +
            (post._count?.reposts ?? 0) * 4 +
            1,
        }))
        .sort((a, b) => b.score - a.score);

      const total = scored.length;
      const paged = scored.slice(skip, skip + limit).map((entry) => entry.post);

      return { posts: paged, total, page, limit, totalPages: Math.ceil(total / limit) };
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
      where: {
        id: { in: ids },
        status: 'PUBLISHED',
        author: { isDeactivated: false },
      },
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
      include: this.postInclude,
    });

    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async findComments(postId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: { postId, parentId: null },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
        include: {
          author: {
            select: { id: true, name: true, username: true, avatar: true },
          },
          votes: true,
          replies: {
            orderBy: { createdAt: 'asc' },
            include: {
              author: {
                select: { id: true, name: true, username: true, avatar: true },
              },
              votes: true,
            },
          },
        },
      }),
      this.prisma.comment.count({ where: { postId, parentId: null } }),
    ]);

    return {
      comments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }


  async update(id: string, userId: string, dto: UpdatePostDto) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: { tags: true },
    });
    if (!post) throw new NotFoundException('Post not found');
    if (post.authorId !== userId) throw new ForbiddenException('You can only edit your own posts');

    const updateData: Record<string, any> = {};
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.content !== undefined) updateData.content = dto.content;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.courseCode !== undefined) updateData.courseCode = dto.courseCode;
    if (dto.images !== undefined) updateData.images = dto.images;

    if (dto.tags !== undefined || dto.content !== undefined) {
      const content = dto.content !== undefined ? dto.content : post.content;
      const existingTagNames = post.tags.map((t) => t.name);
      const explicitTags = dto.tags !== undefined ? dto.tags : existingTagNames;
      const extractedTags = this.extractHashtags(content);
      const mergedTags = Array.from(new Set([...explicitTags, ...extractedTags]));

      updateData.tags = {
        set: [],
        connectOrCreate: mergedTags.map((tag) => ({
          where: { name: tag },
          create: { name: tag },
        })),
      };
    }

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

    const updatedPost = await this.prisma.post.update({
      where: { id },
      data: updateData,
      include: this.postInclude,
    });

    // Handle mentions
    const finalContent = dto.content !== undefined ? dto.content : post.content;
    const mentionedUsernames = this.extractMentions(finalContent);
    if (mentionedUsernames.length > 0 && (dto.status === 'PUBLISHED' || post.status === 'PUBLISHED')) {
      const mentionedUsers = await this.prisma.user.findMany({
        where: {
          username: { in: mentionedUsernames },
          isDeactivated: false,
        },
        select: { id: true },
      });

      for (const targetUser of mentionedUsers) {
        if (targetUser.id !== userId) {
          const existingNotif = await this.prisma.notification.findFirst({
            where: {
              recipientId: targetUser.id,
              type: 'MENTION',
              actorId: userId,
              postId: id,
            },
          });

          if (!existingNotif) {
await this.eventEmitter.emitAsync(NOTIFICATION_EVENT, {
              recipientId: targetUser.id,
              type: 'MENTION',
              actorId: userId,
              postId: id,
              metadata: {},
            });
          }
        }
      }
    }

    return updatedPost;
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

  async addComment(postId: string, authorId: string, dto: CreateCommentDto) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    if (dto.parentId) {
      const parentComment = await this.prisma.comment.findUnique({ where: { id: dto.parentId } });
      if (!parentComment) throw new NotFoundException('Parent comment not found');
      if (parentComment.postId !== postId) throw new BadRequestException('Parent comment does not belong to this post');
    }

    const bannedCheck = this.bannedWordFilter.containsBannedContent(dto.content);
    if (bannedCheck.banned) {
      throw new BadRequestException(
        `Your comment contains prohibited content (matched: "${bannedCheck.matched}"). Please remove it and try again.`,
      );
    }

    const comment = await this.prisma.comment.create({
      data: {
        content: dto.content,
        postId,
        authorId,
        parentId: dto.parentId ?? null,
      },
      include: {
        author: {
          select: { id: true, name: true, username: true, avatar: true },
        },
      },
    });

    // Notify post author (or parent comment author for replies)
    if (dto.parentId) {
      const parentComment = await this.prisma.comment.findUnique({ where: { id: dto.parentId } });
      if (parentComment && parentComment.authorId !== authorId) {
        this.eventEmitter.emit(NOTIFICATION_EVENT, {
          recipientId: parentComment.authorId,
          type: 'REPLY',
          actorId: authorId,
          postId,
          commentId: comment.id,
          metadata: { parentCommentId: dto.parentId },
        });
      }
    } else if (post.authorId !== authorId) {
      this.eventEmitter.emit(NOTIFICATION_EVENT, {
        recipientId: post.authorId,
        type: 'COMMENT',
        actorId: authorId,
        postId,
        commentId: comment.id,
        metadata: {},
      });
    }

    // Handle mentions in comments
    const mentionedUsernames = this.extractMentions(dto.content);
    if (mentionedUsernames.length > 0) {
      const mentionedUsers = await this.prisma.user.findMany({
        where: {
          username: { in: mentionedUsernames },
          isDeactivated: false,
        },
        select: { id: true },
      });

      for (const targetUser of mentionedUsers) {
        if (targetUser.id !== authorId) {
          this.eventEmitter.emit(NOTIFICATION_EVENT, {
            recipientId: targetUser.id,
            type: 'MENTION',
            actorId: authorId,
            postId,
            commentId: comment.id,
            metadata: {},
          });
        }
      }
    }

    return comment;
  }

  async deleteComment(postId: string, commentId: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.postId !== postId) throw new BadRequestException('Comment does not belong to this post');
    if (comment.authorId !== userId) throw new ForbiddenException('You can only delete your own comments');

    await this.prisma.comment.delete({ where: { id: commentId } });
    return { message: 'Comment deleted successfully' };
  }

  private combineDateAndTime(dateStr: string, timeStr?: string): Date {
    if (timeStr) {
      return new Date(`${dateStr}T${timeStr}:00`);
    }
    return new Date(`${dateStr}T00:00:00`);
  }

  private extractHashtags(text: string): string[] {
    const hashtagRegex = /#([a-zA-Z0-9_-]+)/g;
    const matches: string[] = [];
    let match;
    while ((match = hashtagRegex.exec(text)) !== null) {
      const tag = match[1].toLowerCase().trim();
      if (tag && !matches.includes(tag)) {
        matches.push(tag);
      }
    }
    return matches;
  }

  private extractMentions(text: string): string[] {
    const mentionRegex = /@([a-zA-Z0-9_-]+)/g;
    const matches: string[] = [];
    let match;
    while ((match = mentionRegex.exec(text)) !== null) {
      const username = match[1].trim();
      if (username && !matches.includes(username)) {
        matches.push(username);
      }
    }
    return matches;
  }

  async repost(userId: string, postId: string) {
    const originalPost = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!originalPost) throw new NotFoundException('Original post not found');

    // Check if simple repost already exists for this user + originalPostId
    const existing = await this.prisma.post.findFirst({
      where: {
        authorId: userId,
        originalPostId: postId,
        content: '',
      },
    });

    if (existing) {
      // Toggle off: Delete the existing simple repost
      await this.prisma.post.delete({ where: { id: existing.id } });
      return { reposted: false, post: null };
    }

    // Create new simple repost
    const newRepost = await this.prisma.post.create({
      data: {
        authorId: userId,
        originalPostId: postId,
        content: '',
        status: 'PUBLISHED',
      },
      include: this.postInclude,
    });

    if (originalPost.authorId !== userId) {
      this.eventEmitter.emit(NOTIFICATION_EVENT, {
        recipientId: originalPost.authorId,
        type: 'REPOST',
        actorId: userId,
        postId,
        metadata: {},
      });
    }

    return { reposted: true, post: newRepost };
  }

  async quote(userId: string, postId: string, content: string) {
    const originalPost = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!originalPost) throw new NotFoundException('Original post not found');

    if (!content || !content.trim()) {
      throw new BadRequestException('Quote post commentary cannot be empty');
    }

    // Create quote post
    return this.prisma.post.create({
      data: {
        authorId: userId,
        originalPostId: postId,
        content: content.trim(),
        status: 'PUBLISHED',
      },
      include: this.postInclude,
    });
  }

  async toggleBookmark(userId: string, postId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    const existingBookmark = await this.prisma.bookmark.findUnique({
      where: {
        userId_postId: { userId, postId },
      },
    });

    if (existingBookmark) {
      await this.prisma.bookmark.delete({
        where: { id: existingBookmark.id },
      });
      return { bookmarked: false };
    }

    await this.prisma.bookmark.create({
      data: { userId, postId },
    });
    return { bookmarked: true };
  }

  async findBookmarked(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = {
      status: 'PUBLISHED' as const,
      bookmarks: {
        some: {
          userId,
        },
      },
    };

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

  async findDistinctCourseCodes() {
    const cached = await this.redis.get<string[]>('posts', 'course-codes');
    if (cached) return cached;

    const posts = await this.prisma.post.findMany({
      where: {
        status: 'PUBLISHED',
        AND: [
          { courseCode: { not: null } },
          { courseCode: { not: '' } },
        ],
      },
      select: {
        courseCode: true,
      },
      distinct: ['courseCode'],
    });
    const codes = posts.map((p) => p.courseCode).filter(Boolean) as string[];

    await this.redis.set(['posts', 'course-codes'], codes, 900);
    return codes;
  }
}
