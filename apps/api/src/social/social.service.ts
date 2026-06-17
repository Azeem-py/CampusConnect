import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { VoteDto } from '@campus-connect/types';
import { NOTIFICATION_EVENT } from '../notifications/notification-listener.service';

@Injectable()
export class SocialService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * Casts or updates a vote on a post or comment.
   */
  async vote(userId: string, voteDto: VoteDto) {
    const { postId, commentId, value } = voteDto;

    if (!postId && !commentId) {
      throw new BadRequestException('Must provide either postId or commentId.');
    }

    // Logic: Update author's reputation (+5 for upvote, -2 for downvote)
    // We use a transaction to ensure atomic updates
    return this.prisma.$transaction(async (tx) => {
      // 1. Identify Target (Post or Comment) to find the author
      const target = postId
        ? await tx.post.findUnique({ where: { id: postId }, select: { authorId: true } })
        : await tx.comment.findUnique({ where: { id: commentId }, select: { authorId: true } });

      if (!target) {
        throw new NotFoundException('Vote target not found.');
      }

      // 2. Check for existing vote to calculate reputation differential
      const existingVote = await tx.vote.findFirst({
        where: { userId, postId, commentId }
      });

      const repDiff = this.calculateReputationDifferential(existingVote?.value ?? 0, value);

      // 3. Handle Retraction (value is 0) or Upsert
      if (value === 0) {
        if (existingVote) {
          await tx.vote.delete({
            where: { id: existingVote.id }
          });
        }

        // 4. Update Author's Reputation
        await tx.user.update({
          where: { id: target.authorId },
          data: { reputationScore: { increment: repDiff } }
        });

        return { id: existingVote?.id, value: 0 };
      }

      // Upsert the vote (value is 1 or -1)
      const voteResult = await tx.vote.upsert({
        where: {
          userId_postId: postId ? { userId, postId } : undefined,
          userId_commentId: commentId ? { userId, commentId } : undefined,
        },
        create: { userId, postId, commentId, value },
        update: { value }
      });

      // 4. Update Author's Reputation
      await tx.user.update({
        where: { id: target.authorId },
        data: { reputationScore: { increment: repDiff } }
      });

      // Send notification only on upvote
      if (value === 1 && target.authorId !== userId) {
        const type = postId ? 'LIKE' : 'LIKE_COMMENT';
        await this.eventEmitter.emitAsync(NOTIFICATION_EVENT, {
          recipientId: target.authorId,
          type,
          actorId: userId,
          postId: postId ?? undefined,
          commentId: commentId ?? undefined,
          metadata: {},
        });
      }

      return voteResult;
    });
  }

  /**
   * Calculates the reputation points to add/subtract based on old vs new vote.
   * +5 for UP, -2 for DOWN.
   */
  private calculateReputationDifferential(oldValue: number, newValue: number): number {
    const scoreMap = new Map<number, number>([
      [1, 5],
      [-1, -2],
      [0, 0]
    ]);

    // Points from new vote minus points from old vote
    return (scoreMap.get(newValue) ?? 0) - (scoreMap.get(oldValue) ?? 0);
  }
}
