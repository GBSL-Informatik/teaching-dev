import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import Button from '../Button';
import { mdiKeyboardTab } from '@mdi/js';
import scheduleMicrotask from '@tdev-components/util/scheduleMicrotask';

interface Props {
    defaultValue?: string;
    placeholder?: string;
    onChange: (text: string) => void;
    onEnter?: () => void;
    onEscape?: () => void;
    className?: string;
    minRows?: number;
    monospace?: boolean;
    showTabButton?: boolean;
    tabClassName?: string;
    label?: string;
    labelClassName?: string;
}

const TextAreaInput = observer((props: Props) => {
    const id = React.useId();
    const [text, setText] = React.useState(props.defaultValue || '');
    const [rows, setRows] = React.useState(
        Math.max((props.defaultValue || '').split('\n').length, props.minRows || 1)
    );
    const ref = React.useRef<HTMLTextAreaElement>(null);
    React.useEffect(() => {
        const lineCount = text.split('\n').length;
        if (lineCount === rows) {
            return;
        }
        if (lineCount > 1) {
            setRows(lineCount);
        } else {
            setRows(Math.max(1, props.minRows || 1));
        }
    }, [text, rows]);

    const insertTab = () => {
        if (ref.current) {
            const inp = ref.current;
            const selectionStart = inp.selectionStart;
            const newText = `${text.slice(0, selectionStart)}\t${text.slice(selectionStart)}`;
            setText(newText);
            props.onChange(newText);
            scheduleMicrotask(() => {
                inp?.setSelectionRange(selectionStart + 1, selectionStart + 1);
            });
        }
    };
    return (
        <>
            {props.label && (
                <label className={clsx(styles.label, props.labelClassName)} htmlFor={id}>
                    {props.label}
                </label>
            )}
            {props.showTabButton && (
                <Button
                    icon={mdiKeyboardTab}
                    onClick={insertTab}
                    className={clsx(props.tabClassName)}
                    title="Tab einfügen"
                    color="blue"
                    text="Tab"
                    iconSide="left"
                />
            )}
            <textarea
                id={id}
                ref={ref}
                placeholder={props.placeholder}
                value={text}
                className={clsx(
                    props.className,
                    styles.textAreaInput,
                    props.showTabButton && styles.showTabButton,
                    props.monospace && styles.monospace
                )}
                onChange={(e) => {
                    setText(e.target.value);
                    props.onChange(e.target.value);
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        props.onEnter?.();
                    }
                    if (e.key === 'Escape') {
                        props.onEscape?.();
                    }
                    if (e.key === 'Tab') {
                        e.preventDefault(); // Prevent the default tab behavior
                        insertTab();
                    }
                }}
                rows={rows === 1 ? 1 : rows + 1}
                autoFocus
                autoComplete="off"
                autoCorrect="off"
            />
        </>
    );
});

export default TextAreaInput;
