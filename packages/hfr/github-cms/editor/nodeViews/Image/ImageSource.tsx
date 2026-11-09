import TextInput from '@tdev-components/shared/TextInput';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { useCmsStore } from '../../../hooks/useCmsStore';
import type { NodeViewProps } from '../ReactNodeView';

/**
 * Edits the `src` of the image: a relative path, suggesting the images in `./images`, or a url.
 * The `src` is updated on enter or when leaving the field: every update loads the image,
 * which must not happen for each typed character.
 */
const ImageSource = observer(({ handle }: NodeViewProps) => {
    const cmsStore = useCmsStore();
    const editedFile = cmsStore.editedFile?.type === 'file' ? cmsStore.editedFile : undefined;
    const [text, setText] = React.useState<string>(handle.node.attrs.src);

    React.useEffect(() => {
        editedFile?.loadImages();
    }, [editedFile]);

    const handleApply = () => {
        const src = text.trim();
        if (src && src !== handle.node.attrs.src) {
            handle.updateAttrs({ src });
        }
    };

    return (
        <TextInput
            label="Quelle (z.B. ./images/bild.png oder https://...)"
            value={text}
            options={editedFile?.images.map((image) => editedFile.relativePath(image))}
            noSpellCheck
            noAutoFocus
            onChange={setText}
            onEnter={handleApply}
            onBlur={handleApply}
        />
    );
});

export default ImageSource;
