import siteConfig from '@generated/docusaurus.config';
import { indexedDb } from '@tdev-api/base';
const { organizationName, projectName } = siteConfig;

const hasFileRequiredFiles = async (directoryHandle: FileSystemDirectoryHandle, fileNames: string[]) => {
    for (const fileName of fileNames) {
        const fileHandle = await directoryHandle
            .getFileHandle(fileName)
            .then(() => true)
            .catch(() => false);
        if (!fileHandle) {
            return false;
        }
    }
    return true;
};

export const FS_DocusaurusRootID = 'docusaurusRoot' as const;

export const restoreAccess = async (
    id: string,
    permission: FileSystemPermissionMode,
    assertFilePresence: string[]
) => {
    try {
        const dirHandle = await indexedDb.get<FileSystemDirectoryHandle>('fsHandles', id);
        if (dirHandle) {
            if ((await dirHandle.queryPermission({ mode: permission })) !== 'granted') {
                await dirHandle.requestPermission({ mode: permission });
            }
            const hasFiles = await hasFileRequiredFiles(dirHandle, assertFilePresence);
            if (!hasFiles) {
                await indexedDb.delete('fsHandles', id);
                return null;
            }
            return dirHandle;
        }
    } catch (err) {
        console.error(`Error retrieving ${id} from IndexedDB:`, err);
    }
};

const requestLocalDirectoryAccess = async (
    permission: FileSystemPermissionMode,
    assertFilePresence: string[],
    promptMessage: string,
    cacheKey?: string
) => {
    if (cacheKey) {
        const restoredHandle = await restoreAccess(cacheKey, permission, assertFilePresence);
        if (restoredHandle) {
            return restoredHandle;
        }
    }
    try {
        const confirmed = window.confirm(promptMessage);
        if (!confirmed) {
            return;
        }
        const directoryHandle = await window.showDirectoryPicker({
            mode: permission,
            id: `${organizationName}-${projectName}`.slice(0, 32)
        });
        const hasFiles = await hasFileRequiredFiles(directoryHandle, assertFilePresence);
        if (!hasFiles) {
            window.alert(
                `Der ausgewählte Ordner enthält nicht die benötigten Dateien (${assertFilePresence.join(', ')}). Bitte wähle den korrekten Projekt-Ordner aus.`
            );
            return;
        }
        const hasPermission = await directoryHandle.queryPermission({ mode: permission });
        if (hasPermission !== 'granted') {
            const grantedPermission = await directoryHandle.requestPermission({ mode: permission });
            if (grantedPermission !== 'granted') {
                window.alert(
                    'Der Zugriff auf den Ordner wurde nicht gewährt. Bitte erlaube den Zugriff auf diesen Ordner.'
                );
                return;
            }
        }
        if (cacheKey) {
            await indexedDb.put('fsHandles', directoryHandle, cacheKey);
        }
        return directoryHandle;
    } catch (err: any) {
        if (err.name !== 'AbortError') {
            // User cancelled
            console.error('File open error:', err);
            window.alert(
                'Es ist ein Fehler aufgetreten, der Zugriff auf diesen Ordner konnte nicht gewährt werden.'
            );
        }
    }
};

export default requestLocalDirectoryAccess;
