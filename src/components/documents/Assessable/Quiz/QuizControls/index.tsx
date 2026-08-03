import styles from './styles.module.scss';
import { Confirm } from '@tdev-components/shared/Button/Confirm';
import { observer } from 'mobx-react-lite';
import { mdiCheckboxMarkedCircleAutoOutline, mdiCheckboxMarkedCircleMinusOutline, mdiRestore } from '@mdi/js';
import QuizDocument from '@tdev-models/documents/Assessable/Quiz';
import clsx from 'clsx';
import useIsMobileView from '@tdev-hooks/useIsMobileView';

interface QuizControlsProps {
    doc: QuizDocument;
}

export const QuizControls = observer(({ doc }: QuizControlsProps) => {
    const isMobileView = useIsMobileView();
    const missingCount = doc.hasNA ? `trotz ${doc.naCount} fehlender Frage${doc.naCount > 1 ? 'n' : ''}` : '';

    return (
        <div className={clsx(styles.quizControlsContainer)}>
            {doc.isAssessed ? (
                <Confirm
                    text="Quiz zurücksetzen"
                    title="Alle Antworten zurücksetzen und Quiz neu beginnen"
                    color="secondary"
                    icon={mdiRestore}
                    iconSide="left"
                    size={0.7}
                    className={clsx(styles.checkButton)}
                    confirmText={isMobileView ? 'Sicher?' : 'Wirklich zurücksetzen?'}
                    onConfirm={() => {
                        doc.reset();
                    }}
                />
            ) : (
                <Confirm
                    text="Quiz beenden"
                    title={`Quiz ${missingCount}beenden und Antworten prüfen. Danach ist keine Bearbeitung der Antworten mehr möglich.`}
                    color={doc.hasNA ? 'warning' : 'success'}
                    icon={
                        doc.hasNA ? mdiCheckboxMarkedCircleMinusOutline : mdiCheckboxMarkedCircleAutoOutline
                    }
                    iconSide="left"
                    size={0.7}
                    className={clsx(styles.checkButton)}
                    confirmText={isMobileView ? 'Wirklich beenden?' : 'Quiz beenden und Antworten prüfen?'}
                    onConfirm={() => doc.setAssessed(true)}
                />
            )}
        </div>
    );
});

export default QuizControls;
