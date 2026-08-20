import { AssessableType } from '@tdev-api/document';
import { ScoringFunction } from '@tdev-models/documents/Assessable/AssessableMeta';
import { Correctness, Scoring } from '@tdev-models/documents/Assessable/iAssessable';
import clsx from 'clsx';

export const points: (
    forCorrect?: number,
    forIncorrect?: number,
    forUnanswered?: number
) => ScoringFunction<AssessableType> = (maxPoints = 1, forIncorrect = 0, forUnanswered = 0) => {
    const scoringHint = () => (
        <ul>
            <li>
                <span className={clsx('badge badge--success')}>{maxPoints}</span>{' '}
                {maxPoints === 1 ? 'Punkt' : 'Punkte'} wenn richtig
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
        maxPoints,
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
        const { hits, misses, maxHits } = ca;
        if (hits + misses > 1) {
            const msg = `The points() scoring function is not suitable for questions with multiple answers. Please use multipleChoicePoints() instead! documentId: ${ca.id}, rootId: ${ca.documentRootId}, type: ${ca.type}, hits: ${hits}, misses: ${misses}, maxHits: ${maxHits}`;
            if (process.env.NODE_ENV === 'development') {
                throw new Error(msg);
            }
            console.warn(msg);
            return {
                correctness: Correctness.NA,
                scoring: template
            };
        }
        const points = hits === 1 ? maxPoints : misses === 1 ? forIncorrect : forUnanswered;
        const correctness =
            points === maxPoints
                ? Correctness.Correct
                : ca.isNA
                  ? Correctness.NA
                  : points <= 0
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
                : model.isNA
                  ? Correctness.NA
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
