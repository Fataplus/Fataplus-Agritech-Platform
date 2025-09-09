/**
 * Cloudflare R2 Storage Integration for Fataplus
 * Provides file upload, download, and management capabilities using R2
 */

import { R2Bucket } from '@cloudflare/workers-types';

interface R2Config {
  bucket: R2Bucket;
  publicUrl: string;
  maxFileSize: number;
  allowedMimeTypes: string[];
}

interface UploadOptions {
  folder?: string;
  generateUniqueFileName?: boolean;
  metadata?: Record<string, string>;
  customTags?: Record<string, string>;
}

interface FileInfo {
  key: string;
  size: number;
  lastModified: Date;
  etag: string;
  contentType: string;
  publicUrl: string;
  metadata?: Record<string, string>;
}

export class R2StorageService {
  private config: R2Config;

  constructor(config: R2Config) {
    this.config = config;
  }

  /**
   * Upload a file to R2 storage
   */
  async uploadFile(
    file: File | ArrayBuffer | Uint8Array | ReadableStream,
    fileName: string,
    options: UploadOptions = {}
  ): Promise<FileInfo> {
    try {
      // Validate file size
      const fileSize = this.getFileSize(file);
      if (fileSize > this.config.maxFileSize) {
        throw new Error(`File size ${fileSize} exceeds maximum allowed size ${this.config.maxFileSize}`);
      }

      // Generate file key
      const fileKey = this.generateFileKey(fileName, options);

      // Prepare metadata
      const metadata = {
        uploadedAt: new Date().toISOString(),
        originalName: fileName,
        ...options.metadata,
      };

      // Upload to R2
      const putOptions: R2PutOptions = {
        httpMetadata: {
          contentType: this.getContentType(fileName),
          cacheControl: 'public, max-age=31536000', // 1 year
        },
        customMetadata: metadata,
        ...(options.customTags && { tags: options.customTags }),
      };

      const result = await this.config.bucket.put(fileKey, file, putOptions);

      if (!result) {
        throw new Error('Failed to upload file to R2');
      }

      return {
        key: fileKey,
        size: fileSize,
        lastModified: new Date(),
        etag: result.etag,
        contentType: this.getContentType(fileName),
        publicUrl: `${this.config.publicUrl}/${fileKey}`,
        metadata,
      };
    } catch (error) {
      console.error('R2 upload error:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  /**
   * Download a file from R2 storage
   */
  async downloadFile(key: string): Promise<R2ObjectBody | null> {
    try {
      const object = await this.config.bucket.get(key);
      return object;
    } catch (error) {
      console.error('R2 download error:', error);
      throw new Error(`Download failed: ${error.message}`);
    }
  }

  /**
   * Get file information without downloading content
   */
  async getFileInfo(key: string): Promise<FileInfo | null> {
    try {
      const object = await this.config.bucket.head(key);
      
      if (!object) {
        return null;
      }

      return {
        key,
        size: object.size,
        lastModified: object.uploaded,
        etag: object.etag,
        contentType: object.httpMetadata?.contentType || 'application/octet-stream',
        publicUrl: `${this.config.publicUrl}/${key}`,
        metadata: object.customMetadata,
      };
    } catch (error) {
      console.error('R2 head error:', error);
      return null;
    }
  }

  /**
   * Delete a file from R2 storage
   */
  async deleteFile(key: string): Promise<boolean> {
    try {
      await this.config.bucket.delete(key);
      return true;
    } catch (error) {
      console.error('R2 delete error:', error);
      return false;
    }
  }

  /**
   * List files in a folder
   */
  async listFiles(
    prefix?: string,
    limit: number = 100,
    cursor?: string
  ): Promise<{ files: FileInfo[]; cursor?: string; truncated: boolean }> {
    try {
      const options: R2ListOptions = {
        limit,
        prefix,
        ...(cursor && { cursor }),
      };

      const result = await this.config.bucket.list(options);

      const files: FileInfo[] = result.objects.map((obj) => ({
        key: obj.key,
        size: obj.size,
        lastModified: obj.uploaded,
        etag: obj.etag,
        contentType: obj.httpMetadata?.contentType || 'application/octet-stream',
        publicUrl: `${this.config.publicUrl}/${obj.key}`,
        metadata: obj.customMetadata,
      }));

      return {
        files,
        cursor: result.cursor,
        truncated: result.truncated,
      };
    } catch (error) {
      console.error('R2 list error:', error);
      throw new Error(`List failed: ${error.message}`);
    }
  }

  /**
   * Generate a signed URL for secure file access
   */
  async generateSignedUrl(
    key: string,
    expirationSeconds: number = 3600,
    method: 'GET' | 'PUT' | 'DELETE' = 'GET'
  ): Promise<string> {
    try {
      // Note: R2 doesn't currently support signed URLs directly
      // This would need to be implemented using Cloudflare API or alternative method
      // For now, return the public URL
      return `${this.config.publicUrl}/${key}`;
    } catch (error) {
      console.error('R2 signed URL error:', error);
      throw new Error(`Signed URL generation failed: ${error.message}`);
    }
  }

  /**
   * Copy a file within R2 storage
   */
  async copyFile(sourceKey: string, destinationKey: string): Promise<boolean> {
    try {
      const sourceObject = await this.config.bucket.get(sourceKey);
      
      if (!sourceObject) {
        throw new Error('Source file not found');
      }

      const result = await this.config.bucket.put(destinationKey, sourceObject.body, {
        httpMetadata: sourceObject.httpMetadata,
        customMetadata: sourceObject.customMetadata,
      });

      return !!result;
    } catch (error) {
      console.error('R2 copy error:', error);
      return false;
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(prefix?: string): Promise<{
    totalFiles: number;
    totalSize: number;
    oldestFile?: Date;
    newestFile?: Date;
  }> {
    try {
      const result = await this.config.bucket.list({ prefix });
      
      let totalSize = 0;
      let oldestFile: Date | undefined;
      let newestFile: Date | undefined;

      result.objects.forEach((obj) => {
        totalSize += obj.size;
        
        if (!oldestFile || obj.uploaded < oldestFile) {
          oldestFile = obj.uploaded;
        }
        
        if (!newestFile || obj.uploaded > newestFile) {
          newestFile = obj.uploaded;
        }
      });

      return {
        totalFiles: result.objects.length,
        totalSize,
        oldestFile,
        newestFile,
      };
    } catch (error) {
      console.error('R2 stats error:', error);
      throw new Error(`Stats retrieval failed: ${error.message}`);
    }
  }

  /**
   * Cleanup old files based on age or count
   */
  async cleanupOldFiles(
    options: {
      olderThan?: Date;
      keepLatest?: number;
      prefix?: string;
    }
  ): Promise<number> {
    try {
      const { olderThan, keepLatest, prefix } = options;
      const result = await this.config.bucket.list({ prefix });
      
      let filesToDelete = result.objects;

      // Filter by age
      if (olderThan) {
        filesToDelete = filesToDelete.filter(obj => obj.uploaded < olderThan);
      }

      // Keep latest N files
      if (keepLatest && keepLatest > 0) {
        filesToDelete.sort((a, b) => b.uploaded.getTime() - a.uploaded.getTime());
        filesToDelete = filesToDelete.slice(keepLatest);
      }

      // Delete files
      let deletedCount = 0;
      for (const obj of filesToDelete) {
        const success = await this.deleteFile(obj.key);
        if (success) {
          deletedCount++;
        }
      }

      return deletedCount;
    } catch (error) {
      console.error('R2 cleanup error:', error);
      return 0;
    }
  }

  // Private helper methods

  private generateFileKey(fileName: string, options: UploadOptions): string {
    const { folder, generateUniqueFileName } = options;
    
    let key = fileName;
    
    if (generateUniqueFileName) {
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 8);
      const extension = this.getFileExtension(fileName);
      const baseName = fileName.replace(/\.[^/.]+$/, '');
      key = `${baseName}_${timestamp}_${random}${extension}`;
    }
    
    if (folder) {
      key = `${folder.replace(/^\/+|\/+$/g, '')}/${key}`;
    }
    
    return key;
  }

  private getFileSize(file: File | ArrayBuffer | Uint8Array | ReadableStream): number {
    if (file instanceof File) {
      return file.size;
    } else if (file instanceof ArrayBuffer) {
      return file.byteLength;
    } else if (file instanceof Uint8Array) {
      return file.length;
    } else {
      // For ReadableStream, we can't determine size without reading
      return 0;
    }
  }

  private getContentType(fileName: string): string {
    const extension = this.getFileExtension(fileName).toLowerCase();
    
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.mp4': 'video/mp4',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.txt': 'text/plain',
      '.csv': 'text/csv',
      '.json': 'application/json',
      '.zip': 'application/zip',
    };

    return mimeTypes[extension] || 'application/octet-stream';
  }

  private getFileExtension(fileName: string): string {
    const lastDot = fileName.lastIndexOf('.');
    return lastDot > 0 ? fileName.substring(lastDot) : '';
  }

  private validateMimeType(fileName: string): boolean {
    const contentType = this.getContentType(fileName);
    return this.config.allowedMimeTypes.length === 0 || 
           this.config.allowedMimeTypes.includes(contentType);
  }
}

// Specialized storage services for different use cases

export class ImageStorageService extends R2StorageService {
  constructor(bucket: R2Bucket, publicUrl: string) {
    super({
      bucket,
      publicUrl,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedMimeTypes: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
      ],
    });
  }

  async uploadProfilePicture(file: File, userId: string): Promise<FileInfo> {
    return this.uploadFile(file, `profile_${userId}.${this.getFileExtension(file.name)}`, {
      folder: 'profiles',
      generateUniqueFileName: false,
      metadata: { type: 'profile_picture', userId },
    });
  }

  async uploadFarmImage(file: File, farmId: string): Promise<FileInfo> {
    return this.uploadFile(file, file.name, {
      folder: `farms/${farmId}`,
      generateUniqueFileName: true,
      metadata: { type: 'farm_image', farmId },
    });
  }
}

export class DocumentStorageService extends R2StorageService {
  constructor(bucket: R2Bucket, publicUrl: string) {
    super({
      bucket,
      publicUrl,
      maxFileSize: 50 * 1024 * 1024, // 50MB
      allowedMimeTypes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'text/csv',
      ],
    });
  }

  async uploadContract(file: File, farmId: string): Promise<FileInfo> {
    return this.uploadFile(file, file.name, {
      folder: `contracts/${farmId}`,
      generateUniqueFileName: true,
      metadata: { type: 'contract', farmId },
    });
  }

  async uploadReport(file: File, type: string, userId: string): Promise<FileInfo> {
    return this.uploadFile(file, file.name, {
      folder: `reports/${type}`,
      generateUniqueFileName: true,
      metadata: { type: 'report', reportType: type, userId },
    });
  }
}

export class BackupStorageService extends R2StorageService {
  constructor(bucket: R2Bucket, publicUrl: string) {
    super({
      bucket,
      publicUrl,
      maxFileSize: 1024 * 1024 * 1024, // 1GB
      allowedMimeTypes: [], // Allow all types for backups
    });
  }

