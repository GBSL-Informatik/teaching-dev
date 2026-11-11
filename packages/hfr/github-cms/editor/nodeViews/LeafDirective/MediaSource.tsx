import TextInput from '@tdev-components/shared/TextInput';
import { observer } from 'mobx-react-lite';
import React from 'react';
import type { NodeViewProps } from '../ReactNodeView';

/**
 * Edits the source of a media directive, the label of `::audio[./assets/song.mp3]`.
 * It is updated on enter or when leaving the field: every update loads the preview,
 * which must not happen for each typed character.
 */
const MediaSource = observer(({ handle }: NodeViewProps) => {
    const { label } = handle.node.attrs;
    const [text, setText] = React.useState<string>(label);

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
            noSpellCheck
            noAutoFocus
            onChange={setText}
            onEnter={handleApply}
            onBlur={handleApply}
        />
    );
});

export default MediaSource;
