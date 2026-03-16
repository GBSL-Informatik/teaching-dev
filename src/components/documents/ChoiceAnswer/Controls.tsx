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
}

const Controls = observer(({ doc, questionIndex, focussedQuestion: isFocussedQuestion }: Props) => {
    if (!doc) {
        return;
    }

    // TODO: Potentially factor out grade / reset buttons, since they shouldn't show on a per-question basis in case of a quiz.
    // TODO: Hide grade / reset button per question in quiz, show on quiz level.
    const syncStatus = isFocussedQuestion && (
        <div className={styles.controlsContainer}>
            <SyncStatus model={doc} size={0.7} />
            {!doc.graded && (
                <Button
                    text="Prüfen"
                    title="Antworten prüfen und Frage als bewertet markieren. Danach ist keine Bearbeitung der Antworten mehr möglich."
                    color="success"
                    icon={mdiCheckboxMarkedCircleAutoOutline}
                    iconSide="left"
                    size={0.7}
                    onClick={() => (doc.graded = true)}
                />
            )}
            {doc.graded && (
                <Confirm
                    text="Zurücksetzen"
                    title="Antworten zurücksetzen."
                    color="warning"
                    icon={mdiRestore}
                    iconSide="left"
                    size={0.7}
                    confirmText="Antwort zurücksetzen?"
                    onConfirm={() => {
                        doc.graded = false;
                        doc.resetAnswer(questionIndex);
                    }}
                />
            )}
        </div>
    );

    return <div className={styles.controlsContainer}>{syncStatus}</div>;
});

export default Controls;
