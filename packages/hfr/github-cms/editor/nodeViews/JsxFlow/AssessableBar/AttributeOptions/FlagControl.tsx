import { type FlagOption, flagValue, withFlag } from '../../../../assessable/attributeOptions';
import type { JsxAttribute } from '../../../../schema';

interface Props {
    option: FlagOption;
    attributes: JsxAttribute[];
    onChange: (attributes: JsxAttribute[]) => void;
}

const FlagControl = ({ option, attributes, onChange }: Props) => {
    const isSet = flagValue(attributes, option.name);
    return (
        <label>
            <input
                type="checkbox"
                checked={isSet ?? false}
                disabled={isSet === null}
                onChange={(event) => onChange(withFlag(attributes, option.name, event.target.checked))}
            />
            {option.label}
        </label>
    );
};

export default FlagControl;
