import React, { HTMLInputTypeAttribute } from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';

interface Props {
    defaultValue?: string;
    placeholder?: string;
    onChange: (text: string) => void;
    onEnter?: () => void;
    onEscape?: () => void;
    className?: string;
    value?: string;
    type?: HTMLInputTypeAttribute;
}

const TextInput = observer((props: Props) => {
    const [text, setText] = React.useState(props.defaultValue || '');
    return (
        <input
            type={props.type || 'text'}
            placeholder={props.placeholder}
            value={props.value || text}
            className={clsx(props.className, styles.textInput)}
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
            autoFocus
            autoComplete="off"
            autoCorrect="off"
        />
    );
});

export default TextInput;
