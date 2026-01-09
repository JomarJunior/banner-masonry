import React from 'react';
import Masonry from 'react-masonry-css';
import type { ProcessedImage } from '../types';
import './MasonryGrid.css';

interface MasonryGridProps {
  images: ProcessedImage[];
  onImageRemove: (imageId: string) => void;
  onImageClick?: (image: ProcessedImage) => void;
}

export const MasonryGrid: React.FC<MasonryGridProps> = ({ 
  images, 
  onImageRemove,
  onImageClick 
}) => {
  const breakpointColumnsObj = {
    default: 4,
    1400: 3,
    1000: 2,
    700: 1
  };

  if (images.length === 0) {
    return (
      <div className="empty-state">
        <svg className="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
          <path d="M21 15l-5-5L5 21" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <p>No images yet. Upload some to get started!</p>
      </div>
    );
  }

  return (
    <div className="masonry-grid-container">
      <div className="grid-header">
        <h2>Your Images ({images.length})</h2>
      </div>
      
      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="masonry-grid"
        columnClassName="masonry-grid-column"
      >
        {images.map((image) => (
          <div key={image.id} className="masonry-item">
            <div 
              className="image-wrapper"
              onClick={() => onImageClick?.(image)}
            >
              <img 
                src={image.display} 
                alt={image.originalFile.name}
                loading="lazy"
              />
              <div className="image-overlay">
                <div className="image-info">
                  <span className="image-name">{image.originalFile.name}</span>
                  <span className="image-dimensions">
                    {image.originalDimensions.width} × {image.originalDimensions.height}
                  </span>
                  <span className="image-size">
                    Original: {formatFileSize(image.fileSizes.original)} → 
                    Display: {formatFileSize(image.fileSizes.display)}
                  </span>
                </div>
              </div>
            </div>
            <button
              className="remove-button"
              onClick={(e) => {
                e.stopPropagation();
                onImageRemove(image.id);
              }}
              title="Remove image"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </Masonry>
    </div>
  );
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
