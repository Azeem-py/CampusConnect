import { IsEnum, IsOptional, IsString, IsBoolean } from 'class-validator';
import { ReportStatus } from '@campus-connect/db';

export class ResolveReportDto {
  @IsEnum(ReportStatus)
  status!: ReportStatus;

  @IsString()
  @IsOptional()
  resolutionNote?: string;

  @IsBoolean()
  @IsOptional()
  banUser?: boolean;

  @IsBoolean()
  @IsOptional()
  deleteContent?: boolean;
}
