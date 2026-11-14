import { observer } from 'mobx-react-lite';
import Popup from 'reactjs-popup';
import { insertInline } from '../../commands';
import type MdxDocument from '../../models/MdxDocument';
import { schema } from '../../schema';
import ImageDialog from '../ImageDialog';

interface Props {
    document: MdxDocument;
}

/**
 * The dialog to insert an image at the cursor, opened with `document.setImageDialogOpen`.
 */
const InsertImageDialog = observer(({ document }: Props) => {
    const handleClose = () => document.setImageDialogOpen(false);
    return (
        <Popup
            open={document.isImageDialogOpen}
            onClose={handleClose}
            modal
            overlayStyle={{ background: 'rgba(0,0,0,0.5)' }}
        >
            <ImageDialog
                onClose={handleClose}
                onSelect={(src) => document.run(insertInline(schema.nodes.image.create({ src })))}
            />
        </Popup>
    );
});

export default InsertImageDialog;
