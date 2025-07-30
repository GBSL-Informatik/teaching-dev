interface ImageDimensions {
    width: number;
    height: number;
}

const getImageDimensions = (file: File): Promise<ImageDimensions> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const dimensions = { width: img.width, height: img.height };
            URL.revokeObjectURL(img.src);
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
