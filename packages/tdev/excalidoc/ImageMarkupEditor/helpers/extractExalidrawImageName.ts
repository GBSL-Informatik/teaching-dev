const extractExalidrawImageName = (src: string): [string, string, string] => {
    const path = src.split('/');
    const imgName = path.pop() as string;
    const excaliName = `${imgName}.excalidraw`;
    return [excaliName, `${path.join('/')}/${excaliName}`, imgName];
};

export default extractExalidrawImageName;
