import React from 'react';
import _ from 'es-toolkit/compat';
import Card from '@tdev-components/shared/Card';
import styles from './styles.module.scss';
import Button from '@tdev-components/shared/Button';
import { mdiCircleSmall, mdiClose, mdiContentSave, mdiIdentifier, mdiRestore, mdiSync } from '@mdi/js';
import { Delete } from '@tdev-components/shared/Button/Delete';
import clsx from 'clsx';
import { GenericPropery } from '../../GenericAttributeEditor';
import useIsMobileView from '@tdev-hooks/useIsMobileView';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import Icon from '@mdi/react';
import TextInput from '@tdev-components/shared/TextInput';
import { v4 as uuidv4 } from 'uuid';
import Form from '@tdev-models/Form';
import { observer } from 'mobx-react-lite';
import Input from './Input';

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

const DEFAULT_VALUE = '' as const;

const Editor = observer((props: Props) => {
    const { properties, title } = props;
    const form = React.useMemo(() => {
        return new Form<string>(properties, DEFAULT_VALUE);
    }, [properties]);
    const [newAttrName, setNewAttrName] = React.useState<string>('');
    const [newAttrValue, setNewAttrValue] = React.useState<string>('');
    const isMobile = useIsMobileView(768);
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
                        onClick={() => {
                            props.onChange(form.values);
                            props.onClose?.();
                        }}
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
                                {isMobile && <th>Wert</th>}
                                <th className={styles.readOnlyColumnCell}>Beschreibung</th>
                                {!isMobile && <th>Wert</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {form.fields.map((field, idx) => {
                                return (
                                    <tr key={idx}>
                                        <th className={styles.title}>
                                            {field.name}
                                            {field.isDirty && (
                                                <Icon
                                                    path={mdiCircleSmall}
                                                    size={1}
                                                    color="var(--ifm-color-warning)"
                                                    className={clsx(styles.dirtyIndicator)}
                                                />
                                            )}
                                        </th>
                                        {!isMobile && (
                                            <td className={styles.description}>{field.description}</td>
                                        )}

                                        <td className={clsx(styles.propertyEditorCell)}>
                                            <div className={clsx(styles.content)}>
                                                <Input
                                                    field={field}
                                                    onSaveNow={() => {
                                                        props.onChange(form.values);
                                                    }}
                                                />
                                                {field.resettable /** || field.onRecalc */ && (
                                                    <div className={clsx(styles.spacer)} />
                                                )}
                                                {field.canRegenerateValue && (
                                                    <Button
                                                        icon={mdiSync}
                                                        onClick={() => {
                                                            field.regenerateValue();
                                                        }}
                                                        size={SIZE_S}
                                                        title="Neu berechnen"
                                                    />
                                                )}
                                                {field.isDirty && (
                                                    <Button
                                                        icon={mdiRestore}
                                                        onClick={() => {
                                                            field.resetValue();
                                                        }}
                                                        size={SIZE_S}
                                                        color="orange"
                                                        title="Änderungen verwerfen"
                                                    />
                                                )}
                                                {field.isRemovable && (
                                                    <Button
                                                        icon={mdiClose}
                                                        onClick={() => {
                                                            form.removeField(field.name);
                                                        }}
                                                        size={SIZE_S}
                                                        color="red"
                                                        title="Entfernen"
                                                    />
                                                )}
                                            </div>
                                        </td>
                                        {isMobile && (
                                            <td className={styles.description}>{field.description}</td>
                                        )}
                                    </tr>
                                );
                            })}
                            {props.canExtend && (
                                <tr>
                                    <td>
                                        <TextInput
                                            placeholder="Neues Attribut..."
                                            value={newAttrName}
                                            required
                                            onChange={(value) => {
                                                setNewAttrName(value || '');
                                            }}
                                        />
                                    </td>
                                    <td colSpan={2}>
                                        <div className={clsx(styles.addAttribute)}>
                                            <TextInput
                                                value={newAttrValue}
                                                placeholder={'Wert...'}
                                                onChange={(value) => {
                                                    setNewAttrValue(value || '');
                                                }}
                                                type="text"
                                                required
                                            />
                                            <Button
                                                icon={mdiIdentifier}
                                                title="Neue UUIDv4 einfügen"
                                                color="blue"
                                                size={SIZE_S}
                                                onClick={() => {
                                                    setNewAttrValue(uuidv4());
                                                }}
                                            />
                                            <Button
                                                text="Hinzufügen"
                                                disabled={
                                                    !newAttrName.replaceAll(' ', '') ||
                                                    !newAttrValue.trim() ||
                                                    !!form.find(newAttrValue.replaceAll(' ', ''))
                                                }
                                                color="blue"
                                                onClick={() => {
                                                    const newName = newAttrName.replaceAll(' ', '');
                                                    const newVal = newAttrValue.trim();
                                                    if (newName && newVal && !form.find(newName)) {
                                                        form.setValue(newAttrName, newAttrValue);
                                                        setNewAttrName('');
                                                        setNewAttrValue('');
                                                    }
                                                }}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </form>
            }
        </Card>
    );
});

export default Editor;
