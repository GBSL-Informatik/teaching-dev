import React from 'react';
import _ from 'lodash';
import Card from '@tdev-components/shared/Card';
import { useForm } from 'react-hook-form';
import styles from './styles.module.scss';
import Button from '@tdev-components/shared/Button';
import { mdiCloseCircle, mdiContentSave } from '@mdi/js';
import { Delete } from '@tdev-components/shared/Button/Delete';

/* @see https://github.com/mdx-editor/editor/blob/main/src/plugins/core/PropertyPopover.tsx */

export interface Props {
    /**
     * The properties to edit. The key is the name of the property, and the value is the initial value.
     */
    defaultValues: Record<string, string | boolean | number | undefined | null>;
    properties: Record<string, string | boolean | number | undefined | null>;
    meta?: Record<string, { type: React.HTMLInputTypeAttribute; description: string }>;
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
}

const Editor = (props: Props) => {
    const { properties, defaultValues, meta, title } = props;
    const { register, handleSubmit, reset } = useForm({ defaultValues: { ...defaultValues, ...properties } });
    return (
        <Card header={title && <h4>{title}</h4>} classNames={{ card: styles.editor }}>
            {
                <form
                    onSubmit={handleSubmit((data) => {
                        const res: Record<string, string> = {};
                        Object.entries(data).forEach(([key, val]) => {
                            const defVal = defaultValues[key];
                            const value = `${val}`;
                            if (defVal === val || defVal === value || `${defVal}` === value) {
                                return;
                            }
                            res[key] = value;
                        });
                        props.onChange(res);
                        props.onClose?.();
                    })}
                >
                    <table className={styles.propertyEditorTable}>
                        <thead>
                            <tr>
                                <th className={styles.readOnlyColumnCell}>Attribut</th>
                                <th>Wert</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.keys(defaultValues).map((propName) => (
                                <tr key={propName}>
                                    <th className={styles.readOnlyColumnCell}>{propName}</th>
                                    <td>
                                        <input
                                            {...register(propName)}
                                            className={styles.propertyEditorInput}
                                            type={meta?.[propName]?.type || 'string'}
                                            title={meta?.[propName]?.description}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan={2}>
                                    <div className={styles.buttonsFooter}>
                                        <Button
                                            icon={mdiCloseCircle}
                                            color="black"
                                            text="Abbrechen"
                                            type="reset"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                reset(properties);
                                                props.onClose?.();
                                            }}
                                            iconSide="left"
                                        />
                                        {props.onRemove && <Delete onDelete={props.onRemove} />}
                                        <Button
                                            icon={mdiContentSave}
                                            color="green"
                                            text="Speichern"
                                            type="submit"
                                        />
                                    </div>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </form>
            }
        </Card>
    );
};

export default Editor;
