import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs';
import * as fsp from 'node:fs/promises';
import * as path from 'node:path';
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

export interface StoredFileStream {
  stream: NodeJS.ReadableStream;
  size?: number;
}

interface StorageDriver {
  save(key: string, data: Buffer): Promise<void>;
  read(key: string): Promise<StoredFileStream>;
  delete(key: string): Promise<void>;
}

@Injectable()
export class LocalStorageDriver implements StorageDriver {
  private readonly root: string;

  constructor(config: ConfigService) {
    this.root = path.resolve(config.get<string>('LOCAL_STORAGE_DIR', './uploads'));
  }

  private resolve(key: string): string {
    const target = path.resolve(this.root, key);
    if (!target.startsWith(this.root)) {
      throw new Error('Invalid storage key');
    }
    return target;
  }

  async save(key: string, data: Buffer): Promise<void> {
    const target = this.resolve(key);
    await fsp.mkdir(path.dirname(target), { recursive: true });
    await fsp.writeFile(target, data);
  }

  async read(key: string): Promise<StoredFileStream> {
    const target = this.resolve(key);
    const stat = await fsp.stat(target);
    return { stream: fs.createReadStream(target), size: stat.size };
  }

  async delete(key: string): Promise<void> {
    await fsp.rm(this.resolve(key), { force: true });
  }
}

@Injectable()
export class S3StorageDriver implements StorageDriver {
  private client: S3Client | null = null;
  private bucket: string | null = null;

  constructor(private readonly config: ConfigService) {}

  // built lazily so a local-storage deployment (the default) never needs S3
  // credentials just to boot
  private getClient(): { client: S3Client; bucket: string } {
    if (!this.client || !this.bucket) {
      this.bucket = this.config.getOrThrow<string>('S3_BUCKET');
      const endpoint = this.config.get<string>('S3_ENDPOINT');
      this.client = new S3Client({
        region: this.config.get<string>('S3_REGION', 'auto'),
        ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
        credentials: {
          accessKeyId: this.config.getOrThrow<string>('S3_ACCESS_KEY_ID'),
          secretAccessKey: this.config.getOrThrow<string>('S3_SECRET_ACCESS_KEY'),
        },
      });
    }
    return { client: this.client, bucket: this.bucket };
  }

  async save(key: string, data: Buffer): Promise<void> {
    const { client, bucket } = this.getClient();
    await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: data }));
  }

  async read(key: string): Promise<StoredFileStream> {
    const { client, bucket } = this.getClient();
    const result = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    return { stream: result.Body as NodeJS.ReadableStream, size: result.ContentLength };
  }

  async delete(key: string): Promise<void> {
    const { client, bucket } = this.getClient();
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  }
}

@Injectable()
export class StorageService {
  private readonly driver: StorageDriver;

  constructor(config: ConfigService, local: LocalStorageDriver, s3: S3StorageDriver) {
    this.driver = config.get<string>('STORAGE_DRIVER', 'local') === 's3' ? s3 : local;
  }

  newKey(dataRoomId: string): string {
    return `${dataRoomId}/${randomUUID()}`;
  }

  save(key: string, data: Buffer): Promise<void> {
    return this.driver.save(key, data);
  }

  read(key: string): Promise<StoredFileStream> {
    return this.driver.read(key);
  }

  delete(key: string): Promise<void> {
    return this.driver.delete(key);
  }
}
