import { observer } from 'mobx-react-lite';
import React from 'react';
import type { LinkRange } from '../../commands';
import type MdxDocument from '../../models/MdxDocument';
import InlinePopover from '../InlinePopover';
import LinkForm from './LinkForm';

interface Props {
    document: MdxDocument;
    /** the link to edit, `null` to add a link */
    link: LinkRange | null;
    title: string;
    trigger: React.ReactElement;
}

/**
 * Adds, edits or removes a link in a popover, opened from the toolbar or from the link bubble.
 */
const LinkPopover = observer(({ document, link, title, trigger }: Props) => {
    return (
        <InlinePopover title={title} onClose={() => document.focus()} trigger={trigger} closeButton>
            {(close) => (
                <LinkForm
                    document={document}
                    initialHref={link?.attrs.href ?? ''}
                    isLink={!!link}
                    onClose={close}
                />
            )}
        </InlinePopover>
    );
});

export default LinkPopover;
