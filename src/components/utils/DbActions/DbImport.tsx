import { mdiAlertOutline, mdiDatabaseImport } from '@mdi/js';
import { localDb } from '@tdev-api/base';
import { Confirm } from '@tdev-components/shared/Button/Confirm';
import customFields from '@tdev-components/utils/customFields';
import { useStore } from '@tdev-hooks/useStore';
import { observer } from 'mobx-react-lite';

const { tdevConfig } = customFields;

interface Props {}

const DbImport = observer((props: Props) => {
    const sessionStore = useStore('sessionStore');
    if (sessionStore.apiMode === 'api') {
        return;
    }
    if (tdevConfig.database?.preventImport) {
        return;
    }

    return (
        <Confirm
            icon={mdiDatabaseImport}
            text="Importieren"
            color="green"
            iconSide="left"
            confirmColor="warning"
            confirmText="Aktuell geladene Userdaten werden überschrieben. Fortfahren?"
            confirmIcon={mdiAlertOutline}
            onConfirm={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';
                input.onchange = (event) => {
                    const file = (event.target as HTMLInputElement).files?.[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = async (e) => {
                            try {
                                const jsonData = JSON.parse(e.target?.result as string);
                                await localDb.importDb(jsonData);
                                if (sessionStore.apiMode === 'indexedDB') {
                                    window.location.reload();
                                } else if (sessionStore.apiMode === 'memory') {
                                    const user = (await localDb.getAll('users')) as { id: string }[];
                                    if (user.length > 0) {
                                        sessionStore.root.cleanup();
                                        sessionStore.root.load(user[0].id);
                                    }
                                }
                            } catch (error) {
                                window.alert('Fehler beim Importieren der Daten: ' + error);
                            }
                        };
                        reader.onerror = () => {
                            window.alert('Fehler beim Lesen der Datei: ' + reader.error);
                        };
                        reader.readAsText(file);
                    }
                };
                input.click();
            }}
        />
    );
});

export default DbImport;
