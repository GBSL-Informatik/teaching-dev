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
    noAutoFocus?: boolean;
}

const TextAreaInput = observer((props: Props) => {
    const id = React.useId();
    const [text, setText] = React.useState(props.defaultValue || '');
    const ref = React.useRef<HTMLTextAreaElement>(null);

    const adjustHeight = React.useCallback(() => {
        if (ref.current) {
            ref.current.style.height = 'auto';
            ref.current.style.height = `${ref.current.scrollHeight}px`;
        }
    }, []);

    React.useEffect(() => {
        adjustHeight();
    }, [text, ref.current]);

    React.useEffect(() => {
        if (ref.current) {
            ref.current.addEventListener('focus', adjustHeight);
            return () => {
                if (ref.current) {
                    ref.current.removeEventListener('focus', adjustHeight);
                }
            };
        }
    }, [ref.current]);

    const insertTab = () => {
        if (ref.current) {
            const inp = ref.current;
            const selectionStart = inp.selectionStart;
            const newText = `${text.slice(0, selectionStart)}\t${text.slice(selectionStart)}`;
            setText(newText);
            props.onChange(newText);
            scheduleMicrotask(() => {
                inp?.setSelectionRange(selectionStart + 1, selectionStart + 1);
                adjustHeight();
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
                style={{ minHeight: props.minRows ? `${props.minRows * 1.2 + 1}em` : undefined }}
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
                        e.preventDefault();
                        insertTab();
                    }
                }}
                rows={1}
                autoFocus={!props.noAutoFocus}
                autoComplete="off"
                autoCorrect="off"
            />
        </>
    );
});

export default TextAreaInput;
