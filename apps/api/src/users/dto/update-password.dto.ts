import { IsString, MinLength } from 'class-validator';

export class UpdatePasswordDto {
  @IsString()
  @MinLength(6, { message: 'Current password is required' })
  current_password: string;

  @IsString()
  @MinLength(6, { message: 'New password must be at least 6 characters long' })
  new_password: string;
}
