import { IsOptional, IsString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { UserRole } from '../../../generated/prisma';

export class QueryUsersDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(UserRole)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const upperValue = value.toUpperCase();
      if (Object.values(UserRole).includes(upperValue as UserRole)) {
        return upperValue as UserRole;
      }
    }
    return value;
  })
  role?: UserRole;

  @IsOptional()
  @IsEnum(['created_asc', 'created_desc'])
  sort_by?: 'created_asc' | 'created_desc';

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? undefined : parsed;
  })
  limit?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? undefined : parsed;
  })
  page?: number;
}
