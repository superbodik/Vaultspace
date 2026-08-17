import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class RenameDto {
  @IsString()
  @MinLength(1, { message: 'Name cannot be empty' })
  @MaxLength(255)
  name!: string;
}

// shared by folders and files — moving either just needs a target parent
// (or none, meaning "back to the room root") and an optional name to use
// if the destination already has something with the same name
export class MoveItemDto {
  @IsOptional()
  @IsUUID()
  targetFolderId?: string;

  @IsOptional()
  @IsString()
  resolvedName?: string;
}
