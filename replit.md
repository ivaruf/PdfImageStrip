# PDF Image Remover

## Overview

This is a client-side web application that removes raster images from PDF files while preserving text and vector graphics. The application is built using vanilla HTML, CSS, and JavaScript with PDF.js for PDF manipulation. It features a drag-and-drop interface for file uploads, real-time progress tracking, and batch processing capabilities.

## System Architecture

### Frontend Architecture
- **Pure Client-Side Application**: No backend server required for PDF processing
- **Single Page Application (SPA)**: All functionality contained in one HTML page
- **Modular JavaScript**: Separated into distinct classes for better organization
  - `PDFImageRemoverApp`: Main application controller
  - `PDFProcessor`: Core PDF manipulation logic

### File Structure
```
/
├── index.html          # Main application interface
├── style.css          # Application styling
├── script.js          # Main application logic
├── pdf-processor.js   # PDF processing utilities
└── .replit           # Replit configuration
```

## Key Components

### 1. User Interface Layer
- **Upload Interface**: Drag-and-drop area with file browser fallback
- **File Management**: List view of selected files with individual controls
- **Progress Tracking**: Real-time progress bars for individual files and overall batch
- **Results Display**: Summary of processed files with download options

### 2. PDF Processing Engine
- **PDF.js Integration**: Uses Mozilla's PDF.js library for PDF parsing
- **Image Detection**: Identifies raster image objects in PDF structure
- **Content Stream Processing**: Removes image references while preserving text and vectors
- **PDF Reconstruction**: Rebuilds PDF structure after image removal

### 3. File Handling System
- **Multi-file Support**: Batch processing of multiple PDF files
- **Progress Callbacks**: Real-time progress updates during processing
- **Error Handling**: Comprehensive error reporting and recovery

## Data Flow

1. **File Selection**: User selects PDF files via drag-and-drop or file browser
2. **File Validation**: Application validates file types and sizes
3. **Processing Queue**: Files are queued for sequential processing
4. **PDF Analysis**: Each PDF is parsed to identify image objects
5. **Image Removal**: Raster images are removed while preserving other content
6. **PDF Reconstruction**: Modified PDF structure is rebuilt
7. **Download Generation**: Processed files are made available for download

## External Dependencies

### JavaScript Libraries
- **PDF.js**: Mozilla's PDF rendering and manipulation library
- **Font Awesome**: Icon library for UI elements

### CDN Resources
- Font Awesome CSS: `https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css`
- PDF.js will be loaded dynamically (implementation pending)

## Deployment Strategy

### Current Setup
- **Development Server**: Python HTTP server on port 5000
- **Static File Serving**: All assets served as static files
- **Client-Side Processing**: No server-side dependencies required

### Production Considerations
- Can be deployed to any static hosting service (GitHub Pages, Netlify, Vercel)
- No backend infrastructure required
- All processing happens in the browser using Web APIs

### Replit Configuration
- **Runtime**: Node.js 20 and Python 3.11 modules
- **Workflow**: Parallel execution with Python HTTP server
- **Port**: Application runs on port 5000

## User Preferences

Preferred communication style: Simple, everyday language.

## Changelog

Changelog:
- June 24, 2025. Initial setup