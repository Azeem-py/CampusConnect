import {
  Controller,
  Get,
  Post,
  Patch,
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
import { AdminGuard } from '../auth/admin.guard';
import { ModerationService } from './moderation.service';
import { CreateReportDto, ResolveReportDto } from './dto';
import { ReportReason, ReportStatus } from '@campus-connect/db';

@ApiTags('Moderation')
@Controller('api/v1/moderation')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @Post('reports')
  @ApiOperation({ summary: 'Submit a report against a post, comment, or user profile' })
  async createReport(@Body() dto: CreateReportDto, @Req() req: Request) {
    const userId = (req as any).user.id;
    return this.moderationService.createReport(userId, dto);
  }

  @Get('reports')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'List all content moderation reports (Admin Only)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'status', required: false, enum: ReportStatus })
  @ApiQuery({ name: 'reason', required: false, enum: ReportReason })
  async getReports(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: ReportStatus,
    @Query('reason') reason?: ReportReason,
  ) {
    return this.moderationService.getReports(
      status,
      reason,
      Number(page) || 1,
      Number(limit) || 20,
    );
  }

  @Get('metrics')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get summary statistics of the moderation queue (Admin Only)' })
  async getMetrics() {
    return this.moderationService.getReportMetrics();
  }

  @Patch('reports/:id')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Process / resolve a moderation report (Admin Only)' })
  async resolveReport(
    @Param('id') reportId: string,
    @Body() dto: ResolveReportDto,
    @Req() req: Request,
  ) {
    const resolverId = (req as any).user.id;
    return this.moderationService.resolveReport(resolverId, reportId, dto);
  }
}
