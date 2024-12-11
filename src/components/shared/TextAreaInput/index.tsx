import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import Button from '../Button';
import { mdiKeyboardTab } from '@mdi/js';

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
}

const TextAreaInput = observer((props: Props) => {
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
            setTimeout(() => {
                inp?.setSelectionRange(selectionStart + 1, selectionStart + 1);
            }, 0);
        }
    };
    return (
        <>
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
