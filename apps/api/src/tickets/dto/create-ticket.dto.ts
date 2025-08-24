import { IsNotEmpty, IsInt } from 'class-validator';

export class CreateTicketDto {
  @IsInt()
  @IsNotEmpty()
  event_id: number;
}
