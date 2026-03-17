import styles from './styles.module.scss';
import { Confirm } from '@tdev-components/shared/Button/Confirm';
import Button from '@tdev-components/shared/Button';
import SyncStatus from '@tdev-components/SyncStatus';
import { observer } from 'mobx-react-lite';
import { mdiCheckboxMarkedCircleAutoOutline, mdiRestore } from '@mdi/js';
import ChoiceAnswerDocument from '@tdev-models/documents/ChoiceAnswer';

interface Props {
    doc: ChoiceAnswerDocument;
    questionIndex: number;
    focussedQuestion?: boolean;
    inQuiz?: boolean;
}

const QuestionControls = observer(({ doc, focussedQuestion: isFocussedQuestion, inQuiz }: Props) => {
    if (!doc) {
        return;
    }

    const syncStatus = isFocussedQuestion && <SyncStatus model={doc} size={0.7} />;

    // TODO: Hide if in quiz.
    const checkOrResetButton = !inQuiz && (
        <>
            {!doc.graded && (
                <Button
                    text="Prüfen"
                    title="Antwort prüfen und Frage als bewertet markieren. Danach ist keine Bearbeitung der Antworten mehr möglich."
                    color="success"
                    icon={mdiCheckboxMarkedCircleAutoOutline}
                    iconSide="left"
                    size={0.7}
                    className={styles.checkButton}
                    onClick={() => (doc.graded = true)}
                />
            )}
            {doc.graded && (
                <Confirm
                    text="Zurücksetzen"
                    title="Antwort zurücksetzen."
                    color="warning"
                    icon={mdiRestore}
                    iconSide="left"
                    size={0.7}
                    className={styles.checkButton}
                    confirmText="Wirklich zurücksetzen?"
                    onConfirm={() => {
                        doc.graded = false;
                        doc.resetAllAnswers();
                    }}
                />
            )}
        </>
    );

    return (
        <div className={styles.controlsContainer}>
            {syncStatus}
            {checkOrResetButton}
        </div>
    );
});

export const QuizCheckOrResetButton = observer(({ doc }: { doc: ChoiceAnswerDocument }) => {
    return (
        <div className={styles.quizCheckOrResetButtonContainer}>
            {!doc.graded && (
                <Confirm
                    text="Quiz beenden"
                    title="Quiz beenden und Antworten prüfen. Danach ist keine Bearbeitung der Antworten mehr möglich."
                    color="success"
                    icon={mdiCheckboxMarkedCircleAutoOutline}
                    iconSide="left"
                    size={0.7}
                    className={styles.checkButton}
                    confirmText="Quiz beenden und Antworten prüfen?"
                    onConfirm={() => (doc.graded = true)}
                />
            )}
            {doc.graded && (
                <Confirm
                    text="Zurücksetzen"
                    title="Quiz zurücksetzen."
                    color="warning"
                    icon={mdiRestore}
                    iconSide="left"
                    size={0.7}
                    className={styles.checkButton}
                    confirmText="Wirklich zurücksetzen?"
                    onConfirm={() => {
                        doc.graded = false;
                        doc.resetAllAnswers();
                    }}
                />
            )}
        </div>
    );
});

export default QuestionControls;
