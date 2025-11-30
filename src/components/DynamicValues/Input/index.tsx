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
    last?: boolean;
    derived?: boolean;
    hidden?: boolean;
}

const DynamicInput = observer((props: Props) => {
    const pageStore = useStore('pageStore');
    const { current } = pageStore;
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
        if (current && props.derived && defaultValue) {
            current.setDynamicValue(props.name, defaultValue);
        }
    }, [current, defaultValue, props.derived]);
    if (!current) {
        return null;
    }
    const value = current.dynamicValues.get(props.name);
    const needsReset = defaultValue && value !== defaultValue;
    if (props.hidden) {
        return null;
    }
    return (
        <div className={clsx(styles.dynamicInput, props.last && styles.last)}>
            <TextInput
                noAutoFocus
                value={value ?? defaultValue ?? ''}
                onChange={(val) => {
                    current.setDynamicValue(props.name, val);
                }}
                defaultValue={defaultValue}
                label={props.label || props.name}
                title={props.derived ? 'Abgeleiteter Wert' : undefined}
                labelClassName={clsx(styles.label, props.derived && styles.derived)}
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
                            current.setDynamicValue(props.name, props.onRecalculate!(current));
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
