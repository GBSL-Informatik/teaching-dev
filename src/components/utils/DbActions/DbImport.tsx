import React from 'react';
import { observer } from 'mobx-react-lite';
import { mdiAlertOutline, mdiDatabaseImport } from '@mdi/js';
import { useStore } from '@tdev-hooks/useStore';
import { Confirm } from '@tdev-components/shared/Button/Confirm';
import { localDb } from '@tdev-api/base';
import customFields from '@tdev-components/utils/customFields';

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
                        reader.onload = (e) => {
                            try {
                                const jsonData = JSON.parse(e.target?.result as string);
                                localDb.importDb(jsonData).then(() => {
                                    window.location.reload();
                                });
                            } catch (error) {
                                window.alert('Fehler beim Importieren der Daten: ' + error);
                            }
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
