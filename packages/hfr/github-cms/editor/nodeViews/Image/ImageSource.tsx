import { observer } from 'mobx-react-lite';
import React from 'react';
import { useCmsStore } from '../../../hooks/useCmsStore';
import Combobox from '../../components/Combobox';
import type { NodeViewProps } from '../ReactNodeView';

const identity = (path: string) => path;

/**
 * Edits the `src` of the image: a relative path, suggesting the images in `./images`, or a url.
 * The `src` is updated on enter or when leaving the field: every update loads the image,
 * which must not happen for each typed character.
 */
const ImageSource = observer(({ handle }: NodeViewProps) => {
    const cmsStore = useCmsStore();
    const editedFile = cmsStore.editedFile?.type === 'file' ? cmsStore.editedFile : undefined;
    const [text, setText] = React.useState<string>(handle.node.attrs.src);
    const imagePaths = editedFile ? editedFile.images.map((image) => editedFile.relativePath(image)) : [];
    const options = imagePaths.filter((path) => path.includes(text.trim()));

    React.useEffect(() => {
        editedFile?.loadImages();
    }, [editedFile]);

    const handleApply = (typed: string = text) => {
        const src = typed.trim();
        if (src && src !== handle.node.attrs.src) {
            handle.updateAttrs({ src });
        }
    };

    const handleSelect = (path: string) => {
        setText(path);
        handleApply(path);
    };

    return (
        <Combobox
            label="Quelle (z.B. ./images/bild.png oder https://...)"
            value={text}
            options={options}
            optionKey={identity}
            renderOption={identity}
            onChange={setText}
            onSelect={handleSelect}
            onEnter={() => handleApply()}
            onBlur={() => handleApply()}
        />
    );
});

export default ImageSource;
