import React from 'react';
import { type NumberOption, numberValue, withNumberValue } from '../../../../assessable/attributeOptions';
import type { JsxAttribute } from '../../../../schema';

interface Props {
    option: NumberOption;
    attributes: JsxAttribute[];
    onChange: (attributes: JsxAttribute[]) => void;
}

const textOf = (value: number | undefined | null) =>
    value === undefined || value === null ? '' : `${value}`;

/** e.g. `0.50` for `0.5`, or an empty text for no value */
const isTextOf = (text: string, value: number | undefined) =>
    text.trim() ? Number(text) === value : value === undefined;

/** an empty input removes the attribute */
const NumberControl = ({ option, attributes, onChange }: Props) => {
    const value = numberValue(attributes, option.name);
    // while typing, the text may not be a number yet, e.g. `-`
    const [text, setText] = React.useState(textOf(value));
    React.useEffect(() => {
        if (value !== null) {
            setText((current) => (isTextOf(current, value) ? current : textOf(value)));
        }
    }, [value]);

    const handleChange = (input: string) => {
        setText(input);
        if (!input.trim()) {
            onChange(withNumberValue(attributes, option.name, undefined));
            return;
        }
        const number = Number(input);
        if (Number.isFinite(number) && number !== value) {
            onChange(withNumberValue(attributes, option.name, number));
        }
    };

    return (
        <label>
            {option.label}
            <input
                type="number"
                step="0.25"
                value={text}
                placeholder={value === null ? 'im Tag' : '–'}
                disabled={value === null}
                onChange={(event) => handleChange(event.target.value)}
            />
        </label>
    );
};

export default NumberControl;
