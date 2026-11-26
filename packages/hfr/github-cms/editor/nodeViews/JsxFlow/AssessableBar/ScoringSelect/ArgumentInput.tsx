import type { Parameter } from '../../../../assessable/scoring';
import NumberInput from '../NumberInput';

interface Props {
    parameter: Parameter;
    value: number | boolean;
    onChange: (value: number | boolean) => void;
}

/** a number input, or a checkbox for a boolean parameter */
const ArgumentInput = ({ parameter, value, onChange }: Props) => {
    if (typeof value === 'boolean') {
        return (
            <label title={parameter.title}>
                <input type="checkbox" checked={value} onChange={(event) => onChange(event.target.checked)} />
                {parameter.label}
            </label>
        );
    }
    return (
        <label title={parameter.title}>
            {parameter.label}
            <NumberInput value={value} onChange={(number) => number !== undefined && onChange(number)} />
        </label>
    );
};

export default ArgumentInput;
