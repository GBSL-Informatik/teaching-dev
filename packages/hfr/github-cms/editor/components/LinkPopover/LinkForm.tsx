import { mdiLinkOff } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import TextInput from '@tdev-components/shared/TextInput';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { removeLink, setLink } from '../../commands';
import type MdxDocument from '../../models/MdxDocument';
import styles from './styles.module.scss';

interface Props {
    document: MdxDocument;
    initialHref: string;
    /** whether an existing link is edited, which can be removed */
    isLink: boolean;
    onClose: () => void;
}

const LinkForm = observer(({ document, initialHref, isLink, onClose }: Props) => {
    const [href, setHref] = React.useState(initialHref);

    const handleApply = (event?: React.KeyboardEvent) => {
        // the editor gets focused, the enter key must not reach it
        event?.preventDefault();
        if (href) {
            document.run(setLink(href));
        }
        onClose();
    };

    const handleRemove = () => {
        document.run(removeLink);
        onClose();
    };

    return (
        <>
            <TextInput label="URL" value={href} onChange={setHref} onEnter={handleApply} noSpellCheck />
            <div className={clsx(styles.actions)}>
                {isLink && <Button icon={mdiLinkOff} text="Entfernen" color="red" onClick={handleRemove} />}
                <Button text="Abbrechen" onClick={onClose} />
                <Button text="Übernehmen" color="green" onClick={() => handleApply()} disabled={!href} />
            </div>
        </>
    );
});

export default LinkForm;
