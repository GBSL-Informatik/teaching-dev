import ImageEditorPopup from '@tdev/excalidoc/ImageMarkupEditor/ImageEditorPopup';
import { observer } from 'mobx-react-lite';
import { useCmsStore } from '../../../hooks/useCmsStore';
import type BinFile from '../../../models/BinFile';
import type { NodeViewHandle } from '../ReactNodeView';
import { githubImageStorage } from './githubImageStorage';

interface Props {
    handle: NodeViewHandle;
    /** the image in the repository the `src` of the node points to */
    image: BinFile;
}

/**
 * Edits the image with excalidraw. The scene is stored next to the image, in `<image>.excalidraw`.
 */
const ExcalidrawButton = observer(({ handle, image }: Props) => {
    const cmsStore = useCmsStore();

    const openStorage = async () => {
        return cmsStore.github ? githubImageStorage(cmsStore.github, image.branch, image.path) : null;
    };

    /** the name changes when the image is converted to webp or restored */
    const handleImageChanged = (imagePath: string) => {
        const newName = imagePath.split('/').pop()!;
        if (newName === image.name) {
            return;
        }
        const { src } = handle.node.attrs;
        handle.updateAttrs({ src: `${src.slice(0, src.length - image.name.length)}${newName}` });
    };

    return (
        <ImageEditorPopup
            mimeType={`${image.mimeType}/${image.mimeExtension}`}
            openStorage={openStorage}
            onImageChanged={handleImageChanged}
        />
    );
});

export default ExcalidrawButton;
