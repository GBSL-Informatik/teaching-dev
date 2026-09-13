import { mdiHarddiskRemove } from '@mdi/js';
import { localDb } from '@tdev-api/base';
import { Confirm } from '@tdev-components/shared/Button/Confirm';
import customFields from '@tdev-components/utils/customFields';
import { useStore } from '@tdev-hooks/useStore';
import { observer } from 'mobx-react-lite';

const { tdevConfig } = customFields;

interface Props {}

const DbDestroy = observer((props: Props) => {
    const sessionStore = useStore('sessionStore');
    if (sessionStore.apiMode === 'api') {
        return;
    }
    if (tdevConfig.database?.preventDestroy) {
        return;
    }

    return (
        <Confirm
            text="Jetzt Löschen"
            confirmText={
                sessionStore.apiMode === 'indexedDB'
                    ? 'Wirklich alle gespeicherten Daten löschen?'
                    : undefined
            }
            icon={mdiHarddiskRemove}
            iconSide="left"
            onConfirm={() => {
                localDb
                    .destroyDb?.()
                    .then(() => {
                        console.log('Lokale Daten gelöscht');
                        window.location.reload();
                    })
                    .catch((err) => {
                        window.alert('Fehler beim Löschen der Lokalen Daten: ' + err.message);
                    });
            }}
            color="red"
            confirmColor="red"
        />
    );
});

export default DbDestroy;
