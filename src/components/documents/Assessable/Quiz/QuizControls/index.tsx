import styles from './styles.module.scss';
import { Confirm } from '@tdev-components/shared/Button/Confirm';
import { observer } from 'mobx-react-lite';
import { mdiCheckboxMarkedCircleAutoOutline, mdiRestore } from '@mdi/js';
import QuizDocument from '@tdev-models/documents/Assessable/Quiz';
import clsx from 'clsx';
import useIsMobileView from '@tdev-hooks/useIsMobileView';

interface QuizControlsProps {
    doc: QuizDocument;
}

export const QuizControls = observer(({ doc }: QuizControlsProps) => {
    const isMobileView = useIsMobileView();

    return (
        <div className={clsx(styles.quizControlsContainer)}>
            {!doc.isAssessed /*&& doc.assessments.size > 0 */ && (
                <Confirm
                    text="Quiz beenden"
                    title="Quiz beenden und Antworten prüfen. Danach ist keine Bearbeitung der Antworten mehr möglich."
                    color="success"
                    icon={mdiCheckboxMarkedCircleAutoOutline}
                    iconSide="left"
                    size={0.7}
                    className={clsx(styles.checkButton)}
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
                    className={clsx(styles.checkButton)}
                    confirmText={isMobileView ? 'Sicher?' : 'Wirklich zurücksetzen?'}
                    onConfirm={() => {
                        doc.reset();
                    }}
                />
            )}
        </div>
    );
});

export default QuizControls;
