import { type NumberOption, withNumberValue } from '../../../../assessable/attributeOptions';
import { numberAttribute } from '../../../../jsxAttributes';
import type { JsxAttribute } from '../../../../schema';
import NumberInput from '../NumberInput';

interface Props {
    option: NumberOption;
    attributes: JsxAttribute[];
    onChange: (attributes: JsxAttribute[]) => void;
}

/** an empty input removes the attribute, an expression is edited in the tag */
const NumberControl = ({ option, attributes, onChange }: Props) => {
    const value = numberAttribute(attributes, option.name);
    return (
        <label>
            {option.label}
            <NumberInput
                value={value ?? undefined}
                isOptional
                disabled={value === null}
                placeholder={value === null ? 'im Tag' : '–'}
                onChange={(number) => onChange(withNumberValue(attributes, option.name, number))}
            />
        </label>
    );
};

export default NumberControl;
