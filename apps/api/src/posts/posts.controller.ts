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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PostsService } from './posts.service';
import { RecommendationService } from '../recommendations/recommendation.service';
import { CreatePostDto, UpdatePostDto, CreateCommentDto } from './dto';

@ApiTags('Posts')
@Controller('api/v1/posts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly recommendationService: RecommendationService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new post (draft or published, with optional event/poll)' })
  async create(@Body() dto: CreatePostDto, @Req() req: Request) {
    const userId = (req as any).user.id;
    return this.postsService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List published posts (paginated, optionally by author, voted-by user, or followed users)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'authorId', required: false, example: 'clxyzabc123def456' })
  @ApiQuery({ name: 'votedBy', required: false, example: 'clxyzabc123def456' })
  @ApiQuery({ name: 'followingOf', required: false, example: 'clxyzabc123def456' })
  @ApiQuery({ name: 'search', required: false, example: '#STA201' })
  @ApiQuery({ name: 'sort', required: false, enum: ['latest', 'top'], description: 'Sort order: latest (by date) or top (by engagement score)' })
  @ApiQuery({ name: 'period', required: false, enum: ['all', 'week', 'month'], description: 'Time period filter: all time, past week, or past month' })
  @ApiQuery({ name: 'communityId', required: false, example: 'cm1abcd1234', description: 'Filter posts by community' })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('authorId') authorId?: string,
    @Query('votedBy') votedBy?: string,
    @Query('followingOf') followingOf?: string,
    @Query('search') search?: string,
    @Query('sort') sort?: string,
    @Query('period') period?: string,
    @Query('communityId') communityId?: string,
  ) {
    const validSorts = ['latest', 'top'] as const;
    const validPeriods = ['all', 'week', 'month'] as const;

    const resolvedSort = validSorts.includes(sort as any) ? (sort as 'latest' | 'top') : 'latest';
    const resolvedPeriod = validPeriods.includes(period as any) ? (period as 'all' | 'week' | 'month') : 'all';

    return this.postsService.findAllPublished(
      Number(page) || 1,
      Number(limit) || 20,
      authorId,
      votedBy,
      followingOf,
      search,
      resolvedSort,
      resolvedPeriod,
      communityId,
    );
  }

  @Get('drafts')
  @ApiOperation({ summary: 'List current user\'s drafts' })
  async findDrafts(@Req() req: Request) {
    const userId = (req as any).user.id;
    return this.postsService.findDrafts(userId);
  }

  @Get('bookmarked')
  @ApiOperation({ summary: 'List current user\'s bookmarked posts' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  async getBookmarked(
    @Req() req: Request,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = (req as any).user.id;
    return this.postsService.findBookmarked(userId, Number(page) || 1, Number(limit) || 20);
  }

  @Get('recommended')
  @ApiOperation({ summary: 'Get personalised recommended posts for the authenticated user' })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  async getRecommended(@Req() req: Request, @Query('limit') limit?: string) {
    const userId = (req as any).user.id;
    const postIds = await this.recommendationService.recommend(userId, Number(limit) || 20);
    if (postIds.length === 0) return { posts: [], total: 0 };
    // Fetch full post documents in one query, preserving ranked order
    const posts = await this.postsService.findManyByIds(postIds);
    const ordered = postIds
      .map((id) => posts.find((p) => p.id === id))
      .filter(Boolean);
    return { posts: ordered, total: ordered.length };
  }

  @Get('course-codes')
  @ApiOperation({ summary: 'Get all distinct course codes used across published posts' })
  async findDistinctCourseCodes() {
    return this.postsService.findDistinctCourseCodes();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single post by ID' })
  async findOne(@Param('id') id: string) {
    return this.postsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a post (content, status, event, poll)' })
  async update(@Param('id') id: string, @Body() dto: UpdatePostDto, @Req() req: Request) {
    const userId = (req as any).user.id;
    return this.postsService.update(id, userId, dto);
  }

  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publish a draft post' })
  async publish(@Param('id') id: string, @Req() req: Request) {
    const userId = (req as any).user.id;
    return this.postsService.publish(id, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a post (owner only)' })
  async delete(@Param('id') id: string, @Req() req: Request) {
    const userId = (req as any).user.id;
    return this.postsService.delete(id, userId);
  }

  @Post(':id/comments')
  @ApiOperation({ summary: 'Add a comment to a post' })
  async addComment(
    @Param('id') id: string,
    @Body() dto: CreateCommentDto,
    @Req() req: Request,
  ) {
    const userId = (req as any).user.id;
    return this.postsService.addComment(id, userId, dto);
  }

  @Delete(':id/comments/:commentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a comment (owner only)' })
  async deleteComment(
    @Param('id') id: string,
    @Param('commentId') commentId: string,
    @Req() req: Request,
  ) {
    const userId = (req as any).user.id;
    return this.postsService.deleteComment(id, commentId, userId);
  }

  @Post(':id/repost')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Repost a post or undo an existing repost (toggle)' })
  async repost(@Param('id') id: string, @Req() req: Request) {
    const userId = (req as any).user.id;
    return this.postsService.repost(userId, id);
  }

  @Post(':id/quote')
  @ApiOperation({ summary: 'Create a quote post with commentary' })
  async quote(
    @Param('id') id: string,
    @Body('content') content: string,
    @Req() req: Request,
  ) {
    const userId = (req as any).user.id;
    return this.postsService.quote(userId, id, content);
  }

  @Post(':id/bookmark')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle bookmark status of a post' })
  async toggleBookmark(@Param('id') id: string, @Req() req: Request) {
    const userId = (req as any).user.id;
    return this.postsService.toggleBookmark(userId, id);
  }
}
