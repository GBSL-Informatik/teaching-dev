import React from 'react';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';

interface Props {
    defaultValue?: string;
    placeholder?: string;
    onChange: (text: string) => void;
    options: string[];
    value: string;
    disabled?: boolean;
}

const SelectInput = observer((props: Props) => {
    const { options, onChange, value } = props;
    return (
        <select
            className={styles.dropdown}
            onChange={(e) => {
                onChange(e.target.value);
            }}
            value={value}
            disabled={props.disabled}
        >
            {options.map((option, index) => (
                <option key={index} value={option}>
                    {option}
                </option>
            ))}
        </select>
    );
});

export default SelectInput;
