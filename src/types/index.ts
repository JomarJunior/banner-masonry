export interface ProcessedImage {
  id: string;
  originalFile: File;
  thumbnail: string; // Data URL for thumbnail (~300px)
  display: string; // Data URL for display (~1200px)
  printReady?: string; // Data URL for print (configurable)
  originalDimensions: {
    width: number;
    height: number;
  };
  displayDimensions: {
    width: number;
    height: number;
  };
  printDimensions?: {
    width: number;
    height: number;
  };
  fileSizes: {
    original: number;
    thumbnail: number;
    display: number;
    printReady?: number;
  };
}

export interface PrintConfig {
  width: number;
  height: number;
  unit: 'px' | 'in' | 'cm';
  dpi: number;
  quality: number; // 0.1 to 1.0
}

export interface ProcessingProgress {
  imageId: string;
  fileName: string;
  progress: number; // 0 to 100
  stage: 'loading' | 'processing' | 'complete' | 'error';
  error?: string;
}
