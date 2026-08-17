import { Module } from '@nestjs/common';
import { DataRoomsService } from './data-rooms.service';
import { DataRoomsController } from './data-rooms.controller';
import { AccessModule } from '../access/access.module';
import { FoldersModule } from '../folders/folders.module';
import { SearchModule } from '../search/search.module';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [AccessModule, FoldersModule, SearchModule, ActivityModule],
  controllers: [DataRoomsController],
  providers: [DataRoomsService],
})
export class DataRoomsModule {}
