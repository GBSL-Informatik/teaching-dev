import { mdiCheck, mdiClose } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import clsx from 'clsx';
import React from 'react';
import styles from './styles.module.scss';

export interface Field {
    name: string;
    /** shown as tooltip, e.g. what the attribute does */
    title: string;
    /** the form can not be applied while the field is empty */
    required?: boolean;
}

interface Props {
    fields: Field[];
    /** the current value of each field, by name */
    values: Record<string, string>;
    onApply: (values: Record<string, string>) => void;
    onClose: () => void;
}

/**
 * Edits a few string attributes in place, e.g. the `url` and `href` of a `<BrowserWindow>`.
 * Enter applies, Escape cancels. Empty fields remove their attribute, unless they are required.
 */
const StringAttributesForm = (props: Props) => {
    const [values, setValues] = React.useState(props.values);
    const isComplete = props.fields.every((field) => !field.required || values[field.name]?.trim());

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (!isComplete) {
            return;
        }
        props.onApply(values);
        props.onClose();
    };
    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            props.onClose();
        }
    };

    return (
        <form className={clsx(styles.form)} onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
            {props.fields.map((field, idx) => (
                <input
                    key={field.name}
                    value={values[field.name] ?? ''}
                    placeholder={field.name}
                    title={field.title}
                    required={field.required}
                    autoFocus={idx === 0}
                    onChange={(event) => setValues({ ...values, [field.name]: event.target.value })}
                />
            ))}
            <Button
                icon={mdiCheck}
                size={SIZE_S}
                type="submit"
                color="green"
                title={isComplete ? 'Übernehmen' : 'Bitte alle Pflichtfelder ausfüllen'}
                disabled={!isComplete}
            />
            <Button icon={mdiClose} size={SIZE_S} title="Abbrechen" onClick={props.onClose} />
        </form>
    );
};

export default StringAttributesForm;
