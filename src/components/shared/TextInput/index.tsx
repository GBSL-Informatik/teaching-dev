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
    validator?: (text: string) => string | null;
    className?: string;
    labelClassName?: string;
    value?: string;
    type?: HTMLInputTypeAttribute;
    title?: string;
    label?: React.ReactNode;
    noSpellCheck?: boolean;
    noAutoFocus?: boolean;
    required?: boolean;
    options?: string[];
    step?: string | number | undefined;
    min?: string | number | undefined;
    max?: string | number | undefined;
    readOnly?: boolean;
    isDirty?: boolean;
}

const TextInput = observer((props: Props) => {
    const _id = React.useId();
    const id = props.id || _id;
    const [text, setText] = React.useState(props.defaultValue || '');
    const validator = React.useCallback(props.validator ?? ((text: string) => null), [props.validator]);
    return (
        <>
            {props.label && (
                <label
                    className={clsx(
                        styles.label,
                        props.labelClassName,
                        props.required && styles.required,
                        props.isDirty && styles.dirty
                    )}
                    htmlFor={id}
                    title={props.title}
                >
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
                }}
                onInput={(e) => {
                    const validity = e.currentTarget.validity;
                    const error = validator(e.currentTarget.value);
                    if (error === null) {
                        e.currentTarget.setCustomValidity('');
                    } else {
                        e.currentTarget.setCustomValidity(error);
                    }
                    e.currentTarget.classList.add(styles.touched);
                    if ((props.required || e.currentTarget.value.length > 0) && !validity.valid) {
                        e.currentTarget.reportValidity();
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
