import { Module } from '@nestjs/common';
import { FoldersService } from './folders.service';
import { FoldersController } from './folders.controller';
import { AccessModule } from '../access/access.module';
import { StorageModule } from '../files/storage/storage.module';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [AccessModule, StorageModule, ActivityModule],
  controllers: [FoldersController],
  providers: [FoldersService],
  exports: [FoldersService],
})
export class FoldersModule {}
