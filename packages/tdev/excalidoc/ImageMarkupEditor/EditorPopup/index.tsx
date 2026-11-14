import requestDocusaurusRootAcess from '@tdev-components/utils/localFS/requestDocusaurusRootAcess';
import { useStore } from '@tdev-hooks/useStore';
import { observer } from 'mobx-react-lite';
import extractExalidrawImageName from '../helpers/extractExalidrawImageName';
import ImageEditorPopup from '../ImageEditorPopup';
import { fsImageStorage } from '../storage';

interface Props {
    src: string;
    className?: string;
}

/**
 * Edits an image of the docusaurus root directory, using the File System Access API (dev mode).
 */
const EditorPopup = observer((props: Props) => {
    const sessionStore = useStore('sessionStore');

    const openStorage = async () => {
        if (!sessionStore.fileSystemDirectoryHandles.get('root')) {
            const hasAccess = await requestDocusaurusRootAcess();
            if (!hasAccess) {
                return null;
            }
        }
        const root = sessionStore.fileSystemDirectoryHandles.get('root');
        if (!root) {
            window.alert('Kein Zugriff auf lokale Dateien. Bitte aktiviere den Zugriff.');
            return null;
        }
        return fsImageStorage(root, props.src);
    };

    return (
        <ImageEditorPopup
            className={props.className}
            mimeType={extractExalidrawImageName(props.src).mimeType}
            openStorage={openStorage}
        />
    );
});

export default EditorPopup;
