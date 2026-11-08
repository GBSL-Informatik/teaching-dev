import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import type { NodeViewProps } from '../ReactNodeView';
import { joinAlt, splitAlt } from './altText';
import styles from './styles.module.scss';

interface Editing {
    text: string;
    /** the options when the input was focused, so typed text never moves into them while typing */
    options: string[];
}

/**
 * Edits the caption of an image as plain text (markdown). The caption is the alt text without
 * the image options, which are kept as they are.
 */
const Caption = observer(({ handle }: NodeViewProps) => {
    const { caption } = splitAlt(handle.node.attrs.alt);
    // the stored caption is trimmed, the typed text (e.g. a trailing space) is shown while editing
    const [editing, setEditing] = React.useState<Editing | null>(null);

    const handleFocus = () => {
        setEditing({ text: caption, options: splitAlt(handle.node.attrs.alt).options });
    };
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!editing) {
            return;
        }
        const text = event.target.value;
        setEditing({ ...editing, text });
        handle.updateAttrs({ alt: joinAlt(text, editing.options) });
    };

    return (
        <input
            className={clsx(styles.caption)}
            value={editing?.text ?? caption}
            placeholder="Bildunterschrift"
            onFocus={handleFocus}
            onBlur={() => setEditing(null)}
            onChange={handleChange}
        />
    );
});

export default Caption;
