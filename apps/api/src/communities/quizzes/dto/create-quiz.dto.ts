import { IsString, IsOptional, IsInt, IsEnum, IsBoolean, Min, Max, IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QuestionType, ShowResult } from '@prisma/client';

class CreateOptionDto {
  @ApiProperty({ example: 'Paris' })
  @IsString()
  text!: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  isCorrect!: boolean;

  @ApiProperty({ example: 1 })
  @IsInt()
  order!: number;
}

class CreateQuestionDto {
  @ApiProperty({ example: 'What is the capital of France?' })
  @IsString()
  text!: string;

  @ApiProperty({ enum: QuestionType, example: 'MCQ' })
  @IsEnum(QuestionType)
  type!: QuestionType;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  @Max(100)
  points!: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  order!: number;

  @ApiProperty({ type: [CreateOptionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOptionDto)
  @ArrayMinSize(1)
  options!: CreateOptionDto[];
}

export class CreateQuizDto {
  @ApiProperty({ example: 'Math 201 - Chapter 3 Quiz' })
  @IsString()
  title!: string;

  @ApiPropertyOptional({ example: 'Covers derivatives and integrals' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 15 })
  @IsInt()
  @Min(1)
  @Max(180)
  timeLimit!: number;

  @ApiProperty({ example: 1, description: '1 = once, 0 = unlimited' })
  @IsInt()
  @Min(0)
  @Max(10)
  maxAttempts!: number;

  @ApiProperty({ enum: ShowResult, example: 'MANUAL' })
  @IsEnum(ShowResult)
  showResult!: ShowResult;

  @ApiProperty({ type: [CreateQuestionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  @ArrayMinSize(1)
  questions!: CreateQuestionDto[];
}
