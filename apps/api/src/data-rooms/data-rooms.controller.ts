import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { DataRoomsService } from './data-rooms.service';
import { FoldersService } from '../folders/folders.service';
import { SearchService } from '../search/search.service';
import { ActivityService } from '../activity/activity.service';
import { CreateDataRoomDto } from './dto';
import { RenameDto } from '../common/dto';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { OptionalAuth } from '../common/decorators/optional-auth.decorator';

@Controller('data-rooms')
export class DataRoomsController {
  constructor(
    private readonly dataRooms: DataRoomsService,
    private readonly folders: FoldersService,
    private readonly searchService: SearchService,
    private readonly activity: ActivityService,
  ) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateDataRoomDto) {
    return this.dataRooms.create(user.id, dto);
  }

  @Get()
  listMine(@CurrentUser() user: AuthUser) {
    return this.dataRooms.listMine(user.id);
  }

  @Get('shared-with-me')
  listShared(@CurrentUser() user: AuthUser) {
    return this.dataRooms.listSharedWithMe({ userId: user.id, userEmail: user.email });
  }

  @OptionalAuth()
  @Get(':id')
  getOne(@Param('id') id: string, @CurrentUser() user: AuthUser | undefined, @Query('shareToken') shareToken?: string) {
    return this.dataRooms.getOne(id, { userId: user?.id, userEmail: user?.email, shareToken });
  }

  @Patch(':id')
  rename(@Param('id') id: string, @CurrentUser() user: AuthUser, @Body() dto: RenameDto) {
    return this.dataRooms.rename(id, user.id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.dataRooms.remove(id, user.id);
  }

  @OptionalAuth()
  @Get(':id/stats')
  stats(@Param('id') id: string, @CurrentUser() user: AuthUser | undefined, @Query('shareToken') shareToken?: string) {
    return this.dataRooms.stats(id, { userId: user?.id, userEmail: user?.email, shareToken });
  }

  @OptionalAuth()
  @Get(':id/browse')
  browse(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser | undefined,
    @Query('folderId') folderId: string | undefined,
    @Query('shareToken') shareToken?: string,
  ) {
    return this.folders.browse(id, folderId ?? null, { userId: user?.id, userEmail: user?.email, shareToken });
  }

  @OptionalAuth()
  @Get(':id/search')
  search(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser | undefined,
    @Query('q') q: string,
    @Query('shareToken') shareToken?: string,
  ) {
    return this.searchService.searchDataRoom(id, q ?? '', { userId: user?.id, userEmail: user?.email, shareToken });
  }

  @Get(':id/activity')
  activityFeed(@Param('id') id: string, @CurrentUser() user: AuthUser, @Query('before') before?: string) {
    return this.activity.list(id, user.id, before);
  }
}
