import clsx from 'clsx';
import React from 'react';
import SourceInput from '../SourceInput';
import styles from './styles.module.scss';

interface Props {
    value: string;
    /** e.g. "Sprache", shown in the tooltip */
    label: string;
    /** shown while the value is empty */
    placeholder: string;
    /** throws when the edited text is not valid */
    validate?: (text: string) => void;
    onApply: (value: string) => void;
    className?: string;
}

/**
 * A single value in a toolbar, e.g. the language of a code block. Empty values show a placeholder.
 * A double click edits the value in place.
 */
const EditableText = (props: Props) => {
    const [isEditing, setIsEditing] = React.useState(false);

    if (isEditing) {
        return (
            <SourceInput
                initialText={props.value}
                parse={(text) => {
                    const value = text.trim();
                    props.validate?.(value);
                    return value;
                }}
                onApply={props.onApply}
                onClose={() => setIsEditing(false)}
            />
        );
    }

    const isEmpty = !props.value;
    return (
        <span
            className={clsx(styles.editableText, isEmpty && styles.empty, props.className)}
            title={`${props.label}: ${props.value || 'leer'}\n\nDoppelklicken, um zu bearbeiten`}
            onDoubleClick={() => setIsEditing(true)}
        >
            {props.value || props.placeholder}
        </span>
    );
};

export default EditableText;
