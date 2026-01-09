# Banner Masonry

A client-side photo masonry application that creates a single banner image with all your photos arranged in a beautiful masonry layout. Perfect for creating photo collages for printing or display. All image processing happens directly in your browser—no data is uploaded to any server.

## Features

- **Client-Side Image Processing**: Upload images of any size and process them entirely in your browser using Web Workers
- **Smart Compression**: Automatically generates optimized versions for display and final banner generation
- **Masonry Layout**: All images arranged in a beautiful responsive masonry grid within a single banner
- **Banner Configuration**: Configure final banner dimensions (pixels, inches, cm), DPI (72-600), and quality
- **Single File Output**: Download one banner image containing all your photos in masonry layout
- **Privacy-Focused**: No server uploads, all processing happens locally

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **browser-image-compression** for client-side image processing with Web Workers
- **react-masonry-css** for responsive masonry grid layout

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Docker (optional, for containerized deployment)

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build

```bash
# Build for production
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
# Preview production build locally
npm run preview
```

## Docker Deployment

### Using Docker Compose (Recommended)

```bash
# Build and start the container
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the container
docker-compose down
```

Open [http://localhost:8080](http://localhost:8080) in your browser.

### Build Docker Image Manually

```bash
# Build the image
docker build -t banner-masonry .

# Run the container
docker run -p 8080:80 banner-masonry
```

### Pull from GitHub Container Registry

```bash
# Pull the latest image
docker pull ghcr.io/[your-username]/banner-masonry:latest

# Run the container
docker run -p 8080:80 ghcr.io/[your-username]/banner-masonry:latest
```

Replace `[your-username]` with your GitHub username.

### CI/CD

The project includes a GitHub Actions workflow that automatically:
- Builds a Docker image on every push to `main`
- Pushes the image to GitHub Container Registry (GHCR)
- Tags images with branch name, commit SHA, and `latest`

The workflow runs automatically when changes are pushed (ignoring markdown and license files).

## How It Works

1. **Upload Images**: Drag and drop or click to select images (supports JPG, PNG, WebP, any size)
2. **Automatic Processing**: Images are compressed using Web Workers to maintain UI responsiveness
3. **Preview in Grid**: Browse your images in a beautiful responsive masonry grid
4. **Configure Banner**: Set banner dimensions, DPI, and quality
5. **Generate & Download**: Create a single banner with all images arranged in masonry layout

## Image Processing Details

- **Thumbnail**: Max 300px, JPEG quality 0.8 (for UI preview)
- **Display**: Max 1200px, JPEG quality 0.9 (for grid preview)
- **Banner**: All images composited into single image at configured dimensions (default: 3000×2000px, quality 0.9)

All processing uses Web Workers to prevent blocking the main thread, ensuring smooth performance even with large images.

## Technical Limitations

- **Canvas Size**: Maximum banner dimension is 16,000px (browser limitation)
- **Memory**: Very large banners may cause browser memory issues
- **Recommended**: Keep banner dimensions under 10,000px for best performance

## Browser Support

Works in all modern browsers that support:
- Web Workers
- Canvas API
- File API
- ES2015+

## License

MIT
