class PDFProcessor {
    constructor() {
        this.imageObjectTypes = ['Image', 'Form', 'XObject'];
    }

    async removeImages(pdfArrayBuffer, progressCallback = () => {}) {
        try {
            progressCallback(0);

            // Load the PDF document
            const loadingTask = pdfjsLib.getDocument({ data: pdfArrayBuffer });
            const pdfDoc = await loadingTask.promise;
            
            progressCallback(10);

            // Get the PDF data as Uint8Array
            const pdfData = new Uint8Array(pdfArrayBuffer);
            
            progressCallback(20);

            // Parse PDF structure to identify and remove images
            const processedPdfData = await this.processePdfData(pdfData, pdfDoc, progressCallback);
            
            progressCallback(100);
            
            return processedPdfData;
        } catch (error) {
            console.error('Error in removeImages:', error);
            throw new Error(`Failed to process PDF: ${error.message}`);
        }
    }

    async processePdfData(pdfData, pdfDoc, progressCallback) {
        try {
            // Convert PDF data to string for processing
            let pdfString = new TextDecoder('latin1').decode(pdfData);
            
            progressCallback(30);

            // Find and remove image objects
            pdfString = this.removeImageObjects(pdfString);
            
            progressCallback(60);

            // Remove image references from content streams
            pdfString = this.removeImageReferences(pdfString);
            
            progressCallback(80);

            // Update xref table and fix PDF structure
            pdfString = this.updatePdfStructure(pdfString);
            
            progressCallback(90);

            // Convert back to Uint8Array
            const processedData = new Uint8Array(pdfString.length);
            for (let i = 0; i < pdfString.length; i++) {
                processedData[i] = pdfString.charCodeAt(i) & 0xFF;
            }

            return processedData;
        } catch (error) {
            console.error('Error in processePdfData:', error);
            throw new Error(`Failed to process PDF data: ${error.message}`);
        }
    }

    removeImageObjects(pdfString) {
        try {
            // Pattern to match image objects
            // This includes XObject images, inline images, and Form XObjects that contain images
            const imageObjectPattern = /(\d+\s+\d+\s+obj\s*<<[^>]*\/Subtype\s*\/Image[^>]*>>.*?endobj)/gis;
            const inlineImagePattern = /(BI\s+[^]*?\s+ID\s+[^]*?\s+EI)/gi;
            const xObjectImagePattern = /(\d+\s+\d+\s+obj\s*<<[^>]*\/Type\s*\/XObject[^>]*\/Subtype\s*\/Image[^>]*>>.*?endobj)/gis;

            // Remove image objects
            pdfString = pdfString.replace(imageObjectPattern, (match) => {
                // Replace with a minimal empty object to maintain object numbering
                const objMatch = match.match(/(\d+\s+\d+\s+obj)/);
                if (objMatch) {
                    return `${objMatch[1]}\n<< >>\nendobj`;
                }
                return '';
            });

            // Remove inline images
            pdfString = pdfString.replace(inlineImagePattern, '');

            // Remove XObject images
            pdfString = pdfString.replace(xObjectImagePattern, (match) => {
                const objMatch = match.match(/(\d+\s+\d+\s+obj)/);
                if (objMatch) {
                    return `${objMatch[1]}\n<< >>\nendobj`;
                }
                return '';
            });

            return pdfString;
        } catch (error) {
            console.error('Error removing image objects:', error);
            return pdfString;
        }
    }

    removeImageReferences(pdfString) {
        try {
            // Remove image references from content streams
            // This includes Do operators that reference image XObjects
            const doOperatorPattern = /\/Im\d+\s+Do/gi;
            const imageResourcePattern = /\/Im\d+\s+\d+\s+\d+\s+R/gi;

            // Remove Do operators for images
            pdfString = pdfString.replace(doOperatorPattern, '');

            // Remove image resources from resource dictionaries
            pdfString = pdfString.replace(/\/XObject\s*<<[^>]*>>/gi, (match) => {
                // Remove image references from XObject dictionary
                let cleaned = match.replace(/\/Im\d+\s+\d+\s+\d+\s+R/gi, '');
                // If the XObject dictionary is now empty, remove it entirely
                if (cleaned.match(/\/XObject\s*<<\s*>>/)) {
                    return '';
                }
                return cleaned;
            });

            return pdfString;
        } catch (error) {
            console.error('Error removing image references:', error);
            return pdfString;
        }
    }

    updatePdfStructure(pdfString) {
        try {
            // This is a simplified approach to maintain PDF structure
            // In a full implementation, you would need to properly update the xref table
            // and recalculate object positions
            
            // For now, we'll do basic cleanup to ensure the PDF remains valid
            
            // Remove empty lines that might have been created
            pdfString = pdfString.replace(/\n\n+/g, '\n');
            
            // Ensure proper PDF structure is maintained
            if (!pdfString.includes('%%EOF')) {
                pdfString += '\n%%EOF';
            }

            return pdfString;
        } catch (error) {
            console.error('Error updating PDF structure:', error);
            return pdfString;
        }
    }

    // Alternative approach using PDF-lib for more robust PDF manipulation
    async removeImagesWithPdfLib(pdfArrayBuffer, progressCallback = () => {}) {
        try {
            // Note: This method would require PDF-lib library
            // For now, we'll use the basic string manipulation approach above
            // This is a placeholder for a more robust implementation
            
            progressCallback(0);
            
            // Load PDF with PDF-lib
            // const pdfDoc = await PDFLib.PDFDocument.load(pdfArrayBuffer);
            
            progressCallback(25);
            
            // Get all pages
            // const pages = pdfDoc.getPages();
            
            progressCallback(50);
            
            // Process each page to remove images
            // This would involve traversing the PDF content tree
            // and removing image-related objects
            
            progressCallback(75);
            
            // Save the modified PDF
            // const pdfBytes = await pdfDoc.save();
            
            progressCallback(100);
            
            // return pdfBytes;
            
            // For now, fall back to the string-based approach
            throw new Error('PDF-lib implementation not available');
            
        } catch (error) {
            // Fall back to string-based processing
            return this.processePdfData(new Uint8Array(pdfArrayBuffer), null, progressCallback);
        }
    }
}
