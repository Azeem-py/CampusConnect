import { IsArray, ValidateNested, IsString, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class AnswerDto {
  @ApiProperty({ example: 'questionId' })
  @IsString()
  questionId!: string;

  @ApiProperty({ example: 'optionId' })
  @IsString()
  selectedOptionId!: string;
}

export class SubmitAttemptDto {
  @ApiProperty({ type: [AnswerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  @ArrayMinSize(1)
  answers!: AnswerDto[];
}
