import Card from '@tdev-components/shared/Card';
import { observer } from 'mobx-react-lite';
import Popup from 'reactjs-popup';
import FileUpload from '../../../components/FileUpload';
import type MdxDocument from '../../models/MdxDocument';

interface Props {
    document: MdxDocument;
}

/**
 * Asks for the name of an image dropped into the editor, uploads it to `./images` and inserts it.
 */
const DroppedImageDialog = observer(({ document }: Props) => {
    const { droppedImage, file } = document;
    const handleClose = () => document.setDroppedImage(null);
    return (
        <Popup
            open={!!droppedImage}
            onClose={handleClose}
            modal
            overlayStyle={{ background: 'rgba(0,0,0,0.5)' }}
        >
            {droppedImage && (
                <Card header={<h4>Bild hochladen</h4>}>
                    <FileUpload
                        initialFiles={[droppedImage.file]}
                        accept="image/*"
                        uploadDir={file.imageDirPath}
                        branch={file.branch}
                        uploadButtonLabel="Hochladen und einfügen"
                        onDiscard={handleClose}
                        onFilesUploaded={(uploaded) =>
                            document.insertDroppedImage(file.relativePath(uploaded))
                        }
                    />
                </Card>
            )}
        </Popup>
    );
});

export default DroppedImageDialog;
