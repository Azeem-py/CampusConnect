import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VoteDto } from '@campus-connect/types';

@Injectable()
export class SocialService {
  constructor(private prisma: PrismaService) {}

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

      // 3. Upsert the vote
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
