import React from 'react';
import type { Parameter } from '../../../../assessable/scoring';

interface Props {
    parameter: Parameter;
    value: number | boolean;
    onChange: (value: number | boolean) => void;
}

/** a number input, or a checkbox for a boolean parameter */
const ArgumentInput = ({ parameter, value, onChange }: Props) => {
    // while typing, the text may not be a number yet, e.g. `-`
    const [text, setText] = React.useState(String(value));
    React.useEffect(() => {
        setText((current) => (Number(current) === value ? current : String(value)));
    }, [value]);

    if (typeof value === 'boolean') {
        return (
            <label title={parameter.title}>
                <input type="checkbox" checked={value} onChange={(event) => onChange(event.target.checked)} />
                {parameter.label}
            </label>
        );
    }

    const handleChange = (input: string) => {
        setText(input);
        const number = Number(input);
        if (input.trim() && Number.isFinite(number) && number !== value) {
            onChange(number);
        }
    };

    return (
        <label title={parameter.title}>
            {parameter.label}
            <input
                type="number"
                step="0.25"
                value={text}
                onChange={(event) => handleChange(event.target.value)}
            />
        </label>
    );
};

export default ArgumentInput;
