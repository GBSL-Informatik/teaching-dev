import React from 'react';
import _ from 'lodash';
import Card from '@tdev-components/shared/Card';
import { useForm } from 'react-hook-form';
import styles from './styles.module.scss';
import Button from '@tdev-components/shared/Button';
import { mdiCircleSmall, mdiClose, mdiContentSave, mdiRestore, mdiSync } from '@mdi/js';
import { Delete } from '@tdev-components/shared/Button/Delete';
import clsx from 'clsx';
import CodeEditor from '@tdev-components/shared/CodeEditor';
import { GenericPropery } from '../../GenericAttributeEditor';
import useIsMobileView from '@tdev-hooks/useIsMobileView';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import Icon from '@mdi/react';

/* @see https://github.com/mdx-editor/editor/blob/main/src/plugins/core/PropertyPopover.tsx */

export interface Props {
    /**
     * The properties to edit. The key is the name of the property, and the value is the initial value.
     */
    properties: GenericPropery[];
    /**
     * Triggered when the user edits the property values.
     */
    onChange: (values: Record<string, string>) => void;
    /**
     * The title to display in the popover.
     */
    title?: string;
    onRemove?: () => void;
    onClose?: () => void;
    canExtend?: boolean;
}

const isCheckbox = (type: string) => {
    return type === 'checkbox' || type === 'boolean';
};

const getInputType = (type?: React.HTMLInputTypeAttribute): React.HTMLInputTypeAttribute => {
    if (!type) {
        return 'string';
    }
    if (isCheckbox(type)) {
        return 'checkbox';
    }
    return type;
};

const DEFAULT_VALUE = '' as const;

const Editor = (props: Props) => {
    const { properties, title } = props;
    const initValues = React.useMemo(() => {
        return properties.reduce<Record<string, string | number>>((acc, { value, name, type }) => {
            acc[name] = value || DEFAULT_VALUE;
            return acc;
        }, {});
    }, [properties]);
    const { register, handleSubmit, setValue, watch, resetField, formState } = useForm({
        defaultValues: initValues
    });
    const isMobile = useIsMobileView(768);

    React.useEffect(() => {
        const subscription = watch((value, { name }) => {
            const prop = properties.find((p) => p.name === name);
            if (!prop) {
                return;
            }
            if (prop.sideEffect) {
                const sideEffects = prop.sideEffect(value, initValues);
                if (sideEffects) {
                    sideEffects.forEach(({ name, value }) => {
                        setValue(name, value, { shouldDirty: true });
                    });
                }
            }
        });
        return () => subscription.unsubscribe();
    }, [watch, initValues, properties, setValue]);

    return (
        <Card
            header={title && <h4>{title}</h4>}
            classNames={{ card: styles.editor, body: styles.body }}
            footer={
                <div className={clsx('button-group', 'button-group--block')}>
                    <Button
                        onClick={(e) => {
                            e.preventDefault();
                            props.onClose?.();
                        }}
                        icon={mdiClose}
                        color="black"
                        iconSide="left"
                    >
                        Abbrechen
                    </Button>
                    {props.onRemove && <Delete onDelete={props.onRemove} />}
                    <Button
                        icon={mdiContentSave}
                        color={'green'}
                        iconSide="right"
                        onClick={handleSubmit((data) => {
                            const res: Record<string, string> = {};
                            Object.entries(data).forEach(([key, val]) => {
                                res[key] = `${val}`;
                            });
                            props.onChange(res);
                            props.onClose?.();
                        })}
                    >
                        Speichern
                    </Button>
                </div>
            }
        >
            {
                <form>
                    <table className={styles.propertyEditorTable}>
                        <thead>
                            <tr>
                                <th className={styles.readOnlyColumnCell}>Attribut</th>
                                {!isMobile && <th>Wert</th>}
                                <th className={styles.readOnlyColumnCell}>Beschreibung</th>
                                {isMobile && <th>Wert</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {properties.map((prop) => (
                                <tr key={prop.name}>
                                    <th className={styles.title}>
                                        {prop.name}
                                        {formState.dirtyFields[prop.name] && (
                                            <Icon
                                                path={mdiCircleSmall}
                                                size={1}
                                                color="var(--ifm-color-warning)"
                                                className={clsx(styles.dirtyIndicator)}
                                            />
                                        )}
                                    </th>
                                    {!isMobile && (
                                        <td className={styles.readOnlyColumnCell}>{prop.description}</td>
                                    )}

                                    <td className={clsx(styles.propertyEditorCell)}>
                                        <div className={clsx(styles.content)}>
                                            {prop.type === 'expression' ? (
                                                <CodeEditor
                                                    defaultValue={(prop.value || DEFAULT_VALUE).trim()}
                                                    placeholder={prop.placeholder || 'Wert'}
                                                    onChange={(value) => {
                                                        setValue(prop.name, value, {
                                                            shouldDirty: value !== prop.value
                                                        });
                                                    }}
                                                    className={clsx(styles.codeEditor)}
                                                    lang={prop.lang}
                                                    hideLineNumbers
                                                />
                                            ) : (
                                                <input
                                                    {...register(prop.name)}
                                                    onChange={(e) => {
                                                        const val = isCheckbox(prop.type)
                                                            ? e.target.checked
                                                                ? 'true'
                                                                : ''
                                                            : e.target.value;
                                                        setValue(prop.name, val, {
                                                            shouldDirty: true
                                                        });
                                                    }}
                                                    className={styles.propertyEditorInput}
                                                    type={getInputType(prop.type)}
                                                    title={prop.description}
                                                    placeholder={
                                                        prop.placeholder ? `${prop.placeholder}` : undefined
                                                    }
                                                />
                                            )}
                                            {(prop.onRecalc || prop.resettable) && (
                                                <div className={clsx(styles.spacer)} />
                                            )}
                                            {prop.resettable && formState.dirtyFields[prop.name] && (
                                                <Button
                                                    icon={mdiRestore}
                                                    onClick={() => {
                                                        resetField(prop.name, {
                                                            keepDirty: false,
                                                            keepTouched: false
                                                        });
                                                    }}
                                                    size={SIZE_S}
                                                    title="Änderungen verwerfen"
                                                />
                                            )}
                                            {prop.onRecalc && (
                                                <Button
                                                    icon={mdiSync}
                                                    onClick={() => {
                                                        const newVal = prop.onRecalc?.();
                                                        if (newVal) {
                                                            setValue(prop.name, newVal, {
                                                                shouldDirty: true,
                                                                shouldTouch: true
                                                            });
                                                        }
                                                    }}
                                                    size={SIZE_S}
                                                    title="Neu berechnen"
                                                />
                                            )}
                                        </div>
                                    </td>
                                    {isMobile && (
                                        <td className={styles.readOnlyColumnCell}>{prop.description}</td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </form>
            }
        </Card>
    );
};

export default Editor;
