const getMimeType = (src: string) => {
    return `image/${src.split('.').pop()?.replace('jpg', 'jpeg').replace('svg', 'svg+xml')}`;
};

const extractExalidrawImageName = (src: string) => {
    const path = src.split('/');
    const imgName = path.pop() as string;
    const excaliName = `${imgName}.excalidraw`;
    return {
        mimeType: getMimeType(imgName),
        excaliSrc: `${path.join('/')}/${excaliName}`,
        excaliName: excaliName,
        imgName: imgName
    };
};

export default extractExalidrawImageName;
