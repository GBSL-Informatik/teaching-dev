import { mdiLink, mdiLinkOff } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import Card from '@tdev-components/shared/Card';
import TextInput from '@tdev-components/shared/TextInput';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import Popup from 'reactjs-popup';
import type { PopupActions } from 'reactjs-popup/dist/types';
import { removeLink, setLink } from '../commands';
import type MdxDocument from '../models/MdxDocument';
import { schema } from '../schema';
import styles from './styles.module.scss';

/**
 * Adds a link to the selection, or removes the link at the cursor.
 */
const LinkButton = observer(({ document }: { document: MdxDocument }) => {
    const ref = React.useRef<PopupActions>(null);
    const [href, setHref] = React.useState('');
    if (document.isMarkActive(schema.marks.link)) {
        return (
            <Button
                icon={mdiLinkOff}
                size={SIZE_S}
                title="Link entfernen"
                active
                onClick={() => document.run(removeLink)}
            />
        );
    }
    const handleApply = (event?: React.KeyboardEvent) => {
        // the editor gets focused, the enter key must not reach it
        event?.preventDefault();
        if (href) {
            document.run(setLink(href));
        }
        ref.current?.close();
    };
    return (
        <Popup
            ref={ref}
            trigger={
                <span>
                    <Button icon={mdiLink} size={SIZE_S} title="Link einfügen" />
                </span>
            }
            onOpen={() => setHref('')}
            on="click"
            position="bottom center"
            keepTooltipInside="#__docusaurus"
            arrow={false}
        >
            <Card classNames={{ card: clsx(styles.linkCard) }}>
                <TextInput label="URL" value={href} onChange={setHref} onEnter={handleApply} noSpellCheck />
                <div className={clsx(styles.linkActions)}>
                    <Button text="Abbrechen" onClick={() => ref.current?.close()} />
                    <Button text="Übernehmen" color="green" onClick={() => handleApply()} disabled={!href} />
                </div>
            </Card>
        </Popup>
    );
});

export default LinkButton;
