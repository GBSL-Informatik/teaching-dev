import clsx from 'clsx';
import React from 'react';
import styles from './styles.module.scss';

interface Props {
    value: number | undefined;
    /** called with valid numbers only, `undefined` when an optional input is emptied */
    onChange: (value: number | undefined) => void;
    /** the input can be emptied, e.g. to remove the attribute */
    isOptional?: boolean;
    disabled?: boolean;
    placeholder?: string;
}

const textOf = (value: number | undefined) => (value === undefined ? '' : `${value}`);

/** e.g. `0.50` for `0.5`, or an empty text for no value */
const isTextOf = (text: string, value: number | undefined) =>
    text.trim() ? Number(text) === value : value === undefined;

/** a number input, keeping the text while typing, e.g. `-` before `-1` */
const NumberInput = ({ value, onChange, isOptional, disabled, placeholder }: Props) => {
    const [text, setText] = React.useState(textOf(value));
    React.useEffect(() => {
        setText((current) => (isTextOf(current, value) ? current : textOf(value)));
    }, [value]);

    const handleChange = (input: string) => {
        setText(input);
        if (!input.trim()) {
            if (isOptional) {
                onChange(undefined);
            }
            return;
        }
        const number = Number(input);
        if (Number.isFinite(number) && number !== value) {
            onChange(number);
        }
    };

    return (
        <input
            type="number"
            step="0.25"
            className={clsx(styles.input, styles.number)}
            value={text}
            disabled={disabled}
            placeholder={placeholder}
            onChange={(event) => handleChange(event.target.value)}
        />
    );
};

export default NumberInput;
