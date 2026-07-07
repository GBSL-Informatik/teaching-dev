const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target && event.target.result) {
                resolve(event.target.result as string);
            } else {
                reject(new Error('Failed to read file as Data URL.'));
            }
        };
        reader.onerror = (error) => reject(error);
        reader.onabort = () => reject(new Error('File reading aborted.'));
        reader.readAsDataURL(file);
    });
};
export default fileToDataUrl;
