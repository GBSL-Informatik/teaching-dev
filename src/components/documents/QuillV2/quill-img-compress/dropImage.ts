import config from './config';
import { file2b64 } from './file2b64';

const dropImage = async (evt: DragEvent) => {
    evt.preventDefault();
    if (document.caretRangeFromPoint) {
        const selection = document.getSelection();
        const range = document.caretRangeFromPoint(evt.clientX, evt.clientY);
        if (selection && range) {
            selection.setBaseAndExtent(
                range.startContainer,
                range.startOffset,
                range.startContainer,
                range.startOffset
            );
        }
    }
    const files = await getFilesFromDragEvent(evt);
    const filesFiltered = Array.from(files || []).filter((f) => IsMatch(f.type));
    const firstImage = filesFiltered?.[0];
    if (firstImage) {
        const base64ImageSrc = await file2b64(firstImage);
        // console.log('handleNewImageFiles', { evt, files, filesFiltered, firstImage, base64ImageSrc });
        return base64ImageSrc;
    }
    const blob = await getBlobFromDragEvent(evt);
    if (!!blob) {
        const base64ImageSrc = await file2b64(blob);
        // console.log('handleNewImageFiles', { evt, blob, base64ImageSrc });
        return base64ImageSrc;
    }
};

async function getBlobFromDragEvent(evt: DragEvent): Promise<Blob | undefined> {
    const draggedUrl = evt.dataTransfer?.getData('URL');
    if (draggedUrl) {
        const blob = await (await fetch(draggedUrl)).blob();
        return blob;
    }
}

async function getFilesFromDragEvent(evt: DragEvent): Promise<FileList | undefined> {
    const files = evt?.dataTransfer?.files;
    return files;
}

function IsMatch(fileType: string): boolean {
    return !!fileType.match(config.fileTypes.regex);
}

export default dropImage;
