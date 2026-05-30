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
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('authorId') authorId?: string,
    @Query('votedBy') votedBy?: string,
    @Query('followingOf') followingOf?: string,
  ) {
    return this.postsService.findAllPublished(
      Number(page) || 1,
      Number(limit) || 20,
      authorId,
      votedBy,
      followingOf,
    );
  }

  @Get('drafts')
  @ApiOperation({ summary: 'List current user\'s drafts' })
  async findDrafts(@Req() req: Request) {
    const userId = (req as any).user.id;
    return this.postsService.findDrafts(userId);
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
}
