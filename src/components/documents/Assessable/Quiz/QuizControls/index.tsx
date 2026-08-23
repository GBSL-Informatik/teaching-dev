import styles from './styles.module.scss';
import { Confirm } from '@tdev-components/shared/Button/Confirm';
import { observer } from 'mobx-react-lite';
import {
    mdiCheckboxMarkedCircleAutoOutline,
    mdiCheckboxMarkedCircleMinusOutline,
    mdiEraser,
    mdiRestore
} from '@mdi/js';
import QuizDocument from '@tdev-models/documents/Assessable/Quiz';
import clsx from 'clsx';
import useIsMobileView from '@tdev-hooks/useIsMobileView';
import { Correctness } from '@tdev-models/documents/Assessable/iAssessable';

interface QuizControlsProps {
    doc: QuizDocument;
    resetMode: 'all' | 'incorrect' | 'noReset';
    shuffleOnReset?: boolean;
}

export const QuizControls = observer(({ doc, resetMode, shuffleOnReset }: QuizControlsProps) => {
    const isMobileView = useIsMobileView();

    if (!doc.isAssessed) {
        const missingCount = doc.hasNA
            ? `trotz ${doc.naCount} fehlender Frage${doc.naCount > 1 ? 'n' : ''}`
            : '';
        return (
            <div className={clsx(styles.quizControlsContainer)}>
                <Confirm
                    text={isMobileView ? 'Beenden' : 'Quiz beenden'}
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
            </div>
        );
    }
    if (resetMode === 'noReset') {
        return null;
    }

    return (
        <div className={clsx(styles.quizControlsContainer)}>
            {resetMode === 'incorrect' && doc.assessment?.correctness !== Correctness.Correct && (
                <Confirm
                    text={isMobileView ? undefined : 'Korrigieren'}
                    title="Alle fehlerhaften Antworten zurücksetzen"
                    color="secondary"
                    icon={mdiEraser}
                    iconSide="left"
                    size={0.7}
                    className={clsx(styles.checkButton)}
                    confirmText={'Wirklich korrigieren?'}
                    confirmColor="orange"
                    onConfirm={() => {
                        doc.resetFaulty();
                        if (shuffleOnReset) {
                            doc.reshuffle();
                        }
                    }}
                />
            )}
            <Confirm
                text={isMobileView ? undefined : 'Quiz zurücksetzen'}
                title="Alle Antworten zurücksetzen und Quiz neu beginnen"
                color="secondary"
                icon={mdiRestore}
                iconSide="left"
                size={0.7}
                className={clsx(styles.checkButton)}
                confirmText={'Wirklich zurücksetzen?'}
                confirmColor="red"
                onConfirm={() => {
                    doc.reset();
                    if (shuffleOnReset) {
                        doc.reshuffle();
                    }
                }}
            />
        </div>
    );
});

export default QuizControls;
