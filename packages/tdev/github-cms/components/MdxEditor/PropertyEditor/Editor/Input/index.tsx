import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import CodeEditor from '@tdev-components/shared/CodeEditor';
import Checkbox from '@tdev-components/shared/Checkbox';
import TextInput from '@tdev-components/shared/TextInput';
import Field from '@tdev-models/Form/Field';
import { action } from 'mobx';
import Select from 'react-select';

interface Props {
    field: Field<string>;
    onSaveNow?: () => void;
}

const Input = observer((props: Props) => {
    const { field } = props;
    if (field.type === 'expression') {
        return (
            <CodeEditor
                value={field.value}
                placeholder={field.placeholder || 'Wert'}
                onChange={action((val) => {
                    field.setValue(val);
                    if (field.saveOnChange) {
                        props.onSaveNow?.();
                    }
                })}
                className={clsx(styles.codeEditor)}
                lang={field.lang}
                hideLineNumbers
            />
        );
    }
    if (field.isCheckbox) {
        return (
            <Checkbox
                checked={typeof field.value === 'boolean' ? field.value : field.value === 'true'}
                onChange={(checked) => {
                    field.setValue(`${checked}`);
                    if (field.saveOnChange) {
                        props.onSaveNow?.();
                    }
                }}
            />
        );
    }
    if (field.isSelect) {
        if (field.type === 'select') {
            return (
                <Select
                    defaultValue={
                        field.required ? { label: field.options![0], value: field.options![0] } : undefined
                    }
                    isClearable={!field.required}
                    isSearchable
                    name={field.name}
                    options={field.options!.map((option) => ({ label: option, value: option }))}
                    value={{ label: field.value, value: field.value }}
                    onChange={(option) => {
                        field.setValue(option?.value || '');
                        if (field.saveOnChange) {
                            props.onSaveNow?.();
                        }
                    }}
                    menuPortalTarget={document.body}
                    styles={{
                        menuPortal: (base) => ({ ...base, zIndex: 999 }),
                        container: (base) => ({ ...base, width: '100%' })
                    }}
                />
            );
        }
        let multiOptions: { label: string; value: string }[] = [];
        try {
            multiOptions = (JSON.parse(field.value || '[]') as string[]).map((option) => ({
                label: option,
                value: option
            }));
        } catch (e) {
            console.log('Error parsing multi select', field.value, e);
        }
        return (
            <Select
                defaultValue={
                    field.required ? { label: field.options![0], value: field.options![0] } : undefined
                }
                isClearable={!field.required}
                isSearchable
                isMulti
                name={field.name}
                options={field.options!.map((option) => ({ label: option, value: option }))}
                value={multiOptions}
                onChange={(option) => {
                    field.setValue(JSON.stringify(option.map((option) => option.value) || []));
                    if (field.saveOnChange) {
                        props.onSaveNow?.();
                    }
                }}
                menuPortalTarget={document.body}
                styles={{
                    menuPortal: (base) => ({ ...base, zIndex: 999 }),
                    container: (base) => ({ ...base, width: '100%' })
                }}
            />
        );
    }
    return (
        <TextInput
            onChange={(val) => {
                field.setValue(val);
                if (field.saveOnChange) {
                    props.onSaveNow?.();
                }
            }}
            value={field.value}
            noAutoFocus
            noSpellCheck
            placeholder={field.placeholder}
            type={field.type}
            options={field.options}
        />
    );
});

export default Input;
