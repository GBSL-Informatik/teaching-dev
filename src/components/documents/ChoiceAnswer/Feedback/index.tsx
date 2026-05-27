import Icon from '@mdi/react';
import ChoiceAnswerDocument from '@tdev-models/documents/Quiz/ChoiceAnswer';
import { observer } from 'mobx-react-lite';
import styles from './styles.module.scss';
import React from 'react';
import clsx from 'clsx';
import { QuestionScoringHint } from '../Hints';
import useIsMobileView from '@tdev-hooks/useIsMobileView';

interface FeedbackBadgeProps {
    doc: ChoiceAnswerDocument;
}

export const FeedbackBadge = observer(({ doc }: FeedbackBadgeProps) => {
    const isMobileView = useIsMobileView();

    if (!doc || !doc.isAssessed) {
        return null;
    }
    const { icon, color } = doc.correctnessIconColor;

    return (
        <div className={styles.feedbackBadge}>
            {doc.assessment?.scoring && (
                <QuestionScoringHint
                    doc={doc}
                    trigger={
                        <span className={clsx('badge badge--secondary', styles.pointsBadge)}>
                            {doc.isAssessed && <span>{doc.assessment.scoring.pointsAchieved}/</span>}
                            {doc.assessment.scoring.maxPoints}
                            {isMobileView
                                ? 'p'
                                : doc.assessment.scoring.maxPoints === 1
                                  ? ' Punkt'
                                  : ' Punkte'}
                        </span>
                    }
                />
            )}
            {!doc.assessment?.scoring && <QuestionScoringHint doc={doc} />}
            {icon && doc.isAssessed && <Icon path={icon} color={`var(${color})`} size={1} />}
        </div>
    );
});

interface QuizScoreProps {
    doc: ChoiceAnswerDocument;
    minPoints?: number;
}

export const QuizScore = observer(({ doc, minPoints }: QuizScoreProps) => {
    const isMobileView = useIsMobileView();

    if (!doc || !doc.isAssessed) {
        return null;
    }
    return 'TODO: QuizScore component not implemented yet.';
    // let totalPointsAchieved = 0;
    // let totalMaxPoints = 0;
    // doc.assessments.forEach((assessment) => {
    //     if (assessment.scoring) {
    //         totalPointsAchieved += assessment.scoring.pointsAchieved;
    //         totalMaxPoints += assessment.scoring.maxPoints;
    //     }
    // });

    // if (totalMaxPoints === 0) {
    //     // No scoring, so we don't show anything.
    //     return;
    // }

    // if (minPoints !== undefined) {
    //     totalPointsAchieved = Math.max(totalPointsAchieved, minPoints);
    // }

    // const wideScreenBadge = (
    //     <>
    //         {!doc.isAssessed && <span>Zu erreichen: </span>}
    //         {doc.isAssessed && <span>Ergebnis: {totalPointsAchieved} /</span>} {totalMaxPoints}{' '}
    //         {totalMaxPoints === 1 ? 'Punkt' : 'Punkte'}
    //     </>
    // );

    // const mobileViewBadge = (
    //     <>
    //         {!doc.isAssessed && <span>Max.: {totalMaxPoints}p</span>}
    //         {doc.isAssessed && (
    //             <span>
    //                 {totalPointsAchieved}/{totalMaxPoints}p
    //             </span>
    //         )}
    //     </>
    // );

    // return (
    //     <span className={clsx('badge badge--primary', styles.pointsBadge)}>
    //         {isMobileView ? mobileViewBadge : wideScreenBadge}
    //     </span>
    // );
});
