import config from './config';
import { file2b64 } from './file2b64';

const pasteImage = async (evt: ClipboardEvent) => {
    const files = Array.from(evt?.clipboardData?.items || []);
    // console.log('handlePaste', { files, evt });
    const images = files.filter((f) => IsMatch(f.type));
    // console.log('handlePaste', { images, evt });
    if (!images.length) {
        return;
    }
    // Text pasted from word will contain both text/html and image/png.
    const imagesNoHtml = images.filter((f) => f.type !== 'text/html');
    if (!imagesNoHtml.length) {
        console.log('handlePaste also detected html');
        return;
    }
    evt.preventDefault();
    const blob = images.pop()?.getAsFile();
    if (!blob) {
        return;
    }
    const base64ImageSrc = await file2b64(blob);
    // console.log('handleNewImageFiles', { base64ImageSrc });
    return base64ImageSrc;
};

function IsMatch(fileType: string): boolean {
    return !!fileType.match(config.fileTypes.regex);
}

export default pasteImage;
