import { Type, Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  MaxLength,
  IsOptional,
  IsDate,
  IsInt,
  IsEnum,
  IsNumber,
  Min,
  MinLength,
} from 'class-validator';
import { $Enums } from '../../../generated/prisma';

export class UpdateEventDto {
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @MaxLength(128)
  title?: string;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsEnum($Enums.EventCategory)
  category?: $Enums.EventCategory;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  start_date?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  end_date?: Date;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  location?: string;

  @IsOptional()
  @IsInt()
  @Min(1, { message: 'Capacity must be at least 1' })
  capacity?: number;

  @IsOptional()
  @IsEnum($Enums.EventStatus)
  status?: $Enums.EventStatus;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === null || value === undefined || value === '') return undefined;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const num = parseFloat(value);
      return isNaN(num) ? value : num;
    }
    return value;
  })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    {
      message:
        'Ticket price must be a valid number with up to 2 decimal places',
    },
  )
  @Min(0, { message: 'Ticket price must be greater than or equal to 0' })
  ticket_price?: number;
}
