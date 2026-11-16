import Alert from '@tdev-components/shared/Alert';
import { useStore } from '@tdev-hooks/useStore';
import type { OfflineDbProblem } from '@tdev-stores/SessionStore';
import { observer } from 'mobx-react-lite';
import React from 'react';
import styles from './styles.module.scss';

const MESSAGES: Record<OfflineDbProblem, string> = {
    blocked:
        'Diese Seite ist in einem anderen Tab geöffnet. Schliesse die anderen Tabs und lade die Seite neu, damit deine Änderungen gespeichert werden können.',
    unavailable:
        'Der lokale Speicher deines Browsers ist nicht verfügbar, z.B. weil Website-Daten blockiert sind. Deine Änderungen können nicht gespeichert werden.',
    migrationFailed:
        'Deine gespeicherten Daten konnten nicht aktualisiert werden. Sie bleiben erhalten, aber neue Änderungen können nicht gespeichert werden.'
};

const OfflineDbWarning = observer(() => {
    const sessionStore = useStore('sessionStore');
    const problem = sessionStore.offlineDbProblem;
    const handleDiscard = React.useCallback(() => sessionStore.dismissOfflineDbProblem(), [sessionStore]);
    if (!problem || problem === sessionStore.dismissedOfflineDbProblem) {
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
