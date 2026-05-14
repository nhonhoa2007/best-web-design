const DEFAULT_MAX_SOURCE_SIZE = 20 * 1024 * 1024;
const DEFAULT_MAX_OUTPUT_SIZE = 4.5 * 1024 * 1024;
const DEFAULT_MAX_WIDTH = 1600;
const DEFAULT_MAX_HEIGHT = 1600;
const DEFAULT_QUALITY = 0.82;
const LONG_CACHE_CONTROL = "public,max-age=31536000,immutable";

export { DEFAULT_MAX_SOURCE_SIZE, LONG_CACHE_CONTROL };

export async function optimizeImageForUpload(file, options = {}) {
    const {
        maxWidth = DEFAULT_MAX_WIDTH,
        maxHeight = DEFAULT_MAX_HEIGHT,
        quality = DEFAULT_QUALITY,
        maxOutputSize = DEFAULT_MAX_OUTPUT_SIZE
    } = options;

    const image = await loadImage(file);
    const { width, height } = getTargetSize(image.width, image.height, maxWidth, maxHeight);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d", { alpha: true });
    if (!context) {
        throw new Error("Canvas is not available for image optimization.");
    }

    context.drawImage(image, 0, 0, width, height);

    const blob = await createOptimizedBlob(canvas, quality, maxOutputSize);
    if (!blob || blob.size > maxOutputSize) {
        throw new Error("Optimized image is still too large.");
    }

    return new File([blob], getOptimizedFileName(file.name, blob.type), {
        type: blob.type,
        lastModified: Date.now()
    });
}

function loadImage(file) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        const url = URL.createObjectURL(file);

        image.onload = () => {
            URL.revokeObjectURL(url);
            resolve(image);
        };

        image.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error("Could not read the selected image."));
        };

        image.decoding = "async";
        image.src = url;
    });
}

function getTargetSize(sourceWidth, sourceHeight, maxWidth, maxHeight) {
    const ratio = Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight, 1);

    return {
        width: Math.max(1, Math.round(sourceWidth * ratio)),
        height: Math.max(1, Math.round(sourceHeight * ratio))
    };
}

async function createOptimizedBlob(canvas, quality, maxOutputSize) {
    const qualitySteps = [quality, 0.74, 0.66, 0.58];

    for (const step of qualitySteps) {
        const webpBlob = await canvasToBlob(canvas, "image/webp", step);
        if (webpBlob?.type === "image/webp" && webpBlob.size <= maxOutputSize) {
            return webpBlob;
        }
    }

    for (const step of qualitySteps) {
        const jpegBlob = await canvasToBlob(canvas, "image/jpeg", step);
        if (jpegBlob && jpegBlob.size <= maxOutputSize) {
            return jpegBlob;
        }
    }

    return null;
}

function canvasToBlob(canvas, type, quality) {
    return new Promise((resolve) => {
        canvas.toBlob(resolve, type, quality);
    });
}

function getOptimizedFileName(fileName, mimeType) {
    const baseName = fileName.replace(/\.[^.]+$/, "").replace(/[^\w.-]/g, "_") || "image";
    const extension = mimeType === "image/webp" ? "webp" : "jpg";
    return `${baseName}.${extension}`;
}
