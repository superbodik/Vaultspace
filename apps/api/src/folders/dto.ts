import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateFolderDto {
  @IsUUID()
  dataRoomId!: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsString()
  @MinLength(1, { message: 'Name cannot be empty' })
  @MaxLength(255)
  name!: string;
}
