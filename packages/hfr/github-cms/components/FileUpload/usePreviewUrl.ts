import React from 'react';

/** an object url to preview the image, it is revoked when the file changes */
export const usePreviewUrl = (file: File) => {
    const [previewUrl, setPreviewUrl] = React.useState<string>();
    React.useEffect(() => {
        if (!file.type.startsWith('image/')) {
            setPreviewUrl(undefined);
            return;
        }
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);
    return previewUrl;
};
