import { IsNumber, IsPositive, Min, Max, IsOptional } from 'class-validator';

export class PurchaseTicketDto {
  @IsNumber()
  @IsPositive()
  event_id: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  quantity?: number = 1;
}
