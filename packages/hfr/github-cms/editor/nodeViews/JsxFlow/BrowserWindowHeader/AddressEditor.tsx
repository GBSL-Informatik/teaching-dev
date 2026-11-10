import { mdiCheck, mdiClose } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import clsx from 'clsx';
import React from 'react';
import styles from './styles.module.scss';

export interface Address {
    url: string;
    href: string;
}

interface Props {
    address: Address;
    onApply: (address: Address) => void;
    onClose: () => void;
}

/**
 * Edits the `url` (the shown address) and the `href` (the link) of a `<BrowserWindow>`.
 * Enter applies, Escape cancels.
 */
const AddressEditor = (props: Props) => {
    const [address, setAddress] = React.useState(props.address);

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        props.onApply(address);
        props.onClose();
    };
    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            props.onClose();
        }
    };

    return (
        <form className={clsx(styles.addressEditor)} onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
            <input
                value={address.url}
                placeholder="url"
                title="Die angezeigte Adresse (url)"
                autoFocus
                onChange={(event) => setAddress({ ...address, url: event.target.value })}
            />
            <input
                value={address.href}
                placeholder="href"
                title="Der Link der Adresse (href)"
                onChange={(event) => setAddress({ ...address, href: event.target.value })}
            />
            <Button icon={mdiCheck} size={SIZE_S} type="submit" color="green" title="Übernehmen" />
            <Button icon={mdiClose} size={SIZE_S} title="Abbrechen" onClick={props.onClose} />
        </form>
    );
};

export default AddressEditor;
