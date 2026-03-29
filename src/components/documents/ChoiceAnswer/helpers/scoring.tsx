import { ChoiceAnswerScoring, ChoiceAnswerCorrectness } from '@tdev-models/documents/ChoiceAnswer';
import clsx from 'clsx';

export type ScoringFunction = (
    result: ChoiceAnswerCorrectness,
    numMistakes: number
) => ChoiceAnswerScoring | undefined;

export const points: (
    forCorrect?: number,
    forIncorrect?: number,
    forUnanswered?: number
) => ScoringFunction = (forCorrect = 1, forIncorrect = 0, forUnanswered = 0) => {
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
    const template: ChoiceAnswerScoring = {
        maxPoints: forCorrect,
        pointsAchieved: 0,
        scoringHint
    };

    return (result) => {
        switch (result) {
            case ChoiceAnswerCorrectness.Correct:
                return { ...template, pointsAchieved: forCorrect };
            case ChoiceAnswerCorrectness.PartiallyCorrect:
            case ChoiceAnswerCorrectness.Incorrect:
                return { ...template, pointsAchieved: forIncorrect };
            case ChoiceAnswerCorrectness.NA:
                return { ...template, pointsAchieved: forUnanswered };
            default:
                console.warn(
                    `Unhandled correctness type '${result}' in points() scoring function. This should not happen.`
                );
                return { ...template };
        }
    };
};

export const multipleChoicePoints = (
    maxPoints: number,
    deductionPerWrongChoice: number,
    allowNegativeTotal: boolean = false
) => {
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
            {allowNegativeTotal && (
                <li>
                    Die Gesamtpunktzahl <b>kann negativ sein</b>.
                </li>
            )}
            {!allowNegativeTotal && (
                <li>
                    Die Gesamtpunktzahl kann <b>nicht</b> negativ sein.
                </li>
            )}
        </ul>
    );

    return (_: ChoiceAnswerCorrectness, numMistakes: number) => {
        const points = maxPoints - numMistakes * deductionPerWrongChoice;
        const finalPoints = allowNegativeTotal ? points : Math.max(points, 0);
        return {
            maxPoints,
            pointsAchieved: finalPoints,
            scoringHint
        };
    };
};

export const noPoints = () => {
    return () => undefined;
};
