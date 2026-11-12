import imageCompression from 'browser-image-compression';
export const withPreviewPRName = (name: string) => {
    return name.replace('[skip ci]', '').replace('[skip netlify]', '').trim();
};

export const withoutPreviewPRName = (name: string) => {
    return `[skip ci] ${withPreviewPRName(name)}`;
};

export const isAudio = (fileName: string) => {
    return /(mp3|wav|ogg|m4a|wma|aac|flac|alac|aiff|opus|mid|midi)$/i.test(fileName);
};

export const isImage = (fileName: string) => {
    return /(jpg|jpeg|png|gif|bmp|webp|svg|avif|tiff|ico|heic|heif)$/i.test(fileName);
};

export const isVideo = (fileName: string) => {
    return /(mp4|mov|avi|wmv|flv|mkv|webm|m4v|mpg|mpeg)$/i.test(fileName);
};

export const isApplication = (fileName: string) => {
    return /(exe|zip|rar|7z|tar|gz|bin|iso|msi|dmg|pkg|deb|rpm|xlsx?|docx?|pptx?|pdf|accdb|mdb|psd|ai|indd)$/i.test(
        fileName
    );
};

export const isBinaryFile = (fileName: string) => {
    return isImage(fileName) || isVideo(fileName) || isApplication(fileName) || isAudio(fileName);
};

export const convertToBase64 = (binData: Uint8Array): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(new Blob([binData as unknown as ArrayBuffer]));
        reader.onload = () => {
            const base64String = (reader.result as string).split(',')[1];
            resolve(base64String);
        };
        reader.onerror = (error) => reject(error);
    });
};

/** a file name git and urls handle well, e.g. `Mein Bild.png` -> `Mein-Bild.png` */
export const sanitizeFileName = (path: string) => {
    return (
        path
            // Map specific umlauts
            .replace(/ä/g, 'ae')
            .replace(/ö/g, 'oe')
            .replace(/ü/g, 'ue')
            .replace(/Ä/g, 'Ae')
            .replace(/Ö/g, 'Oe')
            .replace(/Ü/g, 'Ue')
            .replace(/ß/g, 'ss')
            .replace(/%/g, '')
            // Rest of sanitization...
            .replace(/\s+/g, '-')
            // Remove special characters that Git doesn't handle well
            // Added % to the list of removed characters
            .replace(/[~^:?*[\]\\{}|"<%>]/g, '')
            .replace(/[~^:?*[\]\\{}|"<>]/g, '')
            .replace(/[\x00-\x1F\x7F]/g, '')
            .replace(/^[./]+|[./]+$/g, '')
            .replace(/\.git(\/|$)/g, '')
            .replace(/\/+/g, '/')
            .replace(/(^|\/)@/g, '$1-at-')
    );
};

/** svgs are not compressed: they are vector graphics */
export const isCompressibleImage = (file: File) => {
    return file.type.startsWith('image/') && file.type !== 'image/svg+xml';
};

export const compressImage = (file: File) => {
    return imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 3840, useWebWorker: true });
};
