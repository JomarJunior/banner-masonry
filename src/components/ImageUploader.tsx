import React, { useState, useRef } from 'react';
import type { ProcessedImage, ProcessingProgress } from '../types';
import { ImageProcessor } from '../utils/imageProcessor';
import './ImageUploader.css';

interface ImageUploaderProps {
  onImagesProcessed: (images: ProcessedImage[]) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onImagesProcessed }) => {
  const [processing, setProcessing] = useState<Map<string, ProcessingProgress>>(new Map());
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const imageFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/')
    );

    if (imageFiles.length === 0) {
      alert('Please select valid image files');
      return;
    }

    // Initialize progress tracking
    const progressMap = new Map<string, ProcessingProgress>();
    imageFiles.forEach((file, index) => {
      const tempId = `temp-${index}-${Date.now()}`;
      progressMap.set(tempId, {
        imageId: tempId,
        fileName: file.name,
        progress: 0,
        stage: 'loading',
      });
    });
    setProcessing(progressMap);

    // Process images
    try {
      const processed = await ImageProcessor.processImages(
        imageFiles,
        (imageId, _fileName, progress) => {
          setProcessing(prev => {
            const next = new Map(prev);
            const existing = next.get(imageId);
            if (existing) {
              next.set(imageId, {
                ...existing,
                progress,
                stage: progress === 100 ? 'complete' : 'processing',
              });
            }
            return next;
          });
        }
      );

      // Clear processing state and notify parent
      setTimeout(() => {
        setProcessing(new Map());
        onImagesProcessed(processed);
      }, 500);
    } catch (error) {
      console.error('Failed to process images:', error);
      alert('Failed to process some images. Please try again.');
      setProcessing(new Map());
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const isProcessing = processing.size > 0;
  const progressEntries = Array.from(processing.values());

  return (
    <div className="image-uploader">
      <div
        className={`upload-zone ${isDragging ? 'dragging' : ''} ${isProcessing ? 'processing' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={!isProcessing ? handleClick : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          disabled={isProcessing}
        />
        
        {!isProcessing ? (
          <div className="upload-prompt">
            <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="upload-text">
              Drop images here or click to select
            </p>
            <p className="upload-hint">
              Supports images of any size • JPG, PNG, WebP
            </p>
          </div>
        ) : (
          <div className="processing-list">
            <h3>Processing Images...</h3>
            {progressEntries.map(entry => (
              <div key={entry.imageId} className="processing-item">
                <div className="processing-info">
                  <span className="file-name">{entry.fileName}</span>
                  <span className="progress-percent">{entry.progress}%</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${entry.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
