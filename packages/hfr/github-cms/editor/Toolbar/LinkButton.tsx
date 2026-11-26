import { mdiLink } from '@mdi/js';
import Button from '@tdev-components/shared/Button';
import { SIZE_S } from '@tdev-components/shared/iconSizes';
import { observer } from 'mobx-react-lite';
import { linkAtSelection } from '../commands';
import LinkPopover from '../components/LinkPopover';
import type MdxDocument from '../models/MdxDocument';

/**
 * Adds a link to the selection, or edits or removes the link at the cursor.
 */
const LinkButton = observer(({ document }: { document: MdxDocument }) => {
    const link = linkAtSelection(document.state);
    const title = link ? 'Link bearbeiten' : 'Link einfügen';
    return (
        <LinkPopover
            document={document}
            link={link}
            title={title}
            trigger={<Button icon={mdiLink} size={SIZE_S} title={title} active={!!link} />}
        />
    );
});

export default LinkButton;
