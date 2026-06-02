import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ReportReason } from '@campus-connect/db';

export class CreateReportDto {
  @IsEnum(ReportReason)
  reason!: ReportReason;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  postId?: string;

  @IsString()
  @IsOptional()
  commentId?: string;

  @IsString()
  @IsOptional()
  reportedUserId?: string;
}
