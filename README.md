# PDF Image Remover

A client-side web application that removes raster images from PDF files while preserving text and vector graphics. This tool runs entirely in your browser - no files are uploaded to any server.

## Features

- **Pure Client-Side Processing**: All PDF processing happens in your browser
- **Drag & Drop Interface**: Easy file upload with drag-and-drop support
- **Batch Processing**: Handle single files or multiple PDFs at once
- **Progress Tracking**: Real-time progress updates for each file
- **Smart Downloads**: Single file download or ZIP archive for multiple files
- **Responsive Design**: Works on desktop and mobile devices

## How It Works

1. **Upload PDFs**: Drag and drop or browse to select PDF files
2. **Process Files**: The app analyzes each PDF and removes raster images
3. **Download Results**: Get processed files as `filename-noimage.pdf`
4. **Batch Downloads**: Multiple files are automatically packaged in a ZIP

## Live Demo

Visit the live application: [Your GitHub Pages URL here]

## Local Development

1. Clone this repository
2. Serve the files using any static web server:
   ```bash
   # Using Python
   python -m http.server 5000
   
   # Using Node.js
   npx serve .
   ```
3. Open `http://localhost:5000` in your browser

## GitHub Pages Deployment

This application is designed to work perfectly with GitHub Pages:

1. Push this repository to GitHub
2. Go to repository Settings → Pages
3. Select "Deploy from a branch" and choose `main` branch
4. Your app will be available at `https://yourusername.github.io/repository-name`

## Technical Details

- **Frontend**: Pure HTML, CSS, and JavaScript
- **PDF Processing**: Mozilla PDF.js library
- **File Handling**: JSZip for multiple file downloads
- **No Backend Required**: Completely client-side application

## Browser Compatibility

Works in all modern browsers that support:
- File API
- Web Workers
- ES6+ JavaScript features

## Privacy

This application processes all files locally in your browser. No data is transmitted to any external servers, ensuring complete privacy of your documents.

## License

MIT License - Feel free to use and modify as needed.