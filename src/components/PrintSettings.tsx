import React, { useState } from 'react';
import type { ProcessedImage, PrintConfig } from '../types';
import { BannerGenerator } from '../utils/bannerGenerator';
import './PrintSettings.css';

interface PrintSettingsProps {
  images: ProcessedImage[];
  onPrintConfigChange: (config: PrintConfig) => void;
}

export const PrintSettings: React.FC<PrintSettingsProps> = ({ 
  images,
  onPrintConfigChange 
}) => {
  const [config, setConfig] = useState<PrintConfig>({
    width: 3000,
    height: 2000,
    unit: 'px',
    dpi: 300,
    quality: 0.9,
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generatedSize, setGeneratedSize] = useState<number | null>(null);

  const handleConfigChange = (updates: Partial<PrintConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    onPrintConfigChange(newConfig);
  };

  const calculatePixelDimensions = (): { width: number; height: number } => {
    let width = config.width;
    let height = config.height;

    if (config.unit === 'in') {
      width = config.width * config.dpi;
      height = config.height * config.dpi;
    } else if (config.unit === 'cm') {
      width = (config.width / 2.54) * config.dpi;
      height = (config.height / 2.54) * config.dpi;
    }

    return { 
      width: Math.round(width), 
      height: Math.round(height) 
    };
  };

  const handleGenerateBanner = async () => {
    if (images.length === 0) {
      alert('No images to generate banner from');
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    setPreviewUrl(null);
    setGeneratedSize(null);

    try {
      const blob = await BannerGenerator.generateBanner(
        images,
        config,
        (progress) => {
          setGenerationProgress(progress);
        }
      );
      
      // Generate preview
      const preview = await BannerGenerator.generatePreview(images, config);
      setPreviewUrl(preview);
      setGeneratedSize(blob.size);
      
      alert(`Banner generated successfully! Size: ${BannerGenerator.formatFileSize(blob.size)}`);
    } catch (error) {
      console.error('Failed to generate banner:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to generate banner: ${errorMessage}`);
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  const handleDownloadBanner = async () => {
    if (!previewUrl) {
      alert('Please generate banner first');
      return;
    }

    setIsGenerating(true);
    try {
      await BannerGenerator.generateAndDownload(
        images,
        config,
        (progress) => {
          setGenerationProgress(progress);
        }
      );
    } catch (error) {
      console.error('Failed to download banner:', error);
      alert('Failed to download banner. Please try again.');
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  const pixelDimensions = calculatePixelDimensions();

  return (
    <div className="print-settings">
      <div className="settings-header">
        <h2>Banner Configuration</h2>
        <p className="settings-description">
          Configure banner dimensions and quality. All images will be arranged in masonry layout within a single banner.
        </p>
        {pixelDimensions.width > 16000 || pixelDimensions.height > 16000 ? (
          <p className="settings-warning">
            ⚠️ Warning: Banner dimensions exceed 16,000px limit. Reduce size or DPI.
          </p>
        ) : null}
      </div>

      <div className="settings-grid">
        <div className="setting-group">
          <label htmlFor="width">Width</label>
          <input
            id="width"
            type="number"
            min="1"
            step="0.1"
            value={config.width}
            onChange={(e) => handleConfigChange({ width: parseFloat(e.target.value) || 1 })}
          />
        </div>

        <div className="setting-group">
          <label htmlFor="height">Height</label>
          <input
            id="height"
            type="number"
            min="1"
            step="0.1"
            value={config.height}
            onChange={(e) => handleConfigChange({ height: parseFloat(e.target.value) || 1 })}
          />
        </div>

        <div className="setting-group">
          <label htmlFor="unit">Unit</label>
          <select
            id="unit"
            value={config.unit}
            onChange={(e) => handleConfigChange({ unit: e.target.value as 'px' | 'in' | 'cm' })}
          >
            <option value="px">Pixels</option>
            <option value="in">Inches</option>
            <option value="cm">Centimeters</option>
          </select>
        </div>

        <div className="setting-group">
          <label htmlFor="dpi">DPI</label>
          <select
            id="dpi"
            value={config.dpi}
            onChange={(e) => handleConfigChange({ dpi: parseInt(e.target.value) })}
          >
            <option value="72">72 (Screen)</option>
            <option value="150">150 (Draft)</option>
            <option value="300">300 (Standard)</option>
            <option value="600">600 (High Quality)</option>
          </select>
        </div>

        <div className="setting-group quality-group">
          <label htmlFor="quality">
            Quality: {Math.round(config.quality * 100)}%
          </label>
          <input
            id="quality"
            type="range"
            min="0.1"
            max="1"
            step="0.05"
            value={config.quality}
            onChange={(e) => handleConfigChange({ quality: parseFloat(e.target.value) })}
          />
        </div>
      </div>

      <div className="dimensions-preview">
        <h3>Output Dimensions</h3>
        <div className="preview-info">
          <div className="preview-item">
            <span className="preview-label">Configured:</span>
            <span className="preview-value">
              {config.width} × {config.height} {config.unit}
            </span>
          </div>
          <div className="preview-item">
            <span className="preview-label">Banner Size (pixels):</span>
            <span className="preview-value">
              {pixelDimensions.width} × {pixelDimensions.height} px
            </span>
          </div>
          <div className="preview-item">
            <span className="preview-label">Images Ready:</span>
            <span className="preview-value">
              {images.length} image{images.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      <div className="action-buttons">
        <button
          className="btn btn-primary"
          onClick={handleGenerateBanner}
          disabled={images.length === 0 || isGenerating}
        >
          {isGenerating ? `Generating... ${generationProgress}%` : 'Generate Banner'}
        </button>

        <button
          className="btn btn-secondary"
          onClick={handleDownloadBanner}
          disabled={!previewUrl || isGenerating}
        >
          Download Banner
        </button>
      </div>

      {previewUrl && (
        <div className="generation-summary">
          <h3>Banner Preview</h3>
          <div className="banner-preview">
            <img src={previewUrl} alt="Banner preview" />
          </div>
          <div className="preview-info">
            <div className="preview-item">
              <span className="preview-label">Images included:</span>
              <span className="preview-value">{images.length}</span>
            </div>
            <div className="preview-item">
              <span className="preview-label">File size:</span>
              <span className="preview-value">
                {generatedSize ? BannerGenerator.formatFileSize(generatedSize) : 'N/A'}
              </span>
            </div>
            <div className="preview-item">
              <span className="preview-label">Dimensions:</span>
              <span className="preview-value">
                {config.width} × {config.height} {config.unit} ({pixelDimensions.width} × {pixelDimensions.height} px)
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
