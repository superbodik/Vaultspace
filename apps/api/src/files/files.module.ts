import { Module } from '@nestjs/common';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { AccessModule } from '../access/access.module';
import { StorageModule } from './storage/storage.module';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [AccessModule, StorageModule, ActivityModule],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}
