import React from 'react';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import clsx from 'clsx';

interface Props {
    defaultValue?: string;
    placeholder?: string;
    /**
     * provide the labels in the same order as the options
     * to display them in the dropdown
     */
    labels?: string[];
    onChange: (text: string) => void;
    options: string[];
    value: string;
    disabled?: boolean;
    className?: string;
}

const SelectInput = observer((props: Props) => {
    const { options, onChange, value } = props;
    return (
        <select
            className={clsx(styles.dropdown, props.className)}
            onChange={(e) => {
                onChange(e.target.value);
            }}
            value={value}
            disabled={props.disabled}
        >
            {options.map((option, index) => (
                <option
                    key={index}
                    value={option}
                    className={clsx(styles.option, value === option && styles.selected)}
                >
                    {props.labels ? (value === option ? option : props.labels[index]) : option}
                </option>
            ))}
        </select>
    );
});

export default SelectInput;
