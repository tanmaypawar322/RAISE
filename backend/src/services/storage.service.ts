import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';
import { config } from '../config/env.js';

export interface ProcessedFile {
  url: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
}

export class StorageService {
  private static uploadDir = path.resolve(process.cwd(), config.localUploadDir);

  static async init(): Promise<void> {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch (err) {
      console.error('[StorageService] Error creating upload directory:', err);
    }
  }

  /**
   * Process and save image with EXIF metadata stripped to protect citizen anonymity
   */
  static async saveImage(buffer: Buffer, originalExt: string): Promise<ProcessedFile> {
    await this.init();
    const id = crypto.randomUUID();
    const filename = `${id}.webp`;
    const targetPath = path.join(this.uploadDir, filename);

    // Strip EXIF / GPS metadata and convert to optimized WebP
    const processedBuffer = await sharp(buffer)
      .rotate() // Auto-orient based on EXIF before stripping
      .withMetadata({ exif: {} }) // Clear EXIF GPS/camera data
      .webp({ quality: 80 })
      .toBuffer();

    await fs.writeFile(targetPath, processedBuffer);

    return {
      url: `/uploads/${filename}`,
      filename,
      mimeType: 'image/webp',
      sizeBytes: processedBuffer.length,
    };
  }

  /**
   * Save audio voice note
   */
  static async saveVoiceNote(buffer: Buffer, ext: string = 'webm'): Promise<ProcessedFile> {
    await this.init();
    const id = crypto.randomUUID();
    const safeExt = ext.replace(/[^a-zA-Z0-9]/g, '') || 'webm';
    const filename = `voice_${id}.${safeExt}`;
    const targetPath = path.join(this.uploadDir, filename);

    await fs.writeFile(targetPath, buffer);

    return {
      url: `/uploads/${filename}`,
      filename,
      mimeType: safeExt === 'mp3' ? 'audio/mpeg' : 'audio/webm',
      sizeBytes: buffer.length,
    };
  }

  /**
   * Save supporting verification document (PDF, PNG, JPEG, max 5MB) with randomized filename
   */
  static async saveDocument(buffer: Buffer, originalname: string, mimeType: string): Promise<ProcessedFile> {
    await this.init();

    const allowedMimes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedMimes.includes(mimeType.toLowerCase())) {
      throw new Error('Invalid document format. Only PDF, PNG, and JPEG documents are permitted.');
    }

    if (buffer.length > 5 * 1024 * 1024) {
      throw new Error('Supporting document file size exceeds the 5MB limit.');
    }

    let ext = 'pdf';
    if (mimeType.includes('png')) ext = 'png';
    else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) ext = 'jpg';

    const id = crypto.randomUUID();
    const filename = `doc_${id}.${ext}`;
    const targetPath = path.join(this.uploadDir, filename);

    await fs.writeFile(targetPath, buffer);

    return {
      url: `/uploads/${filename}`,
      filename,
      mimeType,
      sizeBytes: buffer.length,
    };
  }

  /**
   * Save video file (mp4, webm, mov, max 50MB)
   */
  static async saveVideo(buffer: Buffer, originalname: string = 'video.mp4', mimeType: string = 'video/mp4'): Promise<ProcessedFile> {
    await this.init();
    const id = crypto.randomUUID();
    let ext = 'mp4';
    if (mimeType.includes('webm') || originalname.endsWith('.webm')) ext = 'webm';
    else if (mimeType.includes('quicktime') || originalname.endsWith('.mov')) ext = 'mov';
    else if (mimeType.includes('ogg') || originalname.endsWith('.ogv')) ext = 'ogv';
    const filename = `video_${id}.${ext}`;
    const targetPath = path.join(this.uploadDir, filename);

    await fs.writeFile(targetPath, buffer);

    return {
      url: `/uploads/${filename}`,
      filename,
      mimeType: mimeType || (ext === 'webm' ? 'video/webm' : 'video/mp4'),
      sizeBytes: buffer.length,
    };
  }
}

