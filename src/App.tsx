import { useState } from 'react';
import type { ProcessedImage } from './types';
import { ImageUploader } from './components/ImageUploader';
import { MasonryGrid } from './components/MasonryGrid';
import { PrintSettings } from './components/PrintSettings';
import './App.css';

function App() {
  const [images, setImages] = useState<ProcessedImage[]>([]);

  const handleImagesProcessed = (newImages: ProcessedImage[]) => {
    setImages(prev => [...prev, ...newImages]);
  };

  const handleImageRemove = (imageId: string) => {
    setImages(prev => prev.filter(img => img.id !== imageId));
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🖼️ Banner Masonry</h1>
        <p className="app-subtitle">
          Create photo collage banners with masonry layout
        </p>
      </header>

      <main className="app-main">
        <ImageUploader onImagesProcessed={handleImagesProcessed} />
        
        <MasonryGrid 
          images={images}
          onImageRemove={handleImageRemove}
        />

        {images.length > 0 && (
          <PrintSettings 
            images={images}
            onPrintConfigChange={() => {}}
          />
        )}
      </main>

      <footer className="app-footer">
        <p>All processing happens in your browser • No data is uploaded</p>
      </footer>
    </div>
  );
}

export default App;
