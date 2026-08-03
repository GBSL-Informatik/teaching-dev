import styles from './styles.module.scss';
import { Confirm } from '@tdev-components/shared/Button/Confirm';
import Button from '@tdev-components/shared/Button';
import SyncStatus from '@tdev-components/SyncStatus';
import { observer } from 'mobx-react-lite';
import { mdiCheckboxMarkedCircleAutoOutline, mdiRestore } from '@mdi/js';
import clsx from 'clsx';
import useIsMobileView from '@tdev-hooks/useIsMobileView';
import type { AssessableType, AssessableTypeModelMapping } from '@tdev-api/document';

interface ControlsProps<T extends AssessableType> {
    doc: AssessableTypeModelMapping[T];
}

const QuestionControls = observer(<T extends AssessableType>(props: ControlsProps<T>) => {
    const { doc } = props;
    const isMobileView = useIsMobileView();

    if (!doc) {
        return null;
    }

    if (doc.inQuiz) {
        return (
            <div className={clsx(styles.questionControlsContainer)}>
                <SyncStatus model={doc} size={0.7} />
            </div>
        );
    }
    return (
        <div className={clsx(styles.questionControlsContainer)}>
            <SyncStatus model={doc} size={0.7} />
            {doc.isAssessed ? (
                <Confirm
                    text={isMobileView ? '' : 'Zurücksetzen'}
                    title="Antwort zurücksetzen."
                    color="secondary"
                    icon={mdiRestore}
                    iconSide="left"
                    size={0.7}
                    className={styles.checkButton}
                    confirmText={isMobileView ? 'Sicher?' : 'Wirklich zurücksetzen?'}
                    onConfirm={() => {
                        doc.reset();
                    }}
                />
            ) : (
                <Button
                    text={isMobileView ? '' : 'Prüfen'}
                    title="Antwort prüfen und Frage als bewertet markieren. Danach ist keine Bearbeitung der Antworten mehr möglich."
                    color="success"
                    icon={mdiCheckboxMarkedCircleAutoOutline}
                    iconSide="left"
                    size={0.7}
                    className={styles.checkButton}
                    onClick={() => doc.setAssessed(true)}
                />
            )}
        </div>
    );
});

export default QuestionControls;
