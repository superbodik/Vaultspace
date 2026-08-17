import { ArrayMaxSize, ArrayMinSize, IsArray, IsEmail, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ShareMode, ShareResourceType } from '@prisma/client';

export class CreateShareDto {
  @IsEnum(ShareResourceType)
  resourceType!: ShareResourceType;

  @IsUUID()
  resourceId!: string;

  @IsEnum(ShareMode)
  mode!: ShareMode;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsEmail({}, { each: true })
  emails?: string[];
}

export class AddGrantsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsEmail({}, { each: true })
  emails!: string[];
}
