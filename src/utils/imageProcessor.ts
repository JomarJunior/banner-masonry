import imageCompression from 'browser-image-compression';
import type { ProcessedImage, PrintConfig } from '../types';

export class ImageProcessor {
  /**
   * Generate a unique ID for an image
   */
  private static generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get image dimensions without loading the full image
   */
  private static async getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({ width: img.width, height: img.height });
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };
      
      img.src = url;
    });
  }

  /**
   * Convert blob to data URL
   */
  private static async blobToDataURL(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Calculate target dimensions while maintaining aspect ratio
   */
  private static calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxDimension: number
  ): { width: number; height: number } {
    const aspectRatio = originalWidth / originalHeight;
    
    if (originalWidth > originalHeight) {
      return {
        width: Math.min(originalWidth, maxDimension),
        height: Math.min(originalWidth, maxDimension) / aspectRatio,
      };
    } else {
      return {
        width: Math.min(originalHeight, maxDimension) * aspectRatio,
        height: Math.min(originalHeight, maxDimension),
      };
    }
  }

  /**
   * Process a single image to create thumbnail and display versions
   */
  static async processImage(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<ProcessedImage> {
    try {
      const id = this.generateId();
      const originalDimensions = await this.getImageDimensions(file);
      
      // Report progress: loaded
      onProgress?.(10);

      // Create thumbnail (~300px max dimension)
      const thumbnailBlob = await imageCompression(file, {
        maxWidthOrHeight: 300,
        useWebWorker: true,
        fileType: 'image/jpeg',
        initialQuality: 0.8,
      });
      
      onProgress?.(40);

      // Create display version (~1200px max dimension)
      const displayDimensions = this.calculateDimensions(
        originalDimensions.width,
        originalDimensions.height,
        1200
      );
      
      const displayBlob = await imageCompression(file, {
        maxWidthOrHeight: 1200,
        useWebWorker: true,
        fileType: 'image/jpeg',
        initialQuality: 0.9,
      });
      
      onProgress?.(80);

      // Convert to data URLs
      const thumbnailDataURL = await this.blobToDataURL(thumbnailBlob);
      const displayDataURL = await this.blobToDataURL(displayBlob);
      
      onProgress?.(100);

      return {
        id,
        originalFile: file,
        thumbnail: thumbnailDataURL,
        display: displayDataURL,
        originalDimensions,
        displayDimensions,
        fileSizes: {
          original: file.size,
          thumbnail: thumbnailBlob.size,
          display: displayBlob.size,
        },
      };
    } catch (error) {
      throw new Error(`Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate print-ready version based on configuration
   */
  static async generatePrintVersion(
    processedImage: ProcessedImage,
    config: PrintConfig,
    onProgress?: (progress: number) => void
  ): Promise<ProcessedImage> {
    try {
      // Convert dimensions to pixels
      let targetWidth = config.width;
      let targetHeight = config.height;
      
      if (config.unit === 'in') {
        targetWidth = config.width * config.dpi;
        targetHeight = config.height * config.dpi;
      } else if (config.unit === 'cm') {
        targetWidth = (config.width / 2.54) * config.dpi;
        targetHeight = (config.height / 2.54) * config.dpi;
      }

      onProgress?.(20);

      // Calculate the max dimension to maintain aspect ratio
      const maxDimension = Math.max(targetWidth, targetHeight);
      
      const printBlob = await imageCompression(processedImage.originalFile, {
        maxWidthOrHeight: maxDimension,
        useWebWorker: true,
        fileType: 'image/jpeg',
        initialQuality: config.quality,
      });
      
      onProgress?.(80);

      const printDataURL = await this.blobToDataURL(printBlob);
      
      onProgress?.(100);

      return {
        ...processedImage,
        printReady: printDataURL,
        printDimensions: {
          width: targetWidth,
          height: targetHeight,
        },
        fileSizes: {
          ...processedImage.fileSizes,
          printReady: printBlob.size,
        },
      };
    } catch (error) {
      throw new Error(`Failed to generate print version: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process multiple images in sequence
   */
  static async processImages(
    files: File[],
    onProgress?: (imageId: string, fileName: string, progress: number) => void
  ): Promise<ProcessedImage[]> {
    const results: ProcessedImage[] = [];
    
    for (const file of files) {
      const tempId = this.generateId();
      try {
        const processed = await this.processImage(file, (progress) => {
          onProgress?.(tempId, file.name, progress);
        });
        results.push(processed);
      } catch (error) {
        console.error(`Failed to process ${file.name}:`, error);
        // Continue with other images even if one fails
      }
    }
    
    return results;
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
