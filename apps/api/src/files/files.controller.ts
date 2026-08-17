import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import { FilesService } from './files.service';
import { UploadFileDto } from './dto';
import { RenameDto, MoveItemDto } from '../common/dto';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { OptionalAuth } from '../common/decorators/optional-auth.decorator';

const MAX_UPLOAD_BYTES = 200 * 1024 * 1024;

@Controller('files')
export class FilesController {
  constructor(private readonly files: FilesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: MAX_UPLOAD_BYTES } }))
  upload(@CurrentUser() user: AuthUser, @Body() dto: UploadFileDto, @UploadedFile() file: Express.Multer.File) {
    return this.files.upload(user.id, dto.dataRoomId, dto.folderId, file);
  }

  @OptionalAuth()
  @Get(':id')
  getMeta(@Param('id') id: string, @CurrentUser() user: AuthUser | undefined, @Query('shareToken') shareToken?: string) {
    return this.files.getMeta(id, { userId: user?.id, userEmail: user?.email, shareToken });
  }

  @OptionalAuth()
  @Get(':id/content')
  async getContent(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser | undefined,
    @Res() res: Response,
    @Query('shareToken') shareToken?: string,
    @Query('download') download?: string,
  ) {
    const { file, stream } = await this.files.getContent(id, { userId: user?.id, userEmail: user?.email, shareToken }, !!download);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Length', file.size.toString());
    res.setHeader(
      'Content-Disposition',
      `${download ? 'attachment' : 'inline'}; filename="${encodeURIComponent(file.name)}"`,
    );
    (stream as NodeJS.ReadableStream).pipe(res);
  }

  @Patch(':id/rename')
  rename(@Param('id') id: string, @CurrentUser() user: AuthUser, @Body() dto: RenameDto) {
    return this.files.rename(id, user.id, dto);
  }

  @Patch(':id/move')
  move(@Param('id') id: string, @CurrentUser() user: AuthUser, @Body() dto: MoveItemDto) {
    return this.files.move(id, user.id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.files.remove(id, user.id);
  }

  @Post(':id/versions')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: MAX_UPLOAD_BYTES } }))
  uploadVersion(@Param('id') id: string, @CurrentUser() user: AuthUser, @UploadedFile() file: Express.Multer.File) {
    return this.files.uploadNewVersion(id, user.id, file);
  }

  @OptionalAuth()
  @Get(':id/versions')
  listVersions(@Param('id') id: string, @CurrentUser() user: AuthUser | undefined, @Query('shareToken') shareToken?: string) {
    return this.files.listVersions(id, { userId: user?.id, userEmail: user?.email, shareToken });
  }

  @OptionalAuth()
  @Get(':id/versions/:version/content')
  async getVersionContent(
    @Param('id') id: string,
    @Param('version', ParseIntPipe) version: number,
    @CurrentUser() user: AuthUser | undefined,
    @Res() res: Response,
    @Query('shareToken') shareToken?: string,
  ) {
    const result = await this.files.getVersionContent(id, version, { userId: user?.id, userEmail: user?.email, shareToken });
    if (!result) throw new NotFoundException();
    res.setHeader('Content-Type', result.file.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(result.file.name)}"`);
    (result.stream as NodeJS.ReadableStream).pipe(res);
  }
}
