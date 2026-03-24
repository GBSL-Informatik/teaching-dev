import styles from './styles.module.scss';
import { Confirm } from '@tdev-components/shared/Button/Confirm';
import Button from '@tdev-components/shared/Button';
import SyncStatus from '@tdev-components/SyncStatus';
import { observer } from 'mobx-react-lite';
import { mdiCheckboxMarkedCircleAutoOutline, mdiRestore } from '@mdi/js';
import ChoiceAnswerDocument from '@tdev-models/documents/ChoiceAnswer';
import clsx from 'clsx';

interface ControlsProps {
    doc: ChoiceAnswerDocument;
    questionIndex: number;
    focussedQuestion?: boolean;
    inQuiz?: boolean;
    inHeader?: boolean;
}

const QuestionControls = observer(
    ({ doc, focussedQuestion: isFocussedQuestion, inQuiz, inHeader }: ControlsProps) => {
        if (!doc) {
            return;
        }

        const syncStatus = isFocussedQuestion && <SyncStatus model={doc} size={0.7} />;

        const checkOrResetButton = !inQuiz && (
            <>
                {!doc.assessed && (
                    <Button
                        text="Prüfen"
                        title="Antwort prüfen und Frage als bewertet markieren. Danach ist keine Bearbeitung der Antworten mehr möglich."
                        color="success"
                        icon={mdiCheckboxMarkedCircleAutoOutline}
                        iconSide="left"
                        size={0.7}
                        className={styles.checkButton}
                        onClick={() => (doc.assessed = true)}
                    />
                )}
                {doc.assessed && (
                    <Confirm
                        text="Zurücksetzen"
                        title="Antwort zurücksetzen."
                        color="secondary"
                        icon={mdiRestore}
                        iconSide="left"
                        size={0.7}
                        className={styles.checkButton}
                        confirmText="Wirklich zurücksetzen?"
                        onConfirm={() => {
                            doc.assessed = false;
                            doc.resetAllAnswers();
                        }}
                    />
                )}
            </>
        );

        return (
            <div className={clsx(styles.questionControlsContainer, { [styles.inHeader]: inHeader })}>
                {syncStatus}
                {checkOrResetButton}
            </div>
        );
    }
);

interface QuizControlsProps {
    doc: ChoiceAnswerDocument;
}

export const QuizControls = observer(({ doc }: QuizControlsProps) => {
    return (
        <div className={styles.quizControlsContainer}>
            {!doc.assessed && doc.assessments.size > 0 && (
                <Confirm
                    text="Quiz beenden"
                    title="Quiz beenden und Antworten prüfen. Danach ist keine Bearbeitung der Antworten mehr möglich."
                    color="success"
                    icon={mdiCheckboxMarkedCircleAutoOutline}
                    iconSide="left"
                    size={0.7}
                    className={styles.checkButton}
                    confirmText="Quiz beenden und Antworten prüfen?"
                    onConfirm={() => (doc.assessed = true)}
                />
            )}
            {doc.assessed && (
                <Confirm
                    text="Quiz zurücksetzen"
                    title="Alle Antworten zurücksetzen und Quiz neu beginnen"
                    color="secondary"
                    icon={mdiRestore}
                    iconSide="left"
                    size={0.7}
                    className={styles.checkButton}
                    confirmText="Wirklich zurücksetzen?"
                    onConfirm={() => {
                        doc.assessed = false;
                        doc.resetAllAnswers();
                    }}
                />
            )}
        </div>
    );
});

export default QuestionControls;
