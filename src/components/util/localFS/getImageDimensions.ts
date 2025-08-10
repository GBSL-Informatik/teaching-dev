interface ImageDimensions {
    width: number;
    height: number;
    scale: number;
}

const getImageDimensions = (file: File, maxWidth: number = -1): Promise<ImageDimensions> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const dimensions = { width: img.width, height: img.height, scale: 1 };
            URL.revokeObjectURL(img.src);
            if (maxWidth > 0 && dimensions.width > maxWidth) {
                const scaleFactor = maxWidth / dimensions.width;
                dimensions.width = maxWidth;
                dimensions.height = dimensions.height * scaleFactor;
                dimensions.scale = scaleFactor;
            }
            resolve(dimensions);
        };
        img.onerror = (error) => {
            try {
                URL.revokeObjectURL(img.src);
            } catch (e) {
                // Ignore errors from revoking the object URL
            }
            reject(error);
        };
        img.src = URL.createObjectURL(file);
    });
};
export default getImageDimensions;
