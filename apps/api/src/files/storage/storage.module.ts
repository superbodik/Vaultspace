import { Module } from '@nestjs/common';
import { StorageService, LocalStorageDriver, S3StorageDriver } from './storage.service';

@Module({
  providers: [StorageService, LocalStorageDriver, S3StorageDriver],
  exports: [StorageService],
})
export class StorageModule {}
