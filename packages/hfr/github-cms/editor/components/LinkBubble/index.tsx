import { mdiLink } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import type MdxDocument from '../../models/MdxDocument';
import LinkPopover from '../LinkPopover';
import styles from './styles.module.scss';
import { useBubblePosition } from './useBubblePosition';

interface Props {
    document: MdxDocument;
    /** the element the editor is mounted in, the bubble is positioned relative to it */
    container: HTMLElement | null;
}

const TITLE = 'Link bearbeiten';

/**
 * The url of the link at the cursor and a button below the link, it opens the popover to edit the link right there.
 */
const LinkBubble = observer(({ document, container }: Props) => {
    const [bubble, setBubble] = React.useState<HTMLDivElement | null>(null);
    const link = document.linkAtCursor;
    const view = document.view;
    const position = useBubblePosition(view, container, link?.from ?? null, bubble);
    if (!link || !view || !container || document.showDiff) {
        return null;
    }

    return (
        <div
            ref={setBubble}
            className={clsx(styles.bubble, !position && styles.measuring)}
            style={position ?? undefined}
        >
            <span className={clsx(styles.href)} title={link.attrs.href}>
                {link.attrs.href}
            </span>
            <LinkPopover
                document={document}
                link={link}
                title={TITLE}
                trigger={<Button icon={mdiLink} size={SIZE_S} title={TITLE} />}
            />
        </div>
    );
});

export default LinkBubble;
