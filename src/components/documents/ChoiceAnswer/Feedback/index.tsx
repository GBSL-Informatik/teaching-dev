import { mdiCheckCircleOutline, mdiCloseCircleOutline, mdiProgressCheck, mdiProgressQuestion } from '@mdi/js';
import Icon from '@mdi/react';
import ChoiceAnswerDocument, { ChoiceAnswerCorrectness } from '@tdev-models/documents/ChoiceAnswer';
import { observer } from 'mobx-react-lite';
import styles from './styles.module.scss';
import React from 'react';
import clsx from 'clsx';
import { QuestionScoringHint } from '../Hints';
import useIsMobileView from '@tdev-hooks/useIsMobileView';

interface FeedbackBadgeProps {
    doc: ChoiceAnswerDocument;
    questionIndex: number;
}

export const FeedbackBadge = observer(({ doc, questionIndex }: FeedbackBadgeProps) => {
    const isMobileView = useIsMobileView();

    if (!doc) {
        return;
    }

    const assessment = doc.assessments.get(questionIndex);
    if (!assessment) {
        return;
    }

    let icon;
    let color;
    switch (assessment.correctness) {
        case ChoiceAnswerCorrectness.Correct:
            icon = mdiCheckCircleOutline;
            color = '--ifm-color-success';
            break;
        case ChoiceAnswerCorrectness.PartiallyCorrect:
            icon = mdiProgressCheck;
            color = '--ifm-color-warning';
            break;
        case ChoiceAnswerCorrectness.Incorrect:
            icon = mdiCloseCircleOutline;
            color = '--ifm-color-danger';
            break;
        case ChoiceAnswerCorrectness.NA:
            icon = mdiProgressQuestion;
            color = '--ifm-color-info';
            break;
    }

    return (
        <div className={styles.feedbackBadge}>
            {assessment.scoring && (
                <QuestionScoringHint
                    doc={doc}
                    questionIndex={questionIndex}
                    trigger={
                        <span className={clsx('badge badge--secondary', styles.pointsBadge)}>
                            {doc.assessed && <span>{assessment.scoring.pointsAchieved}/</span>}
                            {assessment.scoring.maxPoints}
                            {isMobileView ? 'p' : assessment.scoring.maxPoints === 1 ? ' Punkt' : ' Punkte'}
                        </span>
                    }
                />
            )}
            {!assessment.scoring && doc.hasQuestionsWithScoring && (
                <QuestionScoringHint doc={doc} questionIndex={questionIndex} />
            )}
            {icon && doc.assessed && <Icon path={icon} color={`var(${color})`} size={1} />}
        </div>
    );
});

interface QuizScoreProps {
    doc: ChoiceAnswerDocument;
    minPoints?: number;
}

export const QuizScore = observer(({ doc, minPoints }: QuizScoreProps) => {
    const isMobileView = useIsMobileView();

    if (!doc || doc.assessments.size === 0) {
        return;
    }

    let totalPointsAchieved = 0;
    let totalMaxPoints = 0;
    doc.assessments.forEach((assessment) => {
        if (assessment.scoring) {
            totalPointsAchieved += assessment.scoring.pointsAchieved;
            totalMaxPoints += assessment.scoring.maxPoints;
        }
    });

    if (totalMaxPoints === 0) {
        // No scoring, so we don't show anything.
        return;
    }

    if (minPoints !== undefined) {
        totalPointsAchieved = Math.max(totalPointsAchieved, minPoints);
    }

    const wideScreenBadge = (
        <>
            {!doc.assessed && <span>Zu erreichen: </span>}
            {doc.assessed && <span>Ergebnis: {totalPointsAchieved} /</span>} {totalMaxPoints}{' '}
            {totalMaxPoints === 1 ? 'Punkt' : 'Punkte'}
        </>
    );

    const mobileViewBadge = (
        <>
            {!doc.assessed && <span>Max.: {totalMaxPoints}p</span>}
            {doc.assessed && (
                <span>
                    {totalPointsAchieved}/{totalMaxPoints}p
                </span>
            )}
        </>
    );

    return (
        <span className={clsx('badge badge--primary', styles.pointsBadge)}>
            {isMobileView ? mobileViewBadge : wideScreenBadge}
        </span>
    );
});
