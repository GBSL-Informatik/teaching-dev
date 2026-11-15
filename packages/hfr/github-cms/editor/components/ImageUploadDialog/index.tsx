import Card from '@tdev-components/shared/Card';
import { observer } from 'mobx-react-lite';
import Popup from 'reactjs-popup';
import FileUpload from '../../../components/FileUpload';
import type MdxDocument from '../../models/MdxDocument';

interface Props {
    document: MdxDocument;
}

/**
 * Asks for the name of an image dropped or pasted into the editor, uploads it to `./images` and inserts it.
 */
const ImageUploadDialog = observer(({ document }: Props) => {
    const { imageToUpload, file } = document;
    const handleClose = () => document.setImageToUpload(null);
    return (
        <Popup
            open={!!imageToUpload}
            onClose={handleClose}
            modal
            overlayStyle={{ background: 'rgba(0,0,0,0.5)' }}
        >
            {imageToUpload && (
                <Card header={<h4>Bild hochladen</h4>}>
                    <FileUpload
                        initialFiles={[imageToUpload.file]}
                        accept="image/*"
                        uploadDir={file.imageDirPath}
                        branch={file.branch}
                        uploadButtonLabel="Hochladen und einfügen"
                        onDiscard={handleClose}
                        onFileUploaded={(uploaded) =>
                            document.insertUploadedImage(file.relativePath(uploaded))
                        }
                    />
                </Card>
            )}
        </Popup>
    );
});

export default ImageUploadDialog;
