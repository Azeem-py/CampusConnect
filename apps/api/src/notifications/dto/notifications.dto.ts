import { IsString, IsOptional, IsBoolean, IsNumber, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNotificationDto {
  recipientId!: string;
  type!: NotificationTypeApi;
  actorId?: string;
  postId?: string;
  commentId?: string;
  metadata?: Record<string, unknown>;
}

export type NotificationTypeApi =
  | 'MENTION'
  | 'LIKE'
  | 'LIKE_COMMENT'
  | 'COMMENT'
  | 'REPLY'
  | 'REPOST'
  | 'FOLLOW'
  | 'SYSTEM';

export class NotificationFilterDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ enum: ['MENTION', 'LIKE', 'LIKE_COMMENT', 'COMMENT', 'REPLY', 'REPOST', 'FOLLOW', 'SYSTEM'] })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  unread?: boolean;
}

export class UpdatePreferencesDto {
  @ApiProperty({ example: 'LIKE' })
  @IsString()
  @IsEnum(['MENTION', 'LIKE', 'LIKE_COMMENT', 'COMMENT', 'REPLY', 'REPOST', 'FOLLOW', 'SYSTEM'])
  type!: NotificationTypeApi;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  inApp?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  push?: boolean;
}

export class BulkUpdatePreferencesDto {
  @ApiProperty({ type: [UpdatePreferencesDto] })
  preferences!: UpdatePreferencesDto[];
}

export class SubscribePushDto {
  @ApiProperty()
  @IsString()
  endpoint!: string;

  @ApiProperty()
  @IsString()
  p256dh!: string;

  @ApiProperty()
  @IsString()
  auth!: string;
}

export interface NotificationResponse {
  id: string;
  type: NotificationTypeApi;
  actorId: string | null;
  actor: { id: string; name: string | null; username: string; avatar: string | null } | null;
  postId: string | null;
  commentId: string | null;
  metadata: Record<string, unknown> | null;
  unread: boolean;
  createdAt: string;
}
