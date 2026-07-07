import { rootStore } from '@tdev-stores/rootStore';
import requestLocalDirectoryAccess, { FS_DocusaurusRootID } from './requestLocalDirectoryAccess';

const requestDocusaurusRootAcess = async () => {
    if (!('showOpenFilePicker' in self)) {
        window.alert(
            'Die File System Access API wird von deinem Browser nicht unterstützt. Bitte verwende einen kompatiblen Browser (z.B. Chrome, Edge).'
        );
        return;
    }
    const directoryHandle = await requestLocalDirectoryAccess(
        'readwrite',
        ['docusaurus.config.ts'],
        'Wähle den Projekt-Ordner aus (der Ordner, in welchem sich "docusaurus.config.ts" befindet).',
        FS_DocusaurusRootID
    );
    if (directoryHandle) {
        rootStore.sessionStore.setFileSystemDirectoryHandle('root', directoryHandle);
    } else {
        rootStore.sessionStore.setFileSystemDirectoryHandle('root');
    }
    return directoryHandle;
};
export default requestDocusaurusRootAcess;
