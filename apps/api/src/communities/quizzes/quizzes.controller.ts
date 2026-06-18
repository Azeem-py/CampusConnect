import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { QuizzesService } from './quizzes.service';
import { CreateQuizDto, UpdateQuizDto, SubmitAttemptDto } from './dto';

@ApiTags('Quizzes')
@Controller('api/v1/communities/:communityId/groups/:groupId/quizzes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a quiz (Group MOD+)' })
  async create(
    @Param('communityId') communityId: string,
    @Param('groupId') groupId: string,
    @Body() dto: CreateQuizDto,
    @Req() req: Request,
  ) {
    const userId = (req as any).user.id;
    return this.quizzesService.create(communityId, groupId, userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List quizzes in a group' })
  async findAll(
    @Param('communityId') communityId: string,
    @Param('groupId') groupId: string,
    @Req() req: Request,
  ) {
    const userId = (req as any).user.id;
    return this.quizzesService.findAll(communityId, groupId, userId);
  }

  @Get('with-questions')
  @ApiOperation({ summary: 'Get quiz with all questions and options (creator only)' })
  async findOneWithQuestions(
    @Param('communityId') communityId: string,
    @Param('groupId') groupId: string,
    @Param('quizId') quizId: string,
    @Req() req: Request,
  ) {
    const userId = (req as any).user.id;
    return this.quizzesService.findOneWithQuestions(communityId, groupId, quizId, userId);
  }

  @Get(':quizId')
  @ApiOperation({ summary: 'Get quiz details' })
  async findOne(
    @Param('communityId') communityId: string,
    @Param('groupId') groupId: string,
    @Param('quizId') quizId: string,
    @Req() req: Request,
  ) {
    const userId = (req as any).user.id;
    return this.quizzesService.findOne(communityId, groupId, quizId, userId);
  }

  @Patch(':quizId')
  @ApiOperation({ summary: 'Update quiz (DRAFT only, Group MOD+)' })
  async update(
    @Param('communityId') communityId: string,
    @Param('groupId') groupId: string,
    @Param('quizId') quizId: string,
    @Body() dto: UpdateQuizDto,
    @Req() req: Request,
  ) {
    const userId = (req as any).user.id;
    return this.quizzesService.update(communityId, groupId, quizId, userId, dto);
  }

  @Delete(':quizId')
  @ApiOperation({ summary: 'Delete quiz (Group MOD+)' })
  async delete(
    @Param('communityId') communityId: string,
    @Param('groupId') groupId: string,
    @Param('quizId') quizId: string,
    @Req() req: Request,
  ) {
    const userId = (req as any).user.id;
    return this.quizzesService.delete(communityId, groupId, quizId, userId);
  }

  @HttpCode(HttpStatus.OK)
  @Post(':quizId/publish')
  @ApiOperation({ summary: 'Publish quiz (DRAFT → PUBLISHED, Group MOD+)' })
  async publish(
    @Param('communityId') communityId: string,
    @Param('groupId') groupId: string,
    @Param('quizId') quizId: string,
    @Req() req: Request,
  ) {
    const userId = (req as any).user.id;
    return this.quizzesService.publish(communityId, groupId, quizId, userId);
  }

  @HttpCode(HttpStatus.OK)
  @Post(':quizId/close')
  @ApiOperation({ summary: 'Close quiz (PUBLISHED → CLOSED, Community MOD+)' })
  async close(
    @Param('communityId') communityId: string,
    @Param('groupId') groupId: string,
    @Param('quizId') quizId: string,
    @Req() req: Request,
  ) {
    const userId = (req as any).user.id;
    return this.quizzesService.close(communityId, groupId, quizId, userId);
  }

  @HttpCode(HttpStatus.OK)
  @Post(':quizId/publish-results')
  @ApiOperation({ summary: 'Publish results (Group MOD+)' })
  async publishResults(
    @Param('communityId') communityId: string,
    @Param('groupId') groupId: string,
    @Param('quizId') quizId: string,
    @Req() req: Request,
  ) {
    const userId = (req as any).user.id;
    return this.quizzesService.publishResults(communityId, groupId, quizId, userId);
  }

  @HttpCode(HttpStatus.OK)
  @Post(':quizId/start')
  @ApiOperation({ summary: 'Start a quiz attempt' })
  async startAttempt(
    @Param('communityId') communityId: string,
    @Param('groupId') groupId: string,
    @Param('quizId') quizId: string,
    @Req() req: Request,
  ) {
    const userId = (req as any).user.id;
    return this.quizzesService.startAttempt(communityId, groupId, quizId, userId);
  }

  @HttpCode(HttpStatus.OK)
  @Post(':quizId/attempts/:attemptId/submit')
  @ApiOperation({ summary: 'Submit a quiz attempt' })
  async submitAttempt(
    @Param('communityId') communityId: string,
    @Param('groupId') groupId: string,
    @Param('quizId') quizId: string,
    @Param('attemptId') attemptId: string,
    @Body() dto: SubmitAttemptDto,
    @Req() req: Request,
  ) {
    const userId = (req as any).user.id;
    return this.quizzesService.submitAttempt(communityId, groupId, quizId, attemptId, userId, dto);
  }

  @Get(':quizId/my-attempts')
  @ApiOperation({ summary: 'Get my attempts for a quiz' })
  async getMyAttempts(
    @Param('communityId') communityId: string,
    @Param('groupId') groupId: string,
    @Param('quizId') quizId: string,
    @Req() req: Request,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = (req as any).user.id;
    const p = page ? parseInt(page, 10) : 1;
    const l = limit ? parseInt(limit, 10) : 10;
    return this.quizzesService.getMyAttempts(communityId, groupId, quizId, userId, p, l);
  }

  @Get(':quizId/attempts')
  @ApiOperation({ summary: 'Get all attempts (creator only)' })
  async getAllAttempts(
    @Param('communityId') communityId: string,
    @Param('groupId') groupId: string,
    @Param('quizId') quizId: string,
    @Req() req: Request,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = (req as any).user.id;
    const p = page ? parseInt(page, 10) : 1;
    const l = limit ? parseInt(limit, 10) : 10;
    return this.quizzesService.getAllAttempts(communityId, groupId, quizId, userId, p, l);
  }

  @Get(':quizId/attempts/:attemptId')
  @ApiOperation({ summary: 'Get attempt result' })
  async getAttemptResult(
    @Param('communityId') communityId: string,
    @Param('groupId') groupId: string,
    @Param('quizId') quizId: string,
    @Param('attemptId') attemptId: string,
    @Req() req: Request,
  ) {
    const userId = (req as any).user.id;
    return this.quizzesService.getAttemptResult(communityId, groupId, quizId, attemptId, userId);
  }
}
