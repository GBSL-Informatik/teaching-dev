import { mdiLink } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import { observer } from 'mobx-react-lite';
import { linkAtSelection } from '../../commands';
import InlinePopover from '../../components/InlinePopover';
import type MdxDocument from '../../models/MdxDocument';
import LinkForm from './LinkForm';

/**
 * Adds a link to the selection, or edits or removes the link at the cursor.
 */
const LinkButton = observer(({ document }: { document: MdxDocument }) => {
    const link = linkAtSelection(document.state);
    const title = link ? 'Link bearbeiten' : 'Link einfügen';
    return (
        <InlinePopover
            title={title}
            onClose={() => document.focus()}
            trigger={<Button icon={mdiLink} size={SIZE_S} title={title} active={!!link} />}
        >
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

export default LinkButton;
