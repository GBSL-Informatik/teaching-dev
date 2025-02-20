export const withPreviewPRName = (name: string) => {
    return name.replace('[skip ci]', '').replace('[skip netlify]', '').trim();
};

export const withoutPreviewPRName = (name: string) => {
    return `[skip ci] ${withPreviewPRName(name)}`;
};
