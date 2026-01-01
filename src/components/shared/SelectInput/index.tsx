import React from 'react';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import clsx from 'clsx';

interface Option {
    value: string;
    label?: string;
    disabled?: boolean;
}

interface BaseProps {
    defaultValue?: string;
    placeholder?: string;
    onChange: (text: string) => void;
    value: string;
    disabled?: boolean;
    className?: string;
}

interface SimpleProps extends BaseProps {
    labels?: string[];
    options: string[];
}

interface CustomizableProps extends BaseProps {
    labels?: never[];
    options: Option[];
}

type Props = SimpleProps | CustomizableProps;

const SelectInput = observer((props: Props) => {
    const { onChange, value } = props;
    const options = React.useMemo<Option[]>(() => {
        if (props.options.length === 0) {
            return [];
        }
        if (typeof props.options[0] === 'string') {
            return (props.options as string[]).map((o, idx) => ({
                value: o as string,
                label: props.labels?.[idx] ?? o
            }));
        }
        return props.options as Option[];
    }, [props.options, props.labels]);
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
                    value={option.value}
                    disabled={option.disabled}
                    className={clsx(styles.option, value === option.value && styles.selected)}
                >
                    {option.label ?? option.value}
                </option>
            ))}
        </select>
    );
});

export default SelectInput;
