import React, { HTMLInputTypeAttribute } from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';

interface Props {
    id?: string;
    defaultValue?: string;
    placeholder?: string;
    onChange: (text: string) => void;
    onEnter?: () => void;
    onEscape?: () => void;
    onSave?: () => void;
    className?: string;
    labelClassName?: string;
    value?: string;
    type?: HTMLInputTypeAttribute;
    label?: React.ReactNode;
    noSpellCheck?: boolean;
    noAutoFocus?: boolean;
    required?: boolean;
    options?: string[];
    step?: string | number | undefined;
    min?: string | number | undefined;
    max?: string | number | undefined;
    readOnly?: boolean;
}

const TextInput = observer((props: Props) => {
    const _id = React.useId();
    const id = props.id || _id;
    const [text, setText] = React.useState(props.defaultValue || '');
    return (
        <>
            {props.label && (
                <label className={clsx(styles.label, props.labelClassName)} htmlFor={id}>
                    {props.label}
                </label>
            )}
            <input
                id={id}
                spellCheck={!props.noSpellCheck}
                type={props.type || 'text'}
                placeholder={props.placeholder}
                value={props.value ?? text}
                className={clsx(props.className, styles.textInput)}
                required={props.required}
                disabled={props.readOnly}
                onChange={(e) => {
                    if (props.value === undefined) {
                        setText(e.target.value);
                    }
                    props.onChange(e.target.value);
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        props.onEnter?.();
                    }
                    if (e.key === 'Escape') {
                        props.onEscape?.();
                    }
                    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                        props.onSave?.();
                    }
                }}
                autoFocus={!props.noAutoFocus}
                autoComplete="off"
                autoCorrect="off"
                step={props.step}
                min={props.min}
                max={props.max}
            />
        </>
    );
});

export default TextInput;
