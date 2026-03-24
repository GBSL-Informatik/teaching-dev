import {
    mdiCheckCircleOutline,
    mdiCloseCircleOutline,
    mdiHelpCircleOutline,
    mdiProgressCheck,
    mdiProgressQuestion
} from '@mdi/js';
import Icon from '@mdi/react';
import ChoiceAnswerDocument, { ChoiceAnswerCorrectness } from '@tdev-models/documents/ChoiceAnswer';
import Admonition from '@theme/Admonition';
import { observer } from 'mobx-react-lite';
import styles from './styles.module.scss';
import React from 'react';
import clsx from 'clsx';
import { QuestionScoringHint } from '../Hints';

const CorrectIcon = (): React.JSX.Element => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <path
                fill="currentColor"
                d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10s10-4.5 10-10S17.5 2 12 2m0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8s8 3.59 8 8s-3.59 8-8 8m4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4l8-8z"
            />
        </svg>
    );
};

const PartiallyCorrectIcon = (): React.JSX.Element => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <path
                fill="currentColor"
                d="M13 2.03v2.02c4.39.54 7.5 4.53 6.96 8.92c-.46 3.64-3.32 6.53-6.96 6.96v2c5.5-.55 9.5-5.43 8.95-10.93c-.45-4.75-4.22-8.5-8.95-8.97m-2 .03c-1.95.19-3.81.94-5.33 2.2L7.1 5.74c1.12-.9 2.47-1.48 3.9-1.68zM4.26 5.67A9.9 9.9 0 0 0 2.05 11h2c.19-1.42.75-2.77 1.64-3.9zM2.06 13c.2 1.96.97 3.81 2.21 5.33l1.42-1.43A8 8 0 0 1 4.06 13zm5.04 5.37l-1.43 1.37A10 10 0 0 0 11 22v-2a8 8 0 0 1-3.9-1.63M14.59 8L12 10.59L9.41 8L8 9.41L10.59 12L8 14.59L9.41 16L12 13.41L14.59 16L16 14.59L13.41 12L16 9.41z"
            />
        </svg>
    );
};

const IncorrectIcon = (): React.JSX.Element => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <path
                fill="currentColor"
                d="M12 20c-4.41 0-8-3.59-8-8s3.59-8 8-8s8 3.59 8 8s-3.59 8-8 8m0-18C6.47 2 2 6.47 2 12s4.47 10 10 10s10-4.47 10-10S17.53 2 12 2m2.59 6L12 10.59L9.41 8L8 9.41L10.59 12L8 14.59L9.41 16L12 13.41L14.59 16L16 14.59L13.41 12L16 9.41z"
            />
        </svg>
    );
};

const NoAnswerIcon = (): React.JSX.Element => {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <path
                fill="currentColor"
                d="M13 18h-2v-2h2zm0-3h-2c0-3.25 3-3 3-5c0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 2.5-3 2.75-3 5m9-3c0 5.18-3.95 9.45-9 9.95v-2.01c3.95-.49 7-3.86 7-7.94s-3.05-7.45-7-7.94V2.05c5.05.5 9 4.77 9 9.95M11 2.05v2.01c-1.46.18-2.8.76-3.91 1.62L5.67 4.26C7.15 3.05 9 2.25 11 2.05M4.06 11H2.05c.2-2 1-3.85 2.21-5.33L5.68 7.1A7.9 7.9 0 0 0 4.06 11M11 19.94v2.01c-2-.2-3.85-.99-5.33-2.21l1.42-1.42c1.11.86 2.45 1.44 3.91 1.62M2.05 13h2.01c.18 1.46.76 2.8 1.62 3.91l-1.42 1.42A10 10 0 0 1 2.05 13"
            />
        </svg>
    );
};

const correctAdmonition = (
    <Admonition type="note" title="Richtig" icon={<CorrectIcon />}>
        Sie haben die Frage korrekt beantwortet!
    </Admonition>
);

const partiallyCorrectAdmonition = (
    <Admonition type="note" title="Teilweise richtig" icon={<PartiallyCorrectIcon />}>
        Sie haben diese Frage teilweise richtig beantwortet.
    </Admonition>
);

const incorrectAdmonition = (
    <Admonition type="note" title="Falsch" icon={<IncorrectIcon />}>
        Sie haben diese Frage falsch beantwortet.
    </Admonition>
);

const noAnswerAdmonition = (
    <Admonition type="note" title="Keine Antwort" icon={<NoAnswerIcon />}>
        Sie haben diese Frage nicht beantwortet.
    </Admonition>
);

interface FeedbackAdmonitionProps {
    doc: ChoiceAnswerDocument;
    questionIndex: number;
}

export const FeedbackAdmonition = observer(({ doc, questionIndex }: FeedbackAdmonitionProps) => {
    if (!doc || !doc.assessed) {
        return;
    }

    const assessment = doc.assessments.get(questionIndex);
    if (!assessment) {
        return;
    }

    switch (assessment.correctness) {
        case ChoiceAnswerCorrectness.Correct:
            return <>{correctAdmonition}</>;
        case ChoiceAnswerCorrectness.PartiallyCorrect:
            return <>{partiallyCorrectAdmonition}</>;
        case ChoiceAnswerCorrectness.Incorrect:
            return <>{incorrectAdmonition}</>;
        case ChoiceAnswerCorrectness.NA:
            return <>{noAnswerAdmonition}</>;
        default:
            return;
    }
});

interface FeedbackBadgeProps {
    doc: ChoiceAnswerDocument;
    questionIndex: number;
}

export const FeedbackBadge = observer(({ doc, questionIndex }: FeedbackBadgeProps) => {
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
                            {assessment.scoring.maxPoints}{' '}
                            {assessment.scoring.maxPoints === 1 ? 'Punkt' : 'Punkte'}
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

    return (
        <span className={clsx('badge badge--primary', styles.pointsBadge)}>
            {!doc.assessed && <span>Zu erreichen: </span>}
            {doc.assessed && <span>Ergebnis: {totalPointsAchieved} /</span>} {totalMaxPoints}{' '}
            {totalMaxPoints === 1 ? 'Punkt' : 'Punkte'}
        </span>
    );
});
