import clsx from 'clsx';
import React from 'react';
import styles from './styles.module.scss';

interface Props<T> {
    initialText: string;
    /** throws when the text is not valid, the message of the error is shown */
    parse: (text: string) => T;
    onApply: (value: T) => void;
    onClose: () => void;
}

type ParseResult<T> = { value: T } | { error: string };

const tryParse = <T,>(parse: (text: string) => T, text: string): ParseResult<T> => {
    try {
        return { value: parse(text) };
    } catch (error) {
        return { error: error instanceof Error ? error.message : String(error) };
    }
};

/**
 * Edits markdown source in place, e.g. the opening tag of a jsx element, like the dev tools
 * of a browser: Enter applies, Shift+Enter adds a line break and Escape cancels.
 * Invalid text is never applied: the field stays open and shows the error.
 */
const SourceInput = <T,>({ initialText, parse, onApply, onClose }: Props<T>) => {
    const [text, setText] = React.useState(initialText);
    const result = tryParse(parse, text);
    const error = 'error' in result ? result.error : undefined;

    const handleApply = () => {
        if ('error' in result) {
            return;
        }
        if (text !== initialText) {
            onApply(result.value);
        }
        onClose();
    };
    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            onClose();
            return;
        }
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleApply();
        }
    };

    return (
        // clicks must not select the node, which would move the focus to the document
        <span className={clsx(styles.sourceInput)} onClick={(event) => event.stopPropagation()}>
            <textarea
                className={clsx(styles.input, error && styles.invalid)}
                value={text}
                rows={text.split('\n').length}
                spellCheck={false}
                autoFocus
                onChange={(event) => setText(event.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleApply}
            />
            {error && <span className={clsx(styles.error)}>{error}</span>}
        </span>
    );
};

export default SourceInput;
