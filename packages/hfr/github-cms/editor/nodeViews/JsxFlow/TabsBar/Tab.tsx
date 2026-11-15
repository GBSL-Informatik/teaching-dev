import { mdiPencil } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import clsx from 'clsx';
import type { Node } from 'prosemirror-model';
import React from 'react';
import StringAttributesForm, { type Field } from '../../../components/StringAttributesForm';
import { stringAttribute } from '../../../jsxAttributes';
import type { JsxAttribute } from '../../../schema';
import { tabLabel } from '../../../tabs';
import styles from './styles.module.scss';

const TAB_FIELDS: Field[] = [
    { name: 'label', title: 'Die Beschriftung des Tabs (label)' },
    {
        name: 'value',
        title: 'Der eindeutige Wert des Tabs (value), wird von Docusaurus benötigt',
        required: true
    }
];

interface Props {
    tabItem: Node;
    isActive: boolean;
    onSelect: () => void;
    onApply: (values: Record<string, string>) => void;
}

/**
 * The tab of a `<TabItem>`, its label and value can be edited in place.
 */
const Tab = ({ tabItem, isActive, onSelect, onApply }: Props) => {
    const [isEditing, setIsEditing] = React.useState(false);
    const attributes: JsxAttribute[] = tabItem.attrs.attributes;

    if (isEditing) {
        return (
            <li className={clsx('tabs__item', styles.tab, styles.editing)}>
                <StringAttributesForm
                    fields={TAB_FIELDS}
                    values={{
                        label: stringAttribute(attributes, 'label') ?? '',
                        value: stringAttribute(attributes, 'value') ?? ''
                    }}
                    onApply={onApply}
                    onClose={() => setIsEditing(false)}
                />
            </li>
        );
    }

    const handleEdit = (event: React.MouseEvent) => {
        // editing must not select the tab, which moves the focus to the document
        event.stopPropagation();
        setIsEditing(true);
    };

    return (
        <li
            role="tab"
            aria-selected={isActive}
            className={clsx('tabs__item', styles.tab, isActive && 'tabs__item--active')}
            onClick={onSelect}
        >
            {tabLabel(tabItem) || 'Tab'}
            <Button
                icon={mdiPencil}
                size={SIZE_S}
                noBorder
                title="Label und Wert bearbeiten"
                className={clsx(styles.editButton)}
                onClick={handleEdit}
            />
        </li>
    );
};

export default Tab;
