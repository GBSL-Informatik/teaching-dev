import clsx from 'clsx';
import React from 'react';
import SourceInput from '../SourceInput';
import styles from './styles.module.scss';

const EDIT_HINT = 'Doppelklicken, um zu bearbeiten';

interface Props<T> {
    /** the start of the tag, e.g. `<Foo` or `:::tip` */
    tag: React.ReactNode;
    /** e.g. ` bar="baz"` or `{#id}` */
    attributes: string;
    /** the end of the tag, e.g. `>` */
    end?: string;
    /** the markdown source to edit */
    source: string;
    /** throws when the edited source is not valid */
    parse: (text: string) => T;
    onApply: (value: T) => void;
}

/**
 * The opening tag of a node in its toolbar, e.g. `<CodeShowcase lang="md">` or `:::tip{#id}`.
 * The attributes are cut off when space is short. A double click edits the source as text.
 */
const EditableTag = <T,>(props: Props<T>) => {
    const [isEditing, setIsEditing] = React.useState(false);

    if (isEditing) {
        return (
            <SourceInput
                initialText={props.source}
                parse={props.parse}
                onApply={props.onApply}
                onClose={() => setIsEditing(false)}
            />
        );
    }

    // multi-line expressions are shown on one line
    const attributes = props.attributes.replace(/\s+/g, ' ');
    return (
        <span className={clsx(styles.editableTag)} title={EDIT_HINT} onDoubleClick={() => setIsEditing(true)}>
            <span className={clsx(styles.tag)}>{props.tag}</span>
            {attributes && (
                <span className={clsx(styles.attributes)} title={`${attributes.trim()}\n\n${EDIT_HINT}`}>
                    {attributes}
                </span>
            )}
            {props.end && <span className={clsx(styles.tag)}>{props.end}</span>}
        </span>
    );
};

export default EditableTag;
