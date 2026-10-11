import { mdiAlert } from '@mdi/js';
import Icon from '@mdi/react';
import Alert from '@tdev-components/shared/Alert';
import { SIZE_M } from '@tdev-components/shared/iconSizes';
import { DocumentRootIdContext } from '@tdev-hooks/useContextDocumentRootId';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import React from 'react';
import styles from './styles.module.scss';

interface Props {
    documentRootId: string;
    children: React.ReactNode;
    className?: string;
}

const OfflineQuiz = observer((props: Props) => {
    return (
        <div className={clsx(styles.offlineQuiz, props.className)}>
            <Alert type="warning">
                <h3 className={styles.title}>
                    Offline Quiz
                    <Icon
                        path={mdiAlert}
                        color="var(--ifm-color-warning)"
                        size={SIZE_M}
                        title="Einloggen um Quiz auszufüllen."
                        className={clsx(styles.icon)}
                    />
                </h3>
                <small>Antworten werden nicht gespeichert und das Quiz kann nicht bewertet werden.</small>
            </Alert>
            <DocumentRootIdContext id={props.documentRootId}>
                <div className={clsx(styles.content)}>{props.children}</div>
            </DocumentRootIdContext>
        </div>
    );
});

export default OfflineQuiz;
