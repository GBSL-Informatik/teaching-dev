import { mdiPencil } from '@mdi/js';
import Header from '@tdev-components/BrowserWindow/Header';
import Button from '@tdev-components/shared/Button';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { stringAttribute, withStringAttributes } from '../../../jsxAttributes';
import type { ContainerFormat, JsxAttribute } from '../../../schema';
import type { NodeViewProps } from '../../ReactNodeView';
import AddressEditor, { type Address } from './AddressEditor';
import styles from './styles.module.scss';

/**
 * The header of `<BrowserWindow>`, as it is rendered on the page.
 * Its address (the `url` and `href` attributes) can be edited in place.
 */
const BrowserWindowHeader = observer(({ handle }: NodeViewProps) => {
    const [isEditing, setIsEditing] = React.useState(false);
    const attributes: JsxAttribute[] = handle.node.attrs.attributes;
    const format: ContainerFormat | null = handle.node.attrs.format;
    const url = stringAttribute(attributes, 'url');
    const href = stringAttribute(attributes, 'href');

    const handleApply = (address: Address) => {
        const updated = withStringAttributes(attributes, { url: address.url, href: address.href });
        if (updated === attributes) {
            return;
        }
        handle.updateAttrs({
            attributes: updated,
            // the original opening tag is outdated
            format: format && { ...format, openingTag: undefined }
        });
    };

    const addressBar = isEditing ? (
        <AddressEditor
            address={{ url: url ?? '', href: href ?? '' }}
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
