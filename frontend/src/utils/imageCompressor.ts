/**
 * Calculates the size in KB of a base64 data URL
 * @param dataUrl - The base64 data URL
 * @returns Size in kilobytes
 */
function getBase64SizeKB(dataUrl: string): number {
  // Base64 encoding increases size by ~33%, but we measure the actual string length
  return Math.round((dataUrl.length / 1024) * 100) / 100
}

/**
 * Compresses an image file client-side before upload with size constraint
 * @param file - The image file to compress
 * @param maxWidth - Maximum width of the compressed image (default: 1200px)
 * @param maxHeight - Maximum height of the compressed image (default: 1200px)
 * @param maxSizeKB - Maximum output size in kilobytes (default: 300KB)
 * @returns Promise<string> - Base64 data URL of the compressed image
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1000,
  maxHeight: number = 1000,
  maxSizeKB: number = 300,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (event) => {
      const img = new Image()

      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        // Calculate new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height)
            height = maxHeight
          }
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Could not get canvas context'))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        // Iteratively reduce quality until we're under the size limit
        let quality = 0.8
        let compressedDataUrl = ''

        while (quality > 0.1) {
          compressedDataUrl = canvas.toDataURL('image/jpeg', quality)
          const sizeKB = getBase64SizeKB(compressedDataUrl)

          if (sizeKB <= maxSizeKB) {
            resolve(compressedDataUrl)
            return
          }

          // Reduce quality for next iteration
          quality -= 0.1
        }

        // Last attempt with minimum quality
        compressedDataUrl = canvas.toDataURL('image/jpeg', 0.1)
        resolve(compressedDataUrl)
      }

      img.onerror = () => {
        reject(new Error('Failed to load image'))
      }

      img.src = event.target?.result as string
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsDataURL(file)
  })
}

/**
 * Calculates the compression ratio between original and compressed image
 * @param original - Original base64 string
 * @param compressed - Compressed base64 string
 * @returns Compression ratio as percentage (e.g., 45 means 45% of original size)
 */
export function getCompressionRatio(original: string, compressed: string): number {
  return Math.round((compressed.length / original.length) * 100)
}
