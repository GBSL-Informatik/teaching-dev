import Icon from '@mdi/react';
import ChoiceAnswerDocument from '@tdev-models/documents/Assessable/ChoiceAnswer';
import { observer } from 'mobx-react-lite';
import styles from './styles.module.scss';
import React from 'react';
import clsx from 'clsx';
import { QuestionScoringHint } from '../Hints';
import useIsMobileView from '@tdev-hooks/useIsMobileView';
import { IfmColors } from '@tdev-components/shared/Colors';
import { Correctness } from '@tdev-models/documents/Assessable/iAssessable';
import { mdiCheckCircleOutline, mdiCloseCircleOutline, mdiProgressCheck, mdiProgressQuestion } from '@mdi/js';
import type { AssessableType, AssessableTypeModelMapping } from '@tdev-api/document';
import Quiz from '@tdev-models/documents/Assessable/Quiz';
import Badge from '@tdev-components/shared/Badge';

interface FeedbackBadgeProps<T extends AssessableType> {
    doc: AssessableTypeModelMapping[T];
}

const ICONS_BY_CORRECTNESS: Record<Correctness, string> = {
    [Correctness.Correct]: mdiCheckCircleOutline,
    [Correctness.Incorrect]: mdiCloseCircleOutline,
    [Correctness.PartiallyCorrect]: mdiProgressCheck,
    [Correctness.NA]: mdiProgressQuestion
};

const COLORS_BY_CORRECTNESS: Record<Correctness, keyof typeof IfmColors> = {
    [Correctness.Correct]: 'green',
    [Correctness.Incorrect]: 'red',
    [Correctness.PartiallyCorrect]: 'orange',
    [Correctness.NA]: 'lightBlue'
};

export const FeedbackBadge = observer(<T extends AssessableType>(props: FeedbackBadgeProps<T>) => {
    const { doc } = props;
    const isMobileView = useIsMobileView();

    if (!doc || !doc.isAssessed) {
        return null;
    }

    const maxPointsText = isMobileView
        ? `${doc.maxPoints}p`
        : `${doc.maxPoints} Punkt${doc.maxPoints !== 1 ? 'e' : ''}`;

    return (
        <div className={styles.feedbackBadge}>
            {doc.assessment?.scoring && (
                <QuestionScoringHint
                    doc={doc}
                    trigger={
                        <span>
                            <Badge type="secondary" className={styles.pointsBadge}>
                                {doc.isAssessed && `${doc.assessment.scoring.pointsAchieved}/`}
                                {maxPointsText}
                            </Badge>
                        </span>
                        // <span className={clsx('badge badge--secondary', styles.pointsBadge)}>
                        //     {doc.isAssessed && <span>{doc.assessment.scoring.pointsAchieved}/</span>}
                        //     {doc.assessment.scoring.maxPoints}
                        //     {isMobileView
                        //         ? 'p'
                        //         : doc.assessment.scoring.maxPoints === 1
                        //           ? ' Punkt'
                        //           : ' Punkte'}
                        // </span>
                    }
                />
            )}
            {!doc.assessment?.scoring && <QuestionScoringHint doc={doc} />}
            {doc.isAssessed && (
                <Icon
                    path={ICONS_BY_CORRECTNESS[doc.correctness]}
                    color={IfmColors[COLORS_BY_CORRECTNESS[doc.correctness]]}
                    size={1}
                />
            )}
        </div>
    );
});

interface QuizScoreProps {
    doc: Quiz;
}

export const QuizScore = observer(({ doc }: QuizScoreProps) => {
    const isMobileView = useIsMobileView();

    if (!doc || doc.maxPoints === 0) {
        // No scoring, so we don't show anything.
        return null;
    }
    const maxPointsText = isMobileView
        ? `${doc.maxPoints}p`
        : `${doc.maxPoints} Punkt${doc.maxPoints !== 1 ? 'e' : ''}`;

    if (!doc.isAssessed) {
        return (
            <Badge type="primary" className={styles.pointsBadge}>
                {isMobileView ? `Max.: ${maxPointsText}` : `Zu erreichen: ${maxPointsText}`}
            </Badge>
        );
    }
    const totalPointsAchieved = doc.assessment?.scoring?.pointsAchieved ?? 'N/A';
    return (
        <Badge type="primary" className={styles.pointsBadge}>
            {isMobileView
                ? `${totalPointsAchieved}/${maxPointsText}`
                : `Ergebnis: ${totalPointsAchieved}/${maxPointsText}`}
        </Badge>
    );
});
