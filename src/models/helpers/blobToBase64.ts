const blobToBase64 = (blob: Blob, contentOnly?: boolean) => {
    const fileReader = new FileReader();

    const promise = new Promise<string>((resolve, reject) => {
        fileReader.addEventListener(
            'load',
            () => {
                const base64Data = fileReader.result?.toString();
                if (!base64Data) {
                    reject('could not convert file to base64');
                } else {
                    if (contentOnly) {
                        const base64Content = base64Data.split(',')[1];
                        resolve(base64Content);
                    } else {
                        resolve(base64Data);
                    }
                }
            },
            false
        );
    });
    fileReader.readAsDataURL(blob);
    return promise;
};

export default blobToBase64;
