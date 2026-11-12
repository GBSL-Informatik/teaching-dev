import clsx from 'clsx';
import React from 'react';
import { useFloatingPlacement } from '../useFloatingPlacement';
import styles from './styles.module.scss';

interface Props<T> {
    value: string;
    /** the suggestions for the typed value, filtered by the caller */
    options: T[];
    optionKey: (option: T) => string;
    renderOption: (option: T) => React.ReactNode;
    onChange: (text: string) => void;
    onSelect: (option: T) => void;
    /** enter without a suggestion, e.g. to apply the typed text */
    onEnter?: () => void;
    onFocus?: () => void;
    onBlur?: () => void;
    /** the dropdown stays open after selecting the option, e.g. a directory whose files are suggested next */
    keepsOpen?: (option: T) => boolean;
    /** marks the option of the current value */
    isCurrent?: (option: T) => boolean;
    layout?: 'list' | 'grid';
    label?: string;
    placeholder?: string;
    /** shown when there are no suggestions, otherwise the dropdown is hidden */
    emptyText?: string;
    className?: string;
}

/** a grid (e.g. of icons) is also navigated with the left and right arrow keys */
const NEXT_KEYS = { list: ['ArrowDown'], grid: ['ArrowDown', 'ArrowRight'] };
const PREVIOUS_KEYS = { list: ['ArrowUp'], grid: ['ArrowUp', 'ArrowLeft'] };

const scrollIntoView = (element: HTMLElement | null) => {
    element?.scrollIntoView({ block: 'nearest' });
};

/**
 * A text input with suggestions in a dropdown below it, or above it when there is not enough space below.
 * Suggestions are selected by clicking them or with the arrow keys and enter.
 */
const Combobox = <T,>(props: Props<T>) => {
    const { options, layout = 'list' } = props;
    const id = React.useId();
    const [isOpen, setIsOpen] = React.useState(false);
    const [highlighted, setHighlighted] = React.useState(0);
    const [input, setInput] = React.useState<HTMLInputElement | null>(null);
    const [dropdown, setDropdown] = React.useState<HTMLDivElement | null>(null);
    const placement = useFloatingPlacement(input, isOpen ? dropdown : null);
    const showDropdown = isOpen && (options.length > 0 || !!props.emptyText);
    // the options can change while the dropdown is open, e.g. when a directory is loaded
    const highlightedIndex = Math.min(highlighted, options.length - 1);

    const handleSelect = (option: T) => {
        setHighlighted(0);
        setIsOpen(!!props.keepsOpen?.(option));
        props.onSelect(option);
    };

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setHighlighted(0);
        setIsOpen(true);
        props.onChange(event.target.value);
    };

    const handleFocus = () => {
        setIsOpen(true);
        props.onFocus?.();
    };

    const handleBlur = () => {
        setIsOpen(false);
        props.onBlur?.();
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (NEXT_KEYS[layout].includes(event.key)) {
            event.preventDefault();
            setIsOpen(true);
            setHighlighted(Math.min(highlightedIndex + 1, options.length - 1));
            return;
        }
        if (PREVIOUS_KEYS[layout].includes(event.key)) {
            event.preventDefault();
            setHighlighted(Math.max(highlightedIndex - 1, 0));
            return;
        }
        if (event.key === 'Enter') {
            event.preventDefault();
            const option = showDropdown ? options[highlightedIndex] : undefined;
            if (option === undefined) {
                props.onEnter?.();
                return;
            }
            handleSelect(option);
            return;
        }
        if (event.key === 'Escape' && showDropdown) {
            // close the dropdown only, not the surrounding popover
            event.stopPropagation();
            setIsOpen(false);
        }
    };

    return (
        <>
            {props.label && (
                <label htmlFor={id} className={clsx(styles.label)}>
                    {props.label}
                </label>
            )}
            <input
                id={id}
                ref={setInput}
                className={clsx(styles.input, props.className)}
                value={props.value}
                placeholder={props.placeholder}
                spellCheck={false}
                role="combobox"
                aria-expanded={showDropdown}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
            />
            {showDropdown && (
                <div
                    ref={setDropdown}
                    role="listbox"
                    className={clsx(styles.dropdown, styles[layout], !placement && styles.measuring)}
                    style={placement ? { ...placement, minWidth: input?.offsetWidth } : undefined}
                >
                    {options.length === 0 && <div className={clsx(styles.empty)}>{props.emptyText}</div>}
                    {options.map((option, idx) => (
                        <button
                            key={props.optionKey(option)}
                            ref={idx === highlightedIndex ? scrollIntoView : undefined}
                            type="button"
                            role="option"
                            aria-selected={idx === highlightedIndex}
                            title={props.optionKey(option)}
                            className={clsx(
                                styles.option,
                                idx === highlightedIndex && styles.highlighted,
                                props.isCurrent?.(option) && styles.current
                            )}
                            // keep the focus in the input, otherwise the dropdown closes before the click
                            onMouseDown={(event) => event.preventDefault()}
                            onMouseEnter={() => setHighlighted(idx)}
                            onClick={() => handleSelect(option)}
                        >
                            {props.renderOption(option)}
                        </button>
                    ))}
                </div>
            )}
        </>
    );
};

export default Combobox;
