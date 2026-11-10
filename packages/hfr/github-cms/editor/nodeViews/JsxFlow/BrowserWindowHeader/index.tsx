import { mdiPencil } from '@mdi/js';
import Header from '@tdev-components/BrowserWindow/Header';
import Button from '@tdev-components/shared/Button';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import StringAttributesForm, { type Field } from '../../../components/StringAttributesForm';
import { stringAttribute, withJsxAttributes, withStringAttributes } from '../../../jsxAttributes';
import type { JsxAttribute } from '../../../schema';
import type { NodeViewProps } from '../../ReactNodeView';
import styles from './styles.module.scss';

const ADDRESS_FIELDS: Field[] = [
    { name: 'url', title: 'Die angezeigte Adresse (url)' },
    { name: 'href', title: 'Der Link der Adresse (href)' }
];

/**
 * The header of `<BrowserWindow>`, as it is rendered on the page.
 * Its address (the `url` and `href` attributes) can be edited in place.
 */
const BrowserWindowHeader = observer(({ handle }: NodeViewProps) => {
    const [isEditing, setIsEditing] = React.useState(false);
    const attributes: JsxAttribute[] = handle.node.attrs.attributes;
    const url = stringAttribute(attributes, 'url');
    const href = stringAttribute(attributes, 'href');

    const handleApply = (values: Record<string, string>) => {
        const updated = withStringAttributes(attributes, values);
        if (updated === attributes) {
            return;
        }
        handle.updateAttrs(withJsxAttributes(handle.node, updated));
    };

    const addressBar = isEditing ? (
        <StringAttributesForm
            fields={ADDRESS_FIELDS}
            values={{ url: url ?? '', href: href ?? '' }}
            onApply={handleApply}
            onClose={() => setIsEditing(false)}
        />
    ) : (
        <span className={clsx(styles.address)}>
            <span className={clsx(styles.url, 'text--truncate')}>
                {url || href || 'http://localhost:3000'}
            </span>
            <Button
                icon={mdiPencil}
                size={SIZE_S}
                title="Adresse bearbeiten"
                noBorder
                className={clsx(styles.editButton)}
                onClick={() => setIsEditing(true)}
            />
        </span>
    );

    return <Header url={url} href={href} addressBar={addressBar} />;
});

export default BrowserWindowHeader;
