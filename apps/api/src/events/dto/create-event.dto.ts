import { Type, Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  MaxLength,
  IsOptional,
  IsDate,
  IsInt,
  IsEnum,
  MinLength,
  IsNumber,
  Min,
} from 'class-validator';
import { $Enums } from 'generated/prisma';

export class CreateEventDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(128)
  title: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  description: string;

  @IsEnum($Enums.EventCategory)
  @IsOptional()
  category?: $Enums.EventCategory;

  @Type(() => Date)
  @IsDate()
  start_date: Date;

  @Type(() => Date)
  @IsDate()
  end_date: Date;

  @IsNotEmpty()
  @IsString()
  location: string;

  @IsInt()
  capacity: number;

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
  ticket_price: number;
}
