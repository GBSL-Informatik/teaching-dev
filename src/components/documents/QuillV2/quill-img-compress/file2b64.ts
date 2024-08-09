/**
 * by @benwinding
 * https://github.com/benwinding/quill-image-compress/blob/master/src/file2b64.ts
 */
export async function file2b64(file: Blob) {
    const fileReader = new FileReader();
    let toSupported: Promise<Blob>;
    if (file.type.toLowerCase() === 'image/heic' || file.type.toLowerCase() === 'image/heif') {
        toSupported = import('heic2any').then((heic2any) => {
            return heic2any.default({
                blob: file,
                toType: 'image/jpeg',
                quality: 0.8
            }) as Promise<Blob>;
        });
    } else {
        toSupported = Promise.resolve(file);
    }

    if (toSupported) {
        return toSupported.then((img) => {
            const promise = new Promise<string>((resolve, reject) => {
                fileReader.addEventListener(
                    'load',
                    () => {
                        const base64ImageSrc = fileReader.result?.toString();
                        if (!base64ImageSrc) {
                            reject('could not convert file to base64');
                        } else {
                            resolve(base64ImageSrc);
                        }
                    },
                    false
                );
            });
            fileReader.readAsDataURL(img);
            return promise;
        });
    } else {
        return Promise.reject('could not convert file to base64');
    }
}
