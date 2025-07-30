import siteConfig from '@generated/docusaurus.config';
const { organizationName, projectName } = siteConfig;

const requestLocalDirectoryAccess = async (
    permission: FileSystemPermissionMode,
    assertFilePresence: string[]
) => {
    try {
        const directoryHandle = await window.showDirectoryPicker({
            mode: permission,
            id: `${organizationName}-${projectName}`
        });
        for (const fileName of assertFilePresence) {
            const fileHandle = await directoryHandle
                .getFileHandle(fileName)
                .then(() => true)
                .catch(() => false);
            if (!fileHandle) {
                window.alert(
                    `Die Datei "${fileName}" ist im ausgewählten Ordner nicht vorhanden. Bitte wähle den Ordner aus, der diese Datei enthält.`
                );
                return;
            }
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
