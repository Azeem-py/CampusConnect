import { IsString, IsOptional, IsBoolean, MinLength, IsEmail, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  UpdatePasswordDto as IUpdatePasswordDto,
  UpdateEmailDto as IUpdateEmailDto,
  UpdatePreferencesDto as IUpdatePreferencesDto,
} from '@campus-connect/types';

export class UpdatePasswordDto implements IUpdatePasswordDto {
  @ApiProperty({ example: 'secureP@ss123', description: 'Current password' })
  @IsString()
  @MinLength(6)
  currentPassword!: string;

  @ApiProperty({ example: 'newSecureP@ss123', description: 'New password' })
  @IsString()
  @MinLength(6)
  newPassword!: string;
}

export class UpdateEmailDto implements IUpdateEmailDto {
  @ApiProperty({ example: 'alex.rivera@mit.edu', description: 'New email address' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'secureP@ss123', description: 'Current password' })
  @IsString()
  @MinLength(6)
  currentPassword!: string;
}

export class UpdatePreferencesDto implements IUpdatePreferencesDto {
  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  pushNotifications?: boolean;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  weeklyDigest?: boolean;

  @ApiProperty({ example: 'PUBLIC', required: false, enum: ['PUBLIC', 'CAMPUS_ONLY', 'PRIVATE'] })
  @IsOptional()
  @IsEnum(['PUBLIC', 'CAMPUS_ONLY', 'PRIVATE'])
  profilePrivacy?: 'PUBLIC' | 'CAMPUS_ONLY' | 'PRIVATE';

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  showReputation?: boolean;
}
