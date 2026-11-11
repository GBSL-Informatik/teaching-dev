import TextInput from '@tdev-components/shared/TextInput';
import { LeafDirectiveName } from '@tdev-plugins/remark-media/mediaElement';
import { observer } from 'mobx-react-lite';
import React from 'react';
import type iFile from '../../../models/iFile';
import type { NodeViewProps } from '../ReactNodeView';
import { useAssetPathOptions } from './useAssetPathOptions';

/** the files suggested for directives with a file in the repository, the others are embedded urls */
const ACCEPTED_FILES: Partial<Record<string, (file: iFile) => boolean>> = {
    [LeafDirectiveName.AUDIO]: (file) => file.isAudio,
    [LeafDirectiveName.VIDEO]: (file) => file.isVideo
};

/**
 * Edits the source of a media directive, the label of `::audio[./assets/song.mp3]`.
 * Relative paths of audio and video files are completed.
 * It is updated on enter or when leaving the field: every update loads the preview,
 * which must not happen for each typed character.
 */
const MediaSource = observer(({ handle }: NodeViewProps) => {
    const { name, label } = handle.node.attrs;
    const [text, setText] = React.useState<string>(label);
    const options = useAssetPathOptions(text, ACCEPTED_FILES[name]);

    React.useEffect(() => {
        setText(label);
    }, [label]);

    const handleApply = () => {
        const src = text.trim();
        if (src !== label) {
            handle.updateAttrs({ label: src });
        }
    };

    return (
        <TextInput
            value={text}
            placeholder="Quelle"
            options={options}
            noSpellCheck
            noAutoFocus
            onChange={setText}
            onEnter={handleApply}
            onBlur={handleApply}
        />
    );
});

export default MediaSource;
