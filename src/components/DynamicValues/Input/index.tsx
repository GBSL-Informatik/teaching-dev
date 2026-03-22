import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import TextInput from '@tdev-components/shared/TextInput';
import Button from '@tdev-components/shared/Button';
import { mdiRestore, mdiSync } from '@mdi/js';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import Page from '@tdev-models/Page';

interface Props {
    name: string;
    default?: string | ((page: Page) => string);
    label?: string;
    onRecalculate?: (page: Page) => string;
    placeholder?: string;
    monospace?: boolean;
    hidden?: boolean;
}

const DynamicInputPlaceholder = (props: {
    value: string;
    label?: string;
    placeholder?: string;
    monospace?: boolean;
    derived?: boolean;
}) => {
    return (
        <div className={clsx(styles.dynamicInput)}>
            <TextInput
                noAutoFocus
                value={props.value}
                onChange={() => {}}
                label={props.label}
                placeholder={props.placeholder}
                className={clsx(styles.input, props.monospace && styles.monospace)}
                labelClassName={clsx(styles.label, props.derived && styles.derived)}
                readOnly
            />
        </div>
    );
};

const DynamicInput = observer((props: Props) => {
    const pageStore = useStore('pageStore');
    const { current } = pageStore;
    const isDerived = typeof props.default === 'function';
    React.useEffect(() => {
        if (current && !current.dynamicValues.has(props.name)) {
            current.setDynamicValue(
                props.name,
                typeof props.default === 'function' ? props.default(current) : props.default
            );
        }
    }, [props.default, props.name, current]);
    const defaultValue =
        typeof props.default === 'function' ? (current ? props.default(current) : '') : props.default;
    React.useEffect(() => {
        if (current && isDerived && defaultValue !== undefined) {
            // always update the dynamic value for derived inputs, so that they reflect changes in the page state
            current.setDynamicValue(props.name, defaultValue);
        }
    }, [current, defaultValue, isDerived, props.name]);
    if (props.hidden) {
        return null;
    }
    if (!current) {
        return (
            <DynamicInputPlaceholder
                value={defaultValue || ''}
                label={props.label || props.name}
                placeholder={props.placeholder}
                monospace={props.monospace}
                derived={isDerived}
            />
        );
    }
    const value = current.dynamicValues.get(props.name);
    const needsReset = defaultValue !== undefined && value !== defaultValue;
    return (
        <div className={clsx(styles.dynamicInput)}>
            <TextInput
                noAutoFocus
                value={value ?? defaultValue ?? ''}
                onChange={(val) => {
                    current.setDynamicValue(props.name, val);
                }}
                defaultValue={defaultValue}
                label={props.label || props.name}
                title={isDerived ? 'Abgeleiteter Wert' : undefined}
                labelClassName={clsx(styles.label, isDerived && styles.derived)}
                className={clsx(styles.input, props.monospace && styles.monospace)}
                placeholder={props.placeholder}
            />
            <div className={clsx(styles.action)}>
                {needsReset && (
                    <Button
                        className={clsx(styles.resetButton)}
                        icon={mdiRestore}
                        onClick={() => {
                            current.setDynamicValue(props.name, defaultValue);
                        }}
                        color="secondary"
                        size={SIZE_S}
                        title="Zurücksetzen"
                    />
                )}
                {props.onRecalculate && (
                    <Button
                        className={clsx(styles.recalculateButton)}
                        icon={mdiSync}
                        onClick={() => {
                            current.setDynamicValue(props.name, props.onRecalculate?.(current));
                        }}
                        color="secondary"
                        size={SIZE_S}
                        title="Neu berechnen"
                    />
                )}
            </div>
        </div>
    );
});

export default DynamicInput;
