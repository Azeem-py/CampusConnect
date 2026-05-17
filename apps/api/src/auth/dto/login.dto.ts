import { IsEmail, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'alex@institution.edu',
    description: 'Registered email address',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    example: 'secureP@ss123',
    description: 'Account password',
  })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
