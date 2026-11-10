import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import SourceInput from '../../components/SourceInput';
import { jsxOpeningTagOf, parseJsxOpeningTag, withJsxOpeningTag } from '../../markdown/jsxOpeningTag';
import { jsxAttributes } from '../../markdown/serialize';
import type { NodeViewProps } from '../ReactNodeView';
import styles from './styles.module.scss';

const EDIT_HINT = 'Doppelklicken, um das Tag zu bearbeiten';

interface Props extends NodeViewProps {
    isVoid: boolean;
}

/**
 * The opening tag, e.g. `<CodeShowcase lang="md">`. The attributes are cut off when space is short.
 * A double click edits the tag as text.
 */
const JsxTitle = observer(({ handle, isVoid }: Props) => {
    const [isEditing, setIsEditing] = React.useState(false);
    const { name, attributes } = handle.node.attrs;

    if (isEditing) {
        return (
            <SourceInput
                initialText={jsxOpeningTagOf(handle.node)}
                parse={(text) => parseJsxOpeningTag(text, handle.node)}
                onApply={(tag) => handle.updateAttrs(withJsxOpeningTag(handle.node, tag))}
                onClose={() => setIsEditing(false)}
            />
        );
    }

    // multi-line expressions are shown on one line
    const attributesText = jsxAttributes(attributes).replace(/\s+/g, ' ');
    return (
        <span className={clsx(styles.title)} title={EDIT_HINT} onDoubleClick={() => setIsEditing(true)}>
            <span className={clsx(styles.tag)}>{`<${name}`}</span>
            {attributesText && (
                <span className={clsx(styles.attributes)} title={`${attributesText.trim()}\n\n${EDIT_HINT}`}>
                    {attributesText}
                </span>
            )}
            <span className={clsx(styles.tag)}>{isVoid ? ' />' : '>'}</span>
        </span>
    );
});

export default JsxTitle;
