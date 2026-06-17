import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateQuizDto, UpdateQuizDto, SubmitAttemptDto } from './dto';
import {
  QuizStatus,
  AttemptStatus,
  ShowResult,
  CommunityMemberRole,
  GroupMemberRole,
} from '@prisma/client';

const QUIZ_WITH_COUNT = {
  _count: { select: { questions: true, attempts: true } },
} as const;

const QUIZ_WITH_QUESTIONS_OPTIONS = {
  questions: {
    orderBy: { order: 'asc' as const },
    include: {
      options: {
        orderBy: { order: 'asc' as const },
        select: { id: true, text: true, order: true, isCorrect: true },
      },
    },
  },
} as const;

const QUIZ_WITH_QUESTIONS_OPTIONS_HIDDEN = {
  questions: {
    orderBy: { order: 'asc' as const },
    include: {
      options: {
        orderBy: { order: 'asc' as const },
        select: { id: true, text: true, order: true },
      },
    },
  },
} as const;

const ATTEMPT_WITH_ANSWERS = {
  answers: {
    include: {
      question: { select: { id: true, text: true, type: true, points: true, order: true } },
      selectedOption: { select: { id: true, text: true, order: true, isCorrect: true } },
    },
    orderBy: { id: 'asc' as const },
  },
} as const;

const hierarchy: Record<CommunityMemberRole, number> = {
  OWNER: 4, ADMIN: 3, MODERATOR: 2, MEMBER: 1,
};

const groupHierarchy: Record<GroupMemberRole, number> = {
  MODERATOR: 2, MEMBER: 1,
};

@Injectable()
export class QuizzesService {
  constructor(private prisma: PrismaService) {}

