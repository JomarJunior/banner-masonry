import type { ProcessedImage, PrintConfig } from '../types';

interface MasonryItem {
  image: ProcessedImage;
  x: number;
  y: number;
  width: number;
  height: number;
}

export class BannerGenerator {
  /**
   * Calculate masonry layout for images within banner dimensions
   */
  private static calculateMasonryLayout(
    images: ProcessedImage[],
    bannerWidth: number,
    bannerHeight: number,
    columns: number = 3,
    gap: number = 10
  ): MasonryItem[] {
    const columnWidth = (bannerWidth - gap * (columns + 1)) / columns;
    const columnHeights = new Array(columns).fill(gap);
    const items: MasonryItem[] = [];

    for (const image of images) {
      // Find the shortest column
      const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights));
      
      // Calculate dimensions maintaining aspect ratio
      const aspectRatio = image.originalDimensions.width / image.originalDimensions.height;
      const itemWidth = columnWidth;
      const itemHeight = itemWidth / aspectRatio;

      // Calculate position
      const x = gap + shortestColumnIndex * (columnWidth + gap);
      const y = columnHeights[shortestColumnIndex];

      // Check if item fits in banner height
      if (y + itemHeight <= bannerHeight - gap) {
        items.push({
          image,
          x,
          y,
          width: itemWidth,
          height: itemHeight,
        });

        // Update column height
        columnHeights[shortestColumnIndex] = y + itemHeight + gap;
      }
    }

    return items;
  }

  /**
   * Load image from data URL
   */
  private static async loadImage(dataUrl: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = dataUrl;
    });
  }

  /**
   * Generate banner with masonry layout
   */
  static async generateBanner(
    images: ProcessedImage[],
    config: PrintConfig,
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    if (images.length === 0) {
      throw new Error('No images to generate banner');
    }

    onProgress?.(5);

    // Convert dimensions to pixels
    let bannerWidth = config.width;
    let bannerHeight = config.height;

    if (config.unit === 'in') {
      bannerWidth = config.width * config.dpi;
      bannerHeight = config.height * config.dpi;
    } else if (config.unit === 'cm') {
      bannerWidth = (config.width / 2.54) * config.dpi;
      bannerHeight = (config.height / 2.54) * config.dpi;
    }

    bannerWidth = Math.round(bannerWidth);
    bannerHeight = Math.round(bannerHeight);

    // Check canvas size limits (browsers typically limit to ~16000-32000px)
    const maxDimension = 16000;
    if (bannerWidth > maxDimension || bannerHeight > maxDimension) {
      throw new Error(`Banner dimensions too large. Maximum dimension is ${maxDimension}px. Current: ${bannerWidth}x${bannerHeight}px`);
    }

    onProgress?.(10);

    // Calculate masonry layout
    const columns = Math.max(1, Math.min(5, Math.floor(bannerWidth / 400)));
    const layout = this.calculateMasonryLayout(images, bannerWidth, bannerHeight, columns);

    if (layout.length === 0) {
      throw new Error('No images fit in the specified banner dimensions. Try increasing the banner size.');
    }

    onProgress?.(20);

    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = bannerWidth;
    canvas.height = bannerHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Fill background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, bannerWidth, bannerHeight);

    onProgress?.(30);

    // Load and draw all images
    const totalItems = layout.length;
    for (let i = 0; i < totalItems; i++) {
      const item = layout[i];
      
      try {
        // Load image from display version
        const img = await this.loadImage(item.image.display);
        
        // Draw image on canvas
        ctx.drawImage(
          img,
          item.x,
          item.y,
          item.width,
          item.height
        );

        // Add subtle border
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.strokeRect(item.x, item.y, item.width, item.height);

        // Update progress
        const progress = 30 + Math.floor((i + 1) / totalItems * 60);
        onProgress?.(progress);
      } catch (error) {
        console.error(`Failed to load image ${item.image.originalFile.name}:`, error);
      }
    }

    onProgress?.(95);

    // Convert canvas to blob with better error handling
    const blob = await new Promise<Blob>((resolve, reject) => {
      try {
        canvas.toBlob(
          (result) => {
            if (result) {
              resolve(result);
            } else {
              reject(new Error('Canvas toBlob returned null. This may be due to canvas size limits or memory constraints.'));
            }
          },
          'image/jpeg',
          config.quality
        );
      } catch (error) {
        reject(new Error(`Failed to convert canvas to blob: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    });

    onProgress?.(100);

    return blob;
  }

  /**
   * Generate banner and trigger download
   */
  static async generateAndDownload(
    images: ProcessedImage[],
    config: PrintConfig,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    const blob = await this.generateBanner(images, config, onProgress);

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().split('T')[0];
    link.href = url;
    link.download = `banner_${config.width}x${config.height}${config.unit}_${timestamp}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Generate banner preview as data URL
   */
  static async generatePreview(
    images: ProcessedImage[],
    config: PrintConfig,
    maxPreviewSize: number = 800
  ): Promise<string> {
    const blob = await this.generateBanner(images, config);
    
    // Create a preview-sized version
    const img = await this.loadImage(URL.createObjectURL(blob));
    
    const aspectRatio = img.width / img.height;
    let previewWidth = maxPreviewSize;
    let previewHeight = maxPreviewSize / aspectRatio;
    
    if (previewHeight > maxPreviewSize) {
      previewHeight = maxPreviewSize;
      previewWidth = maxPreviewSize * aspectRatio;
    }

    const canvas = document.createElement('canvas');
    canvas.width = previewWidth;
    canvas.height = previewHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    ctx.drawImage(img, 0, 0, previewWidth, previewHeight);

    return canvas.toDataURL('image/jpeg', 0.8);
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
