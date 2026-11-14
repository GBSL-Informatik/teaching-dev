import TextInput from '@tdev-components/shared/TextInput';
import { observer } from 'mobx-react-lite';
import React from 'react';
import type { NodeViewProps } from '../ReactNodeView';
import { joinAlt, splitAlt } from './altText';

/**
 * Edits the image options in the alt text, e.g. `--width=20em @inline`. Rendered in the settings
 * popover: the typed text and the caption are kept while the popover is open, so incomplete
 * options (e.g. `--width=`) are not moved into the caption.
 */
const ImageOptions = observer(({ handle }: NodeViewProps) => {
    const [initial] = React.useState(() => splitAlt(handle.node.attrs.alt));
    const [text, setText] = React.useState(() => initial.options.join(' '));

    const handleChange = (options: string) => {
        setText(options);
        handle.updateAttrs({ alt: joinAlt(initial.caption, [options.trim()]) });
    };

    return (
        <TextInput
            label="Optionen (z.B. --width=20em @inline)"
            value={text}
            noSpellCheck
            onChange={handleChange}
        />
    );
});

export default ImageOptions;
