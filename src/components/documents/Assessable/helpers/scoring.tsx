import { AssessableType } from '@tdev-api/document';
import { ScoringFunction } from '@tdev-models/documents/Assessable/AssessableMeta';
import { Correctness, Scoring } from '@tdev-models/documents/Assessable/iAssessable';
import clsx from 'clsx';

export const points: (
    forCorrect?: number,
    forIncorrect?: number,
    forUnanswered?: number
) => ScoringFunction<AssessableType> = (forCorrect = 1, forIncorrect = 0, forUnanswered = 0) => {
    const scoringHint = () => (
        <ul>
            <li>
                <span className={clsx('badge badge--success')}>{forCorrect}</span>{' '}
                {forCorrect === 1 ? 'Punkt' : 'Punkte'} wenn richtig
            </li>
            <li>
                <span className={clsx('badge badge--danger')}>{forIncorrect}</span>{' '}
                {forIncorrect === 1 ? 'Punkt' : 'Punkte'} wenn falsch{' '}
            </li>
            <li>
                <span className={clsx('badge badge--secondary')}>{forUnanswered}</span>{' '}
                {forUnanswered === 1 ? 'Punkt' : 'Punkte'} wenn nicht beantwortet
            </li>
        </ul>
    );
    const template: Scoring = {
        maxPoints: forCorrect,
        pointsAchieved: 0,
        scoringHint
    };
    return (ca) => {
        if (!ca.isAssessed) {
            return {
                correctness: Correctness.NA,
                scoring: template
            };
        }
        const { hits: achievements, misses: mistakes, maxHits: maxPoints } = ca;
        if (achievements + mistakes > 1) {
            throw new Error(
                `The points() scoring function is not suitable for questions with multiple answers. Please use multipleChoicePoints() instead! ${ca.id}`
            );
        }
        const points = achievements === 1 ? forCorrect : mistakes === 1 ? forIncorrect : forUnanswered;
        const correctness =
            points === forCorrect
                ? Correctness.Correct
                : points === 0
                  ? Correctness.Incorrect
                  : Correctness.PartiallyCorrect;
        return {
            correctness: correctness,
            scoring: { ...template, pointsAchieved: points }
        };
    };
};

export const multipleChoicePoints: (
    maxPoints: number,
    deductionPerWrongChoice: number,
    allowNegativeTotal: boolean
) => ScoringFunction<AssessableType> = (maxPoints, deductionPerWrongChoice, allowNegativeTotal = false) => {
    const scoringHint = () => (
        <ul>
            <li>
                <span className={clsx('badge badge--success')}>{maxPoints}</span>{' '}
                {maxPoints === 1 ? 'Punkt' : 'Punkte'} wenn alle Antworten richtig sind
            </li>
            <li>
                <span className={clsx('badge badge--danger')}>{deductionPerWrongChoice}</span>{' '}
                {deductionPerWrongChoice === 1 ? 'Punkt' : 'Punkte'} Abzug pro falscher Auswahl /
                Nicht-Auswahl
            </li>
            {allowNegativeTotal ? (
                <li>
                    Die Gesamtpunktzahl <b>kann negativ sein</b>.
                </li>
            ) : (
                <li>
                    Die Gesamtpunktzahl kann <b>nicht</b> negativ sein.
                </li>
            )}
        </ul>
    );

    return (model) => {
        if (!model.isAssessed) {
            return {
                correctness: Correctness.NA,
                scoring: { maxPoints, pointsAchieved: 0, scoringHint }
            };
        }
        if (model.hits === 0 && model.misses === 0) {
            // No answers selected
            return {
                correctness: Correctness.NA,
                scoring: { maxPoints, pointsAchieved: 0, scoringHint }
            };
        }

        const points = maxPoints - model.misses * deductionPerWrongChoice;
        const finalPoints = allowNegativeTotal ? points : Math.max(points, 0);
        const correctness =
            points === maxPoints
                ? Correctness.Correct
                : points === 0
                  ? Correctness.Incorrect
                  : Correctness.PartiallyCorrect;
        return {
            correctness: correctness,
            scoring: { maxPoints, pointsAchieved: finalPoints, scoringHint }
        };
    };
};

export const noPoints = () => {
    return () => undefined;
};
