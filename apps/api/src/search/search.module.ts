import { Module } from '@nestjs/common';
import { SearchService } from './search.service';
import { AccessModule } from '../access/access.module';

@Module({
  imports: [AccessModule],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
