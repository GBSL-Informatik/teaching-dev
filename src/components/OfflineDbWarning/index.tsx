import Alert from '@tdev-components/shared/Alert';
import { useStore } from '@tdev-hooks/useStore';
import type { OfflineDbProblem } from '@tdev-stores/SessionStore';
import { observer } from 'mobx-react-lite';
import React from 'react';
import styles from './styles.module.scss';

const MESSAGES: Record<OfflineDbProblem, string> = {
    blocked:
        'Die Website ist in einem anderen Tab mit einer älteren Version geöffnet. Schliesse diesen Tab, damit deine Änderungen gespeichert werden können.',
    outdated:
        'Die Website wurde in einem anderen Tab aktualisiert. Lade diese Seite neu, damit deine Änderungen gespeichert werden.',
    unavailable:
        'Der lokale Speicher deines Browsers ist nicht verfügbar, z.B. weil Website-Daten blockiert sind. Deine Änderungen können nicht gespeichert werden.',
    migrationFailed:
        'Deine gespeicherten Daten konnten nicht aktualisiert werden. Sie bleiben erhalten, aber neue Änderungen können nicht gespeichert werden.'
};

const OfflineDbWarning = observer(() => {
    const sessionStore = useStore('sessionStore');
    const problem = sessionStore.offlineDbProblem;
    const handleDiscard = React.useCallback(() => sessionStore.dismissOfflineDbWarning(), [sessionStore]);
    if (!problem || sessionStore.offlineDbWarningDismissed) {
        return null;
    }
    return (
        <Alert
            type={problem === 'blocked' ? 'warning' : 'danger'}
            className={styles.warning}
            onDiscard={handleDiscard}
        >
            {MESSAGES[problem]}
        </Alert>
    );
});

export default OfflineDbWarning;
