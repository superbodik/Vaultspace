import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { FoldersService } from './folders.service';
import { CreateFolderDto } from './dto';
import { RenameDto, MoveItemDto } from '../common/dto';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { OptionalAuth } from '../common/decorators/optional-auth.decorator';

@Controller('folders')
export class FoldersController {
  constructor(private readonly folders: FoldersService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateFolderDto) {
    return this.folders.create(user.id, dto);
  }

  @OptionalAuth()
  @Get(':id/stats')
  stats(@Param('id') id: string, @CurrentUser() user: AuthUser | undefined, @Query('shareToken') shareToken?: string) {
    return this.folders.stats(id, { userId: user?.id, userEmail: user?.email, shareToken });
  }

  @Patch(':id/rename')
  rename(@Param('id') id: string, @CurrentUser() user: AuthUser, @Body() dto: RenameDto) {
    return this.folders.rename(id, user.id, dto);
  }

  @Patch(':id/move')
  move(@Param('id') id: string, @CurrentUser() user: AuthUser, @Body() dto: MoveItemDto) {
    return this.folders.move(id, user.id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.folders.remove(id, user.id);
  }
}
