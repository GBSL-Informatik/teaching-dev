import { useStore } from '@tdev-hooks/useStore';
import type { OfflineDbProblem } from '@tdev-stores/SessionStore';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
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
    if (!problem) {
        return null;
    }
    const isBlocked = problem === 'blocked';
    return (
        <div
            className={clsx('alert', isBlocked ? 'alert--warning' : 'alert--danger', styles.warning)}
            role="alert"
        >
            {MESSAGES[problem]}
        </div>
    );
});

export default OfflineDbWarning;
