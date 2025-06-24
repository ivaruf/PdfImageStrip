class PDFProcessor {
    constructor() {
        this.PDFLib = window.PDFLib;
    }

    async removeImages(pdfArrayBuffer, progressCallback = () => {}) {
        try {
            progressCallback(0);

            // Convert ArrayBuffer to Uint8Array for string processing
            const pdfData = new Uint8Array(pdfArrayBuffer);
            let pdfString = '';
            
            // Convert to binary string
            for (let i = 0; i < pdfData.length; i++) {
                pdfString += String.fromCharCode(pdfData[i]);
            }
            
            progressCallback(20);

            // Remove image objects and references using string manipulation
            pdfString = this.removeImageObjects(pdfString);
            progressCallback(50);
            
            pdfString = this.removeImageReferences(pdfString);
            progressCallback(80);
            
            // Convert back to Uint8Array
            const processedData = new Uint8Array(pdfString.length);
            for (let i = 0; i < pdfString.length; i++) {
                processedData[i] = pdfString.charCodeAt(i) & 0xFF;
            }

            progressCallback(90);

            // Validate the result with PDF-lib
            try {
                const testDoc = await this.PDFLib.PDFDocument.load(processedData);
                const validatedBytes = await testDoc.save();
                progressCallback(100);
                return validatedBytes;
            } catch (validationError) {
                console.warn('PDF validation failed, returning processed data:', validationError);
                progressCallback(100);
                return processedData;
            }
            
        } catch (error) {
            console.error('Error in removeImages:', error);
            throw new Error(`Failed to process PDF: ${error.message}`);
        }
    }

    removeImageObjects(pdfString) {
        try {
            // Remove XObject Image objects
            pdfString = pdfString.replace(/(\d+\s+\d+\s+obj\s*<<[^>]*\/Type\s*\/XObject[^>]*\/Subtype\s*\/Image[^>]*>>.*?endobj)/gis, (match) => {
                const objMatch = match.match(/(\d+\s+\d+\s+obj)/);
                if (objMatch) {
                    return `${objMatch[1]}\n<<>>\nendobj`;
                }
                return '';
            });

            // Remove standalone Image objects
            pdfString = pdfString.replace(/(\d+\s+\d+\s+obj\s*<<[^>]*\/Subtype\s*\/Image[^>]*>>.*?endobj)/gis, (match) => {
                const objMatch = match.match(/(\d+\s+\d+\s+obj)/);
                if (objMatch) {
                    return `${objMatch[1]}\n<<>>\nendobj`;
                }
                return '';
            });

            return pdfString;
        } catch (error) {
            console.warn('Error removing image objects:', error);
            return pdfString;
        }
    }

    removeImageReferences(pdfString) {
        try {
            // Remove inline images (BI...ID...EI blocks)
            pdfString = pdfString.replace(/BI\s+[^]*?\s+ID\s+[^]*?\s+EI/gis, '');
            
            // Remove Do operators for images (more comprehensive patterns)
            pdfString = pdfString.replace(/\/I\w*\s+Do\s*/g, '');
            pdfString = pdfString.replace(/\/Im\w*\s+Do\s*/g, '');
            pdfString = pdfString.replace(/\/Image\w*\s+Do\s*/g, '');
            
            // Remove q/Q blocks that only contain image operations
            pdfString = pdfString.replace(/q\s*\/I\w*\s+Do\s*Q/g, '');
            pdfString = pdfString.replace(/q\s*\/Im\w*\s+Do\s*Q/g, '');
            
            // Remove XObject dictionaries containing only images
            pdfString = pdfString.replace(/\/XObject\s*<<[^>]*>>/gi, (match) => {
                let cleaned = match.replace(/\/I\w*\s+\d+\s+\d+\s+R/g, '');
                cleaned = cleaned.replace(/\/Im\w*\s+\d+\s+\d+\s+R/g, '');
                cleaned = cleaned.replace(/\/Image\w*\s+\d+\s+\d+\s+R/g, '');
                
                // If XObject dictionary is now empty, remove it entirely
                if (cleaned.match(/\/XObject\s*<<\s*>>/)) {
                    return '';
                }
                return cleaned;
            });

            // Clean up extra whitespace
            pdfString = pdfString.replace(/\n\s*\n/g, '\n');
            
            return pdfString;
        } catch (error) {
            console.warn('Error removing image references:', error);
            return pdfString;
        }
    }
}