  private async requireCommunityRole(communityId: string, userId: string, minRole: CommunityMemberRole) {
    const member = await this.prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId, userId } },
      select: { role: true },
    });
    if (!member) throw new ForbiddenException('You are not a community member');
    if (hierarchy[member.role] < hierarchy[minRole]) {
      throw new ForbiddenException(`Access denied. Required role: ${minRole} or higher`);
    }
  }

  private async requireGroupMod(communityId: string, groupId: string, userId: string) {
    const group = await this.prisma.communityGroup.findUnique({
      where: { id: groupId },
      select: { communityId: true },
    });
    if (!group || group.communityId !== communityId) throw new NotFoundException('Group not found');

    const member = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
      select: { role: true },
    });
    if (!member) throw new ForbiddenException('You are not a group member');
    if (groupHierarchy[member.role] < groupHierarchy.MODERATOR) {
      throw new ForbiddenException('Only group moderators can perform this action');
    }
  }

  private async requireGroupMember(communityId: string, groupId: string, userId: string) {
    const group = await this.prisma.communityGroup.findUnique({
      where: { id: groupId },
      select: { communityId: true },
    });
    if (!group || group.communityId !== communityId) throw new NotFoundException('Group not found');

    const member = await this.prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } },
      select: { role: true },
    });
    if (!member) throw new ForbiddenException('You must be a group member to access quizzes');
  }

  async create(communityId: string, groupId: string, userId: string, dto: CreateQuizDto) {
    await this.requireGroupMod(communityId, groupId, userId);

    const quiz = await this.prisma.quiz.create({
      data: {
        title: dto.title,
        description: dto.description ?? null,
        timeLimit: dto.timeLimit,
        maxAttempts: dto.maxAttempts,
        showResult: dto.showResult,
        groupId,
        creatorId: userId,
        questions: {
          create: dto.questions.map((q) => ({
            text: q.text,
            type: q.type,
            points: q.points,
            order: q.order,
            options: {
              create: q.options.map((o) => ({
                text: o.text,
                isCorrect: o.isCorrect,
                order: o.order,
              })),
            },
          })),
        },
      },
      include: {
        ...QUIZ_WITH_QUESTIONS_OPTIONS,
        ...QUIZ_WITH_COUNT,
      },
    });

    return quiz;
  }

  async findAll(communityId: string, groupId: string, userId: string) {
    await this.requireGroupMember(communityId, groupId, userId);

    const quizzes = await this.prisma.quiz.findMany({
      where: { groupId },
      orderBy: { createdAt: 'desc' },
      include: {
        creator: { select: { id: true, name: true, username: true, avatar: true } },
        _count: { select: { questions: true, attempts: true } },
      },
    });

    return quizzes;
  }

  async findOne(communityId: string, groupId: string, quizId: string, userId: string) {
    await this.requireGroupMember(communityId, groupId, userId);

    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        creator: { select: { id: true, name: true, username: true, avatar: true } },
        ...QUIZ_WITH_COUNT,
      },
    });

    if (!quiz || quiz.groupId !== groupId) throw new NotFoundException('Quiz not found');

    const isCreator = quiz.creatorId === userId;

    return { ...quiz, isCreator };
  }

  async findOneWithQuestions(communityId: string, groupId: string, quizId: string, userId: string) {
    await this.requireGroupMember(communityId, groupId, userId);

    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        creator: { select: { id: true, name: true, username: true, avatar: true } },
        ...QUIZ_WITH_QUESTIONS_OPTIONS,
        ...QUIZ_WITH_COUNT,
      },
    });

    if (!quiz || quiz.groupId !== groupId) throw new NotFoundException('Quiz not found');

    const isCreator = quiz.creatorId === userId;
    return { ...quiz, isCreator };
  }

  async update(communityId: string, groupId: string, quizId: string, userId: string, dto: UpdateQuizDto) {
    await this.requireGroupMod(communityId, groupId, userId);

    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      select: { groupId: true, status: true },
    });
    if (!quiz || quiz.groupId !== groupId) throw new NotFoundException('Quiz not found');
    if (quiz.status !== QuizStatus.DRAFT) throw new BadRequestException('Only draft quizzes can be edited');

    const data: Record<string, unknown> = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.timeLimit !== undefined) data.timeLimit = dto.timeLimit;
    if (dto.maxAttempts !== undefined) data.maxAttempts = dto.maxAttempts;
    if (dto.showResult !== undefined) data.showResult = dto.showResult;

    const updated = await this.prisma.quiz.update({
      where: { id: quizId },
      data,
      include: {
        ...QUIZ_WITH_QUESTIONS_OPTIONS,
        ...QUIZ_WITH_COUNT,
      },
    });

    return updated;
  }

  async delete(communityId: string, groupId: string, quizId: string, userId: string) {
    await this.requireGroupMod(communityId, groupId, userId);

    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      select: { groupId: true },
    });
    if (!quiz || quiz.groupId !== groupId) throw new NotFoundException('Quiz not found');

    await this.prisma.quiz.delete({ where: { id: quizId } });
    return { message: 'Quiz deleted successfully' };
  }

  async publish(communityId: string, groupId: string, quizId: string, userId: string) {
    await this.requireGroupMod(communityId, groupId, userId);

    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      select: { groupId: true, status: true },
    });
    if (!quiz || quiz.groupId !== groupId) throw new NotFoundException('Quiz not found');
    if (quiz.status !== QuizStatus.DRAFT) throw new BadRequestException('Quiz is already published or closed');

    const updated = await this.prisma.quiz.update({
      where: { id: quizId },
      data: { status: QuizStatus.PUBLISHED },
      include: { ...QUIZ_WITH_COUNT },
    });

    return updated;
  }

  async close(communityId: string, groupId: string, quizId: string, userId: string) {
    await this.requireCommunityRole(communityId, userId, 'MODERATOR');

    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      select: { groupId: true },
    });
    if (!quiz || quiz.groupId !== groupId) throw new NotFoundException('Quiz not found');

    const updated = await this.prisma.quiz.update({
      where: { id: quizId },
      data: { status: QuizStatus.CLOSED },
      include: { ...QUIZ_WITH_COUNT },
    });

    return updated;
  }

  async publishResults(communityId: string, groupId: string, quizId: string, userId: string) {
    await this.requireGroupMod(communityId, groupId, userId);

    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      select: { groupId: true, showResult: true, resultsPublished: true },
    });
    if (!quiz || quiz.groupId !== groupId) throw new NotFoundException('Quiz not found');
    if (quiz.resultsPublished) throw new BadRequestException('Results already published');

    const updated = await this.prisma.quiz.update({
      where: { id: quizId },
      data: { resultsPublished: true },
      include: { ...QUIZ_WITH_COUNT },
    });

    return updated;
  }

  async startAttempt(communityId: string, groupId: string, quizId: string, userId: string) {
    await this.requireGroupMember(communityId, groupId, userId);

    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      select: {
        groupId: true, status: true, maxAttempts: true, timeLimit: true,
        _count: { select: { questions: true } },
      },
    });
    if (!quiz || quiz.groupId !== groupId) throw new NotFoundException('Quiz not found');
    if (quiz.status !== QuizStatus.PUBLISHED) throw new BadRequestException('Quiz is not published');
    if (quiz._count.questions === 0) throw new BadRequestException('Quiz has no questions');

    if (quiz.maxAttempts > 0) {
      const completedAttempts = await this.prisma.quizAttempt.count({
        where: { quizId, userId, status: { in: [AttemptStatus.SUBMITTED, AttemptStatus.AUTO_SUBMITTED] } },
      });
      if (completedAttempts >= quiz.maxAttempts) {
        throw new ConflictException('Maximum attempts reached');
      }
    }

    const existing = await this.prisma.quizAttempt.findFirst({
      where: { quizId, userId, status: AttemptStatus.IN_PROGRESS },
    });
    if (existing) {
      const remaining = this.computeRemainingSeconds(quiz.timeLimit, existing.startedAt);
      if (remaining > 0) {
        const questions = await this.prisma.question.findMany({
          where: { quizId },
          orderBy: { order: 'asc' },
          include: {
            options: {
              orderBy: { order: 'asc' },
              select: { id: true, text: true, order: true },
            },
          },
        });

        return {
          attempt: existing,
          questions,
          remainingSeconds: remaining,
          totalPoints: questions.reduce((s, q) => s + q.points, 0),
        };
      }

      await this.prisma.quizAttempt.update({
        where: { id: existing.id },
        data: { status: AttemptStatus.AUTO_SUBMITTED, submittedAt: new Date() },
      });
    }

    const attempt = await this.prisma.quizAttempt.create({
      data: { quizId, userId },
    });

    const questions = await this.prisma.question.findMany({
      where: { quizId },
      orderBy: { order: 'asc' },
      include: {
        options: {
          orderBy: { order: 'asc' },
          select: { id: true, text: true, order: true },
        },
      },
    });

    const totalPoints = questions.reduce((s, q) => s + q.points, 0);

    return {
      attempt,
      questions,
      remainingSeconds: quiz.timeLimit * 60,
      totalPoints,
    };
  }

  async submitAttempt(
    communityId: string,
    groupId: string,
    quizId: string,
    attemptId: string,
    userId: string,
    dto: SubmitAttemptDto,
  ) {
    await this.requireGroupMember(communityId, groupId, userId);

    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      select: { userId: true, status: true, startedAt: true, quizId: true },
    });
    if (!attempt || attempt.quizId !== quizId) throw new NotFoundException('Attempt not found');
    if (attempt.userId !== userId) throw new ForbiddenException('This is not your attempt');
    if (attempt.status !== AttemptStatus.IN_PROGRESS) throw new BadRequestException('Attempt already submitted');

    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      select: { timeLimit: true, groupId: true },
    });
    if (!quiz || quiz.groupId !== groupId) throw new NotFoundException('Quiz not found');

    const remaining = this.computeRemainingSeconds(quiz.timeLimit, attempt.startedAt);
    const isAuto = remaining <= 0;

    const allQuestions = await this.prisma.question.findMany({
      where: { quizId },
      select: { id: true, points: true },
    });
    const questionIds = new Set(allQuestions.map((q) => q.id));
    const totalPoints = allQuestions.reduce((s, q) => s + q.points, 0);

    for (const ans of dto.answers) {
      if (!questionIds.has(ans.questionId)) {
        throw new BadRequestException(`Question ${ans.questionId} is not part of this quiz`);
      }
    }

    const correctOptions = await this.prisma.questionOption.findMany({
      where: {
        questionId: { in: [...questionIds] },
        isCorrect: true,
      },
      select: { id: true, questionId: true },
    });
    const correctMap = new Map<string, string>();
    for (const opt of correctOptions) {
      correctMap.set(opt.questionId, opt.id);
    }

    let score = 0;
    const answerData = dto.answers.map((a) => {
      const isCorrect = correctMap.get(a.questionId) === a.selectedOptionId;
      const qPoints = allQuestions.find((q) => q.id === a.questionId)?.points ?? 0;
      const earned = isCorrect ? qPoints : 0;
      score += earned;
      return {
        questionId: a.questionId,
        selectedOptionId: a.selectedOptionId,
        isCorrect,
        pointsEarned: earned,
      };
    });

    const [updated] = await this.prisma.$transaction([
      this.prisma.quizAttempt.update({
        where: { id: attemptId },
        data: {
          status: isAuto ? AttemptStatus.AUTO_SUBMITTED : AttemptStatus.SUBMITTED,
          submittedAt: new Date(),
          score,
          totalPoints,
        },
      }),
      this.prisma.quizAnswer.createMany({
        data: answerData.map((a) => ({ ...a, attemptId })),
      }),
    ]);

    const result = await this.prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: ATTEMPT_WITH_ANSWERS,
    });

    return result;
  }

  async getMyAttempts(communityId: string, groupId: string, quizId: string, userId: string) {
    await this.requireGroupMember(communityId, groupId, userId);

    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      select: { groupId: true },
    });
    if (!quiz || quiz.groupId !== groupId) throw new NotFoundException('Quiz not found');

    const attempts = await this.prisma.quizAttempt.findMany({
      where: { quizId, userId },
      orderBy: { startedAt: 'desc' },
      include: { _count: { select: { answers: true } } },
    });

    return attempts;
  }

  async getAllAttempts(communityId: string, groupId: string, quizId: string, userId: string) {
    await this.requireGroupMod(communityId, groupId, userId);

    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      select: { groupId: true, creatorId: true },
    });
    if (!quiz || quiz.groupId !== groupId) throw new NotFoundException('Quiz not found');

    const attempts = await this.prisma.quizAttempt.findMany({
      where: { quizId },
      orderBy: { startedAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, username: true, avatar: true } },
        _count: { select: { answers: true } },
      },
    });

    return attempts;
  }

  async getAttemptResult(
    communityId: string,
    groupId: string,
    quizId: string,
    attemptId: string,
    userId: string,
  ) {
    await this.requireGroupMember(communityId, groupId, userId);

    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      select: {
        groupId: true,
        creatorId: true,
        showResult: true,
        resultsPublished: true,
      },
    });
    if (!quiz || quiz.groupId !== groupId) throw new NotFoundException('Quiz not found');

    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: ATTEMPT_WITH_ANSWERS,
    });
    if (!attempt || attempt.quizId !== quizId) throw new NotFoundException('Attempt not found');

    const isCreator = quiz.creatorId === userId;
    const isOwner = attempt.userId === userId;

    if (!isOwner && !isCreator) {
      throw new ForbiddenException('You cannot view this attempt');
    }

    const canSeeResult = quiz.resultsPublished || quiz.showResult === ShowResult.IMMEDIATE || isCreator;

    if (!canSeeResult && isOwner) {
      return {
        attempt: { ...attempt, answers: [] },
        visible: false,
        message: 'Results have not been published yet',
      };
    }

    return {
      attempt,
      visible: true,
      quizTitle: quiz.showResult,
    };
  }

  private computeRemainingSeconds(timeLimit: number, startedAt: Date): number {
    const elapsed = Math.floor((Date.now() - startedAt.getTime()) / 1000);
    return Math.max(0, timeLimit * 60 - elapsed);
  }
}
