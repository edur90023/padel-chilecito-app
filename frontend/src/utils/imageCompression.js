// Comprime y redimensiona imágenes en el navegador antes de subirlas para ahorrar espacio en Cloudinary

export const formatFileSize = (bytes) => {
    if (!bytes || bytes <= 0) return '0 KB';
    if (bytes < 1024 * 1024) {
        return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const canvasToBlobAsync = (canvas, mimeType, quality) => {
    return new Promise((resolve) => {
        try {
            canvas.toBlob((blob) => resolve(blob), mimeType, quality);
        } catch {
            resolve(null);
        }
    });
};

export const compressImageFile = (
    file,
    { maxDimension = 1280, quality = 0.78, skipBelowBytes = 120 * 1024 } = {}
) => {
    return new Promise((resolve) => {
        if (!file || !file.type?.startsWith('image/') || file.type === 'image/gif') {
            return resolve(file);
        }
        if (file.size <= skipBelowBytes) {
            return resolve(file);
        }

        const objectUrl = URL.createObjectURL(file);
        const img = new Image();

        img.onload = async () => {
            URL.revokeObjectURL(objectUrl);
            try {
                let { width, height } = img;
                if (width > maxDimension || height > maxDimension) {
                    if (width >= height) {
                        height = Math.round((height * maxDimension) / width);
                        width = maxDimension;
                    } else {
                        width = Math.round((width * maxDimension) / height);
                        height = maxDimension;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) return resolve(file);

                ctx.drawImage(img, 0, 0, width, height);

                // Preferir WebP (ocupa ~30% menos que JPG con igual nitidez), con respaldo JPEG
                let blob = await canvasToBlobAsync(canvas, 'image/webp', quality);
                let outExt = 'webp';
                let outType = 'image/webp';

                if (!blob || blob.type !== 'image/webp') {
                    blob = await canvasToBlobAsync(canvas, 'image/jpeg', quality);
                    outExt = 'jpg';
                    outType = 'image/jpeg';
                }

                if (!blob || blob.size >= file.size) {
                    return resolve(file);
                }

                const baseName = (file.name || 'imagen').replace(/\.[^/.]+$/, '');
                const optimized = new File([blob], `${baseName}.${outExt}`, {
                    type: outType,
                    lastModified: Date.now()
                });
                resolve(optimized);
            } catch {
                resolve(file);
            }
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            resolve(file);
        };

        img.src = objectUrl;
    });
};
