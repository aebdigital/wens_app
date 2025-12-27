/**
 * Image compression utility for web uploads
 * Compresses regular image formats (JPEG, PNG, WebP, GIF, BMP)
 * Leaves professional formats (CAD, PDF, TIFF, RAW, etc.) untouched
 */

// File extensions that should NOT be compressed (professional/CAD formats)
const SKIP_COMPRESSION_EXTENSIONS = [
  // CAD formats
  'dwg', 'dxf', 'dwf', 'dgn', 'stl', 'step', 'stp', 'iges', 'igs',
  // 3D formats
  'obj', 'fbx', '3ds', 'blend', 'skp', 'max',
  // Document formats
  'pdf', 'ai', 'eps', 'ps', 'svg',
  // RAW image formats (photographers need original quality)
  'raw', 'cr2', 'cr3', 'nef', 'arw', 'orf', 'rw2', 'dng', 'raf',
  // High-quality formats that shouldn't be recompressed
  'tiff', 'tif', 'psd', 'psb', 'xcf',
  // Archive formats
  'zip', 'rar', '7z', 'tar', 'gz',
];

// Image formats that CAN be compressed
const COMPRESSIBLE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/bmp',
];

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1 for JPEG/WebP quality
  outputFormat?: 'image/jpeg' | 'image/webp' | 'image/png';
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.8,
  outputFormat: 'image/jpeg',
};

/**
 * Check if a file should be compressed based on its extension and MIME type
 */
export const shouldCompressFile = (file: File): boolean => {
  // Check extension
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  if (SKIP_COMPRESSION_EXTENSIONS.includes(extension)) {
    return false;
  }

  // Check MIME type
  if (!COMPRESSIBLE_MIME_TYPES.includes(file.type.toLowerCase())) {
    return false;
  }

  return true;
};

/**
 * Compress an image file using Canvas API
 * Returns the compressed file, or the original if compression isn't applicable
 */
export const compressImage = async (
  file: File,
  options: CompressionOptions = {}
): Promise<File> => {
  // Merge with defaults
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Check if file should be compressed
  if (!shouldCompressFile(file)) {
    console.log(`Skipping compression for ${file.name} (not a compressible format)`);
    return file;
  }

  // Skip if file is already small (< 100KB)
  if (file.size < 100 * 1024) {
    console.log(`Skipping compression for ${file.name} (already small: ${(file.size / 1024).toFixed(1)}KB)`);
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      console.error('Failed to get canvas context');
      resolve(file); // Return original on error
      return;
    }

    img.onload = () => {
      try {
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img;
        const maxW = opts.maxWidth!;
        const maxH = opts.maxHeight!;

        if (width > maxW || height > maxH) {
          const ratio = Math.min(maxW / width, maxH / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        // Set canvas size
        canvas.width = width;
        canvas.height = height;

        // Draw image with white background (for PNG transparency)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob
        const outputFormat = opts.outputFormat!;
        const quality = opts.quality!;

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              console.error('Failed to create blob');
              resolve(file);
              return;
            }

            // Determine new filename
            const originalName = file.name;
            const baseName = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
            const newExtension = outputFormat === 'image/jpeg' ? 'jpg' :
                                 outputFormat === 'image/webp' ? 'webp' : 'png';
            const newName = `${baseName}.${newExtension}`;

            // Create new File object
            const compressedFile = new File([blob], newName, {
              type: outputFormat,
              lastModified: Date.now(),
            });

            // Log compression results
            const originalSize = file.size / 1024;
            const compressedSize = compressedFile.size / 1024;
            const savings = ((1 - compressedSize / originalSize) * 100).toFixed(1);
            console.log(
              `Compressed ${file.name}: ${originalSize.toFixed(1)}KB → ${compressedSize.toFixed(1)}KB (${savings}% smaller)`
            );

            // Only use compressed version if it's actually smaller
            if (compressedFile.size < file.size) {
              resolve(compressedFile);
            } else {
              console.log(`Keeping original (compressed version was larger)`);
              resolve(file);
            }
          },
          outputFormat,
          quality
        );
      } catch (error) {
        console.error('Compression error:', error);
        resolve(file); // Return original on error
      }
    };

    img.onerror = () => {
      console.error('Failed to load image for compression');
      resolve(file); // Return original on error
    };

    // Load image from file
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      console.error('Failed to read file');
      resolve(file);
    };
    reader.readAsDataURL(file);
  });
};

/**
 * Compress multiple images in parallel
 */
export const compressImages = async (
  files: File[],
  options: CompressionOptions = {}
): Promise<File[]> => {
  return Promise.all(files.map((file) => compressImage(file, options)));
};
