import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { SharesService } from './shares.service';
import { CreateShareDto, AddGrantsDto } from './dto';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@Controller('shares')
export class SharesController {
  constructor(private readonly shares: SharesService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateShareDto) {
    return this.shares.create(user.id, dto);
  }

  @Get('resource')
  listForResource(
    @CurrentUser() user: AuthUser,
    @Query('resourceType') resourceType: string,
    @Query('resourceId') resourceId: string,
  ) {
    return this.shares.listForResource(resourceType, resourceId, user.id);
  }

  @Public()
  @Get('public/:token')
  resolvePublic(@Param('token') token: string) {
    return this.shares.resolvePublicToken(token);
  }

  @Post(':id/grants')
  addGrants(@Param('id') id: string, @CurrentUser() user: AuthUser, @Body() dto: AddGrantsDto) {
    return this.shares.addGrants(id, user.id, dto);
  }

  @Delete(':id/grants/:grantId')
  removeGrant(@Param('id') id: string, @Param('grantId') grantId: string, @CurrentUser() user: AuthUser) {
    return this.shares.removeGrant(id, grantId, user.id);
  }

  @Delete(':id')
  revoke(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.shares.revoke(id, user.id);
  }
}
