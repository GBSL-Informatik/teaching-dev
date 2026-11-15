/**
 * Where the image and its excalidraw sidecar are saved: at their current paths,
 * or renamed to `.webp` when the image is converted to webp.
 */
const exportPaths = (src: string, excaliSrc: string, imgName: string, asWebp: boolean) => {
    const isRenamed = asWebp && !/\.webp$/i.test(src);
    if (!isRenamed) {
        return { imgExport: src, excaliExport: excaliSrc, isRenamed };
    }
    const webpName = `${imgName.split('.').slice(0, -1).join('.')}.webp`;
    return {
        imgExport: src.replace(imgName, webpName),
        excaliExport: excaliSrc.replace(`${imgName}.excalidraw`, `${webpName}.excalidraw`),
        isRenamed
    };
};

export default exportPaths;
