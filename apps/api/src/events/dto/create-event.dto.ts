import { Type, Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  MaxLength,
  IsOptional,
  IsDate,
  IsInt,
  IsEnum,
  IsDecimal,
} from 'class-validator';
import { $Enums } from 'generated/prisma';

export class CreateEventDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(128)
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsEnum($Enums.EventCategory)
  @IsOptional()
  category?: $Enums.EventCategory;

  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @Type(() => Date)
  @IsDate()
  endDate: Date;

  @IsNotEmpty()
  @IsString()
  location: string;

  @IsInt()
  capacity: number;

  @IsDecimal(
    { decimal_digits: '0,2' },
    { message: 'Invalid ticket price format' },
  )
  ticket_price: number;
}
