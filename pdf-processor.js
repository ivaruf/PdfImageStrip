class PDFProcessor {
    constructor() {
        this.PDFLib = window.PDFLib;
    }

    async removeImages(pdfArrayBuffer, progressCallback = () => {}) {
        try {
            progressCallback(0);

            // Load PDF with PDF-lib
            const pdfDoc = await this.PDFLib.PDFDocument.load(pdfArrayBuffer);
            progressCallback(20);

            // Get all pages
            const pages = pdfDoc.getPages();
            progressCallback(30);

            // Process each page to remove images
            for (let i = 0; i < pages.length; i++) {
                const page = pages[i];
                await this.removeImagesFromPage(page);
                progressCallback(30 + (50 * (i + 1) / pages.length));
            }

            // Save the modified PDF  
            const pdfBytes = await pdfDoc.save();
            progressCallback(100);
            
            return pdfBytes;
        } catch (error) {
            console.error('Error in removeImages:', error);
            throw new Error(`Failed to process PDF: ${error.message}`);
        }
    }

    async removeImagesFromPage(page) {
        try {
            // Get the page's content stream
            const { Contents } = page.node;
            
            if (!Contents) return;

            // Create new content without image operations
            const cleanedContent = await this.processContentStream(page);
            
            // Update the page with cleaned content
            if (cleanedContent) {
                // Remove XObject resources that are images
                const resources = page.node.Resources;
                if (resources && resources.XObject) {
                    const xObjects = resources.XObject;
                    const cleanedXObjects = {};
                    
                    // Only keep non-image XObjects
                    for (const [key, obj] of Object.entries(xObjects)) {
                        if (obj && obj.Subtype && obj.Subtype !== 'Image') {
                            cleanedXObjects[key] = obj;
                        }
                    }
                    
                    if (Object.keys(cleanedXObjects).length > 0) {
                        resources.XObject = cleanedXObjects;
                    } else {
                        delete resources.XObject;
                    }
                }
            }
        } catch (error) {
            console.warn('Error processing page:', error);
        }
    }

    async processContentStream(page) {
        try {
            // Get the raw content stream
            const contentStream = page.getContentStream();
            if (!contentStream) return null;

            // Convert to string for processing
            let content = new TextDecoder().decode(contentStream);
            
            // Remove image-related operators
            // Remove Do operators (which draw XObjects including images)
            content = content.replace(/\/Im\w*\s+Do/g, '');
            
            // Remove inline image operators (BI...ID...EI blocks)
            content = content.replace(/BI\s+[^]*?\s+ID\s+[^]*?\s+EI/g, '');
            
            // Clean up extra whitespace
            content = content.replace(/\s+/g, ' ').trim();
            
            // Update the page content
            const newContentStream = new TextEncoder().encode(content);
            page.setContentStream(newContentStream);
            
            return content;
        } catch (error) {
            console.warn('Error processing content stream:', error);
            return null;
        }
    }
}
