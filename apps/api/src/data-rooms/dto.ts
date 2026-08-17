import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateDataRoomDto {
  @IsString()
  @MinLength(1, { message: 'Name cannot be empty' })
  @MaxLength(255)
  name!: string;
}
