import Card from '@tdev-components/shared/Card';
import { observer } from 'mobx-react-lite';
import Popup from 'reactjs-popup';
import Dir from '../../../models/Dir';
import FileUpload from '../../FileUpload';

export interface DroppedFiles {
    dir: Dir;
    files: File[];
}

interface Props {
    upload: DroppedFiles | null;
    onClose: () => void;
}

/**
 * Asks for the name of a file dropped on a folder and uploads it to that folder.
 */
const UploadDialog = observer(({ upload, onClose }: Props) => {
    return (
        <Popup open={!!upload} onClose={onClose} modal overlayStyle={{ background: 'rgba(0,0,0,0.5)' }}>
            {upload && (
                <Card header={<h4>Datei hochladen</h4>}>
                    <FileUpload
                        initialFiles={upload.files}
                        uploadDir={upload.dir.path}
                        branch={upload.dir.branch}
                        uploadButtonLabel="Hochladen"
                        onDiscard={onClose}
                        onFileUploaded={onClose}
                    />
                </Card>
            )}
        </Popup>
    );
});

export default UploadDialog;
