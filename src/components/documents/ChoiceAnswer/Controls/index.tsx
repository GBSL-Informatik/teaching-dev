import styles from './styles.module.scss';
import { Confirm } from '@tdev-components/shared/Button/Confirm';
import Button from '@tdev-components/shared/Button';
import SyncStatus from '@tdev-components/SyncStatus';
import { observer } from 'mobx-react-lite';
import { mdiCheckboxMarkedCircleAutoOutline, mdiRestore } from '@mdi/js';
import ChoiceAnswerDocument from '@tdev-models/documents/Quiz/ChoiceAnswer';
import clsx from 'clsx';
import useIsMobileView from '@tdev-hooks/useIsMobileView';

interface ControlsProps {
    doc: ChoiceAnswerDocument;
    focussedQuestion?: boolean;
    inQuiz?: boolean;
}

const QuestionControls = observer(({ doc, focussedQuestion: isFocussedQuestion, inQuiz }: ControlsProps) => {
    const isMobileView = useIsMobileView();

    if (!doc) {
        return null;
    }

    const syncStatus = isFocussedQuestion && <SyncStatus model={doc} size={0.7} />;

    if (inQuiz) {
        return <div className={clsx(styles.questionControlsContainer)}>{syncStatus}</div>;
    }
    return (
        <div className={clsx(styles.questionControlsContainer)}>
            {syncStatus}
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
                        doc.resetAnswer();
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

interface QuizControlsProps {
    doc: ChoiceAnswerDocument;
}

export const QuizControls = observer(({ doc }: QuizControlsProps) => {
    const isMobileView = useIsMobileView();

    return (
        <div className={styles.quizControlsContainer}>
            {!doc.isAssessed /*&& doc.assessments.size > 0 */ && (
                <Confirm
                    text="Quiz beenden"
                    title="Quiz beenden und Antworten prüfen. Danach ist keine Bearbeitung der Antworten mehr möglich."
                    color="success"
                    icon={mdiCheckboxMarkedCircleAutoOutline}
                    iconSide="left"
                    size={0.7}
                    className={styles.checkButton}
                    confirmText={isMobileView ? 'Wirklich beenden?' : 'Quiz beenden und Antworten prüfen?'}
                    onConfirm={() => doc.setAssessed(true)}
                />
            )}
            {doc.isAssessed && (
                <Confirm
                    text="Quiz zurücksetzen"
                    title="Alle Antworten zurücksetzen und Quiz neu beginnen"
                    color="secondary"
                    icon={mdiRestore}
                    iconSide="left"
                    size={0.7}
                    className={styles.checkButton}
                    confirmText={isMobileView ? 'Sicher?' : 'Wirklich zurücksetzen?'}
                    onConfirm={() => {
                        doc.resetAnswer();
                    }}
                />
            )}
        </div>
    );
});

export default QuestionControls;
