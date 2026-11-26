import clsx from 'clsx';
import { type SelectOption, selectValue, withSelectValue } from '../../../../assessable/attributeOptions';
import type { JsxAttribute } from '../../../../schema';
import styles from '../styles.module.scss';

interface Props {
    option: SelectOption;
    attributes: JsxAttribute[];
    onChange: (attributes: JsxAttribute[]) => void;
}

/** another value, e.g. an expression, is shown as custom value */
const SelectControl = ({ option, attributes, onChange }: Props) => {
    const value = selectValue(attributes, option);
    return (
        <label>
            {option.label}
            <select
                className={clsx(styles.input)}
                value={value ?? ''}
                disabled={value === null}
                onChange={(event) => onChange(withSelectValue(attributes, option, event.target.value))}
            >
                {value === null && <option value="">Benutzerdefiniert (im Tag bearbeiten)</option>}
                {Object.entries(option.labels).map(([value, label]) => (
                    <option key={value} value={value}>
                        {label}
                    </option>
                ))}
            </select>
        </label>
    );
};

export default SelectControl;
