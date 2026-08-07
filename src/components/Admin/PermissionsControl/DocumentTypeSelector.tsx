import React from 'react';
import clsx from 'clsx';
import styles from './styles.module.scss';
import { observer } from 'mobx-react-lite';
import { useStore } from '@tdev-hooks/useStore';
import Select, { StylesConfig } from 'react-select';
import { DocumentType, TypeModelMapping } from '@tdev-api/document';
import Button from '@tdev-components/shared/Button';

interface Props {}
const colourStyles: StylesConfig<{ value: DocumentType; hslDeg: number; label: DocumentType }, true> = {
    control: (styles) => ({ ...styles, backgroundColor: 'white' }),
    option: (styles, { data, isFocused, isSelected }) => {
        return {
            ...styles,
            backgroundColor: isFocused ? `hsl(${data.hslDeg}, 70%, 70%)` : undefined,
            color: `hsl(${data.hslDeg}, 100%, 25%)`
        };
    },
    multiValue: (styles, { data }) => {
        return {
            ...styles,
            backgroundColor: `hsl(${data.hslDeg}, 90%, 70%)`
        };
    },
    multiValueLabel: (styles, { data }) => ({
        ...styles,
        color: `hsl(${data.hslDeg}, 100%, 30%)`
    }),
    multiValueRemove: (styles, { data }) => ({
        ...styles,
        color: `hsl(${data.hslDeg}, 100%, 30%)`,
        ':hover': {
            backgroundColor: `hsl(${data.hslDeg}, 100%, 50%)`,
            color: 'white'
        }
    }),
    menuPortal: (base) => ({ ...base, zIndex: 'var(--ifm-z-index-overlay)' }),
    container: (base) => ({ ...base, minWidth: '15em' })
};

const DocumentTypeSelector = observer((props: Props) => {
    const viewStore = useStore('viewStore');
    const view = viewStore.permissionControl;

    return (
        <div className={clsx(styles.documentTypeSelector)}>
            <Select
                closeMenuOnSelect={false}
                menuPortalTarget={document.body}
                isMulti
                options={view.selectTypeOptions}
                value={view.selectTypeOptions.filter((opt) => view.typeFilter.has(opt.value))}
                onChange={(newVal, prop) => {
                    switch (prop.action) {
                        case 'clear':
                            return view.clearTypeFilter();
                        case 'remove-value':
                            if (prop.removedValue) {
                                return view.setTypeFilter(prop.removedValue.value, false);
                            }
                            break;
                        case 'select-option':
                            if (prop.option) {
                                return view.setTypeFilter(prop.option.value, true);
                            }
                            break;
                        case 'deselect-option':
                            if (prop.option) {
                                return view.setTypeFilter(prop.option.value, false);
                            }
                            break;
                    }
                }}
                styles={colourStyles}
            />
            <Button
                text="Alle"
                onClick={() => {
                    view.selectAllTypeFilters();
                }}
                className={clsx(styles.selectAllButton)}
            />
        </div>
    );
});

export default DocumentTypeSelector;