  async uploadDatabaseBackup(backup: Uint8Array, timestamp: string): Promise<FileInfo> {
    const fileName = `database_backup_${timestamp}.sql.gz`;
    return this.uploadFile(backup, fileName, {
      folder: 'backups/database',
      generateUniqueFileName: false,
      metadata: { type: 'database_backup', timestamp },
    });
  }

  async uploadFileBackup(files: File[], timestamp: string): Promise<FileInfo[]> {
    const results: FileInfo[] = [];
    
    for (const file of files) {
      const result = await this.uploadFile(file, file.name, {
        folder: `backups/files/${timestamp}`,
        generateUniqueFileName: false,
        metadata: { type: 'file_backup', timestamp },
      });
      results.push(result);
    }
    
    return results;
  }

  async cleanupOldBackups(retentionDays: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    return this.cleanupOldFiles({
      olderThan: cutoffDate,
      prefix: 'backups/',
    });
  }
}

// Factory function to create storage services
export function createStorageServices(
  storageBucket: R2Bucket,
  modelsBucket: R2Bucket,
  publicUrl: string
) {
  return {
    images: new ImageStorageService(storageBucket, publicUrl),
    documents: new DocumentStorageService(storageBucket, publicUrl),
    backups: new BackupStorageService(storageBucket, publicUrl),
    general: new R2StorageService({
      bucket: storageBucket,
      publicUrl,
      maxFileSize: 100 * 1024 * 1024, // 100MB
      allowedMimeTypes: [],
    }),
    models: new R2StorageService({
      bucket: modelsBucket,
      publicUrl: publicUrl.replace('storage', 'models'),
      maxFileSize: 1024 * 1024 * 1024, // 1GB for ML models
      allowedMimeTypes: [],
    }),
  };
}