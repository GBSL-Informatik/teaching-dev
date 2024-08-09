interface Config {
    fileTypes: {
        regex: RegExp;
        accept: string;
    };
    downscale: {
        maxWidth: number;
        maxHeight: number;
        imageType: 'image/jpeg' | 'image/png';
        keepImageTypes?: string[];
        ignoreImageTypes?: string[];
        imageQuality?: number;
    };
}

const config: Config = {
    fileTypes: {
        regex: /^image\/(gif|jpe?g|a?png|svg|webp|bmp|heic|heif)/i,
        accept: 'image/*,image/heic,image/heif'
    },
    downscale: {
        maxWidth: 1024,
        maxHeight: 1024,
        imageType: 'image/jpeg',
        keepImageTypes: undefined,
        ignoreImageTypes: undefined,
        imageQuality: 0.5
    }
};

export default config;
