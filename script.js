class PDFImageRemoverApp {
    constructor() {
        this.files = [];
        this.processedFiles = [];
        this.isProcessing = false;
        
        this.initializeElements();
        this.bindEvents();
        this.initializePDFJS();
    }

    initializeElements() {
        // Main elements
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.browseBtn = document.getElementById('browseBtn');
        this.fileList = document.getElementById('fileList');
        this.filesContainer = document.getElementById('filesContainer');
        this.processBtn = document.getElementById('processBtn');
        this.clearBtn = document.getElementById('clearBtn');
        
        // Progress elements
        this.progressSection = document.getElementById('progressSection');
        this.overallProgress = document.getElementById('overallProgress');
        this.overallProgressText = document.getElementById('overallProgressText');
        this.fileProgressList = document.getElementById('fileProgressList');
        
        // Results elements
        this.resultsSection = document.getElementById('resultsSection');
        this.resultsSummary = document.getElementById('resultsSummary');
        this.downloadActions = document.getElementById('downloadActions');
        
        // Loading overlay
        this.loadingOverlay = document.getElementById('loadingOverlay');
    }

    bindEvents() {
        // File input events - improved handling
        this.browseBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.fileInput.value = ''; // Clear previous selection
            this.fileInput.click();
        });
        
        this.fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files.length > 0) {
                this.handleFileSelect(e.target.files);
            }
        });
        
        // Drag and drop events
        this.uploadArea.addEventListener('click', (e) => {
            // Only trigger file input if not clicking on the browse button
            if (e.target !== this.browseBtn && !this.browseBtn.contains(e.target)) {
                this.fileInput.value = ''; // Clear previous selection
                this.fileInput.click();
            }
        });
        
        this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
        
        // Action buttons
        this.processBtn.addEventListener('click', () => this.processFiles());
        this.clearBtn.addEventListener('click', () => this.clearFiles());
        
        // Prevent default drag behaviors on document
        document.addEventListener('dragover', (e) => e.preventDefault());
        document.addEventListener('drop', (e) => e.preventDefault());
    }

    async initializePDFJS() {
        try {
            this.loadingOverlay.style.display = 'flex';
            
            // Configure PDF.js
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            
            // Test PDF.js availability
            const testDoc = await pdfjsLib.getDocument({data: new Uint8Array()}).promise.catch(() => null);
            
            this.loadingOverlay.style.display = 'none';
            console.log('PDF.js initialized successfully');
        } catch (error) {
            this.loadingOverlay.style.display = 'none';
            console.error('Failed to initialize PDF.js:', error);
            this.showError('Failed to initialize PDF processing library. Please refresh the page.');
        }
    }

    handleDragOver(e) {
        e.preventDefault();
        this.uploadArea.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
        const files = Array.from(e.dataTransfer.files).filter(file => file.type === 'application/pdf');
        if (files.length > 0) {
            this.handleFileSelect(files);
        } else {
            this.showError('Please drop only PDF files.');
        }
    }

    handleFileSelect(fileList) {
        const pdfFiles = Array.from(fileList).filter(file => file.type === 'application/pdf');
        
        if (pdfFiles.length === 0) {
            this.showError('Please select only PDF files.');
            // Reset the file input to allow re-selection
            setTimeout(() => {
                this.fileInput.value = '';
            }, 100);
            return;
        }

        // Add new files to existing ones
        let newFilesAdded = 0;
        pdfFiles.forEach(file => {
            if (!this.files.some(existingFile => existingFile.name === file.name && existingFile.size === file.size)) {
                this.files.push({
                    file: file,
                    id: this.generateId(),
                    name: file.name,
                    size: file.size,
                    status: 'pending'
                });
                newFilesAdded++;
            }
        });

        if (newFilesAdded > 0) {
            this.updateFileList();
        } else {
            this.showError('These files are already selected.');
        }
        
        // Reset file input to allow re-selection of the same files
        setTimeout(() => {
            this.fileInput.value = '';
        }, 100);
    }

    updateFileList() {
        if (this.files.length === 0) {
            this.fileList.style.display = 'none';
            return;
        }

        this.fileList.style.display = 'block';
        this.filesContainer.innerHTML = '';

        this.files.forEach(fileData => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <div class="file-info">
                    <i class="fas fa-file-pdf file-icon"></i>
                    <div class="file-details">
                        <h4>${this.escapeHtml(fileData.name)}</h4>
                        <p>${this.formatFileSize(fileData.size)}</p>
                    </div>
                </div>
                <div class="file-actions">
                    <button class="btn btn-danger btn-small" onclick="app.removeFile('${fileData.id}')">
                        <i class="fas fa-trash"></i> Remove
                    </button>
                </div>
            `;
            this.filesContainer.appendChild(fileItem);
        });
    }

    removeFile(fileId) {
        this.files = this.files.filter(file => file.id !== fileId);
        this.updateFileList();
    }

    clearFiles() {
        this.files = [];
        this.processedFiles = [];
        this.updateFileList();
        this.hideResults();
    }

    async processFiles() {
        if (this.files.length === 0 || this.isProcessing) {
            return;
        }

        this.isProcessing = true;
        this.processedFiles = [];
        this.showProgress();
        this.hideResults();

        try {
            for (let i = 0; i < this.files.length; i++) {
                const fileData = this.files[i];
                await this.processFile(fileData, i);
                this.updateOverallProgress((i + 1) / this.files.length * 100);
            }

            this.showResults();
        } catch (error) {
            console.error('Processing error:', error);
            this.showError('An error occurred during processing. Please try again.');
        } finally {
            this.isProcessing = false;
        }
    }

    async processFile(fileData, index) {
        try {
            this.updateFileProgress(fileData.id, 'processing', 0);

            // Read file as array buffer and create a copy to prevent detachment
            const originalBuffer = await this.readFileAsArrayBuffer(fileData.file);
            const arrayBuffer = originalBuffer.slice(); // Create a copy
            this.updateFileProgress(fileData.id, 'processing', 20);

            // Process PDF to remove images
            const processor = new PDFProcessor();
            const processedPdfBytes = await processor.removeImages(arrayBuffer, (progress) => {
                this.updateFileProgress(fileData.id, 'processing', 20 + (progress * 0.7));
            });

            this.updateFileProgress(fileData.id, 'processing', 95);

            // Create processed file data
            const originalName = fileData.name.replace(/\.pdf$/i, '');
            const processedName = `${originalName}-noimage.pdf`;
            
            const processedFile = {
                id: fileData.id,
                originalName: fileData.name,
                processedName: processedName,
                data: processedPdfBytes,
                size: processedPdfBytes.length,
                status: 'completed'
            };

            this.processedFiles.push(processedFile);
            this.updateFileProgress(fileData.id, 'completed', 100);

        } catch (error) {
            console.error(`Error processing ${fileData.name}:`, error);
            this.updateFileProgress(fileData.id, 'error', 0);
            
            // Still add to processed files with error status for reporting
            this.processedFiles.push({
                id: fileData.id,
                originalName: fileData.name,
                error: error.message,
                status: 'error'
            });
        }
    }

    showProgress() {
        this.progressSection.style.display = 'block';
        this.fileProgressList.innerHTML = '';

        this.files.forEach(fileData => {
            const progressItem = document.createElement('div');
            progressItem.className = 'file-progress-item';
            progressItem.id = `progress-${fileData.id}`;
            progressItem.innerHTML = `
                <div class="file-name">${this.escapeHtml(fileData.name)}</div>
                <div class="progress-bar">
                    <div class="progress-fill" id="progress-fill-${fileData.id}"></div>
                </div>
                <div class="status processing" id="status-${fileData.id}">Waiting...</div>
            `;
            this.fileProgressList.appendChild(progressItem);
        });
    }

    updateFileProgress(fileId, status, progress) {
        const progressFill = document.getElementById(`progress-fill-${fileId}`);
        const statusElement = document.getElementById(`status-${fileId}`);

        if (progressFill) {
            progressFill.style.width = `${progress}%`;
        }

        if (statusElement) {
            statusElement.className = `status ${status}`;
            switch (status) {
                case 'processing':
                    statusElement.textContent = `${Math.round(progress)}%`;
                    break;
                case 'completed':
                    statusElement.textContent = 'Completed';
                    break;
                case 'error':
                    statusElement.textContent = 'Error';
                    break;
                default:
                    statusElement.textContent = 'Waiting...';
            }
        }
    }

    updateOverallProgress(progress) {
        this.overallProgress.style.width = `${progress}%`;
        this.overallProgressText.textContent = `${Math.round(progress)}%`;
    }

    showResults() {
        const successful = this.processedFiles.filter(file => file.status === 'completed');
        const failed = this.processedFiles.filter(file => file.status === 'error');

        this.resultsSummary.innerHTML = `
            <div class="summary-item">
                <span class="summary-label">Total Files:</span>
                <span class="summary-value">${this.files.length}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Successfully Processed:</span>
                <span class="summary-value">${successful.length}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Failed:</span>
                <span class="summary-value">${failed.length}</span>
            </div>
        `;

        this.downloadActions.innerHTML = '';

        if (successful.length > 0) {
            if (successful.length === 1) {
                // Single file download
                const file = successful[0];
                const downloadBtn = document.createElement('button');
                downloadBtn.className = 'btn btn-download';
                downloadBtn.innerHTML = `<i class="fas fa-download"></i> Download ${file.processedName}`;
                downloadBtn.addEventListener('click', () => this.downloadFile(file));
                this.downloadActions.appendChild(downloadBtn);
            } else {
                // Multiple files - create ZIP
                const zipBtn = document.createElement('button');
                zipBtn.className = 'btn btn-download';
                zipBtn.innerHTML = `<i class="fas fa-file-archive"></i> Download ZIP (${successful.length} files)`;
                zipBtn.addEventListener('click', () => this.downloadZip(successful));
                this.downloadActions.appendChild(zipBtn);

                // Individual download buttons
                successful.forEach(file => {
                    const downloadBtn = document.createElement('button');
                    downloadBtn.className = 'btn btn-download';
                    downloadBtn.innerHTML = `<i class="fas fa-download"></i> ${file.processedName}`;
                    downloadBtn.addEventListener('click', () => this.downloadFile(file));
                    this.downloadActions.appendChild(downloadBtn);
                });
            }
        }

        this.resultsSection.style.display = 'block';
    }

    hideResults() {
        this.resultsSection.style.display = 'none';
    }

    downloadFile(file) {
        const blob = new Blob([file.data], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.processedName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    async downloadZip(files) {
        try {
            const zip = new JSZip();

            files.forEach(file => {
                zip.file(file.processedName, file.data);
            });

            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(zipBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'processed-pdfs.zip';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error creating ZIP:', error);
            this.showError('Failed to create ZIP file.');
        }
    }

    readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsArrayBuffer(file);
        });
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showError(message) {
        alert(message); // Simple error display - could be enhanced with a modal
    }
}

// Initialize the application
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new PDFImageRemoverApp();
});
