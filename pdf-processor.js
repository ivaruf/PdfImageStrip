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
            // Remove XObject Image objects only if they're large enough
            pdfString = pdfString.replace(/(\d+\s+\d+\s+obj\s*<<[^>]*\/Type\s*\/XObject[^>]*\/Subtype\s*\/Image[^>]*>>.*?endobj)/gis, (match) => {
                if (this.isLargeImage(match)) {
                    const objMatch = match.match(/(\d+\s+\d+\s+obj)/);
                    if (objMatch) {
                        return `${objMatch[1]}\n<<>>\nendobj`;
                    }
                }
                return match; // Keep small images
            });

            // Remove standalone Image objects only if they're large enough
            pdfString = pdfString.replace(/(\d+\s+\d+\s+obj\s*<<[^>]*\/Subtype\s*\/Image[^>]*>>.*?endobj)/gis, (match) => {
                if (this.isLargeImage(match)) {
                    const objMatch = match.match(/(\d+\s+\d+\s+obj)/);
                    if (objMatch) {
                        return `${objMatch[1]}\n<<>>\nendobj`;
                    }
                }
                return match; // Keep small images
            });

            return pdfString;
        } catch (error) {
            console.warn('Error removing image objects:', error);
            return pdfString;
        }
    }

    isLargeImage(imageObjectString) {
        try {
            // Extract width and height from the image object
            const widthMatch = imageObjectString.match(/\/Width\s+(\d+)/i);
            const heightMatch = imageObjectString.match(/\/Height\s+(\d+)/i);
            
            if (widthMatch && heightMatch) {
                const width = parseInt(widthMatch[1]);
                const height = parseInt(heightMatch[1]);
                
                // Only remove images larger than 100x100 pixels
                return width > 100 && height > 100;
            }
            
            // If we can't determine size, assume it's large to be safe
            return true;
        } catch (error) {
            return true; // Default to removing if we can't determine size
        }
    }

    removeImageReferences(pdfString) {
        try {
            // Remove inline images (BI...ID...EI blocks) only if they seem large
            pdfString = pdfString.replace(/BI\s+[^]*?\s+ID\s+[^]*?\s+EI/gis, (match) => {
                // Check if this is a large inline image by looking for width/height indicators
                if (this.isLargeInlineImage(match)) {
                    return 'q 1 1 1 rg 0 0 100 100 re f Q';
                }
                return match; // Keep small inline images
            });
            
            // Replace Do operators for large images with white rectangles, keep small ones
            pdfString = pdfString.replace(/(q\s+[^Q]*?)\/I\w*\s+Do(\s*[^Q]*?Q)/g, (match, before, after) => {
                if (this.isLargeImageReference(match)) {
                    return before + ' 1 1 1 rg 0 0 100 100 re f ' + after;
                }
                return match;
            });
            
            pdfString = pdfString.replace(/(q\s+[^Q]*?)\/Im\w*\s+Do(\s*[^Q]*?Q)/g, (match, before, after) => {
                if (this.isLargeImageReference(match)) {
                    return before + ' 1 1 1 rg 0 0 100 100 re f ' + after;
                }
                return match;
            });
            
            // For standalone Do operators, be more selective
            pdfString = pdfString.replace(/\/I\w*\s+Do\s*/g, (match) => {
                if (this.isLargeImageReference(match)) {
                    return 'q 1 1 1 rg 0 0 100 100 re f Q ';
                }
                return match;
            });
            
            pdfString = pdfString.replace(/\/Im\w*\s+Do\s*/g, (match) => {
                if (this.isLargeImageReference(match)) {
                    return 'q 1 1 1 rg 0 0 100 100 re f Q ';
                }
                return match;
            });
            
            // Replace black rectangles with white ones
            pdfString = this.replaceBlackRectangles(pdfString);
            
            // Remove XObject dictionaries containing only large images
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

    isLargeInlineImage(inlineImageString) {
        try {
            // Look for width and height in the BI dictionary
            const widthMatch = inlineImageString.match(/\/W\s+(\d+)/i);
            const heightMatch = inlineImageString.match(/\/H\s+(\d+)/i);
            
            if (widthMatch && heightMatch) {
                const width = parseInt(widthMatch[1]);
                const height = parseInt(heightMatch[1]);
                return width > 100 && height > 100;
            }
            
            // If no size info, check the data size - large data likely means large image
            const dataMatch = inlineImageString.match(/ID\s+([^]*?)\s+EI/);
            if (dataMatch && dataMatch[1].length > 1000) {
                return true; // Large data suggests large image
            }
            
            return false; // Default to keeping if unsure
        } catch (error) {
            return false;
        }
    }

    isLargeImageReference(imageRefString) {
        // For image references, we'll be conservative and assume they might be large
        // This is harder to determine without the actual image object
        // We could enhance this by tracking image names and their sizes
        return imageRefString.includes('/Im') || imageRefString.includes('/Image');
    }

    replaceBlackRectangles(pdfString) {
        try {
            // Replace black fill operations with white fill
            // Pattern: 0 0 0 rg (black RGB) followed by rectangle operations
            pdfString = pdfString.replace(/0\s+0\s+0\s+rg\s+([^Q]*?re\s+f)/g, '1 1 1 rg $1');
            
            // Replace black fill in RG (stroke) operations too
            pdfString = pdfString.replace(/0\s+0\s+0\s+RG\s+([^Q]*?re\s+[fFS])/g, '1 1 1 RG $1');
            
            // Replace CMYK black (0 0 0 1 k) with white (0 0 0 0 k)
            pdfString = pdfString.replace(/0\s+0\s+0\s+1\s+k\s+([^Q]*?re\s+f)/g, '0 0 0 0 k $1');
            
            // Replace gray black (0 g) with white (1 g)
            pdfString = pdfString.replace(/0\s+g\s+([^Q]*?re\s+f)/g, '1 g $1');
            
            return pdfString;
        } catch (error) {
            console.warn('Error replacing black rectangles:', error);
            return pdfString;
        }
    }
}
