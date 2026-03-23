import {
    ChoiceAnswerGrading,
    ChoiceAnswerPoints,
    ChoiceAnswerResult
} from '@tdev-models/documents/ChoiceAnswer';
import ChoiceAnswerDocument from '@tdev-models/documents/ChoiceAnswer';
import clsx from 'clsx';
import _ from 'es-toolkit/compat';

export type GradingFunction = (result: ChoiceAnswerResult, numMistakes: number) => ChoiceAnswerPoints;

export const points: (
    forCorrect?: number,
    forIncorrect?: number,
    forUnanswered?: number
) => GradingFunction = (forCorrect = 1, forIncorrect = 0, forUnanswered = 0) => {
    const gradingHint = () => (
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
    const template: ChoiceAnswerPoints = {
        maxPoints: forCorrect,
        pointsAchieved: 0,
        gradingHint
    };

    return (result) => {
        switch (result) {
            case ChoiceAnswerResult.Correct:
                return { ...template, pointsAchieved: forCorrect };
            case ChoiceAnswerResult.PartiallyCorrect:
            case ChoiceAnswerResult.Incorrect:
                return { ...template, pointsAchieved: forIncorrect };
            case ChoiceAnswerResult.NA:
                return { ...template, pointsAchieved: forUnanswered };
            default:
                console.warn(
                    `Unhandled grading result '${result}' in points() grading function. This should not happen.`
                );
                return { ...template };
        }
    };
};

export const partialPoints = (points: { [key: number]: number }) => {
    // TODO: Implement.
    return (result: ChoiceAnswerResult, numMistakes: number) => {
        return undefined;
    };
};

export const noPoints = () => {
    return () => undefined;
};

export const updateGrading = (
    doc: ChoiceAnswerDocument,
    multiple: boolean,
    questionIndex: number,
    correctOptions: Set<number>,
    numOptions: number,
    gradingFunction?: GradingFunction
) => {
    let numMistakes = 0;
    const grading: ChoiceAnswerGrading = {
        result: ChoiceAnswerResult.NA
    };
    if (multiple) {
        const selectedOptions = new Set(doc.choices[questionIndex] || []);
        if (selectedOptions.size > 0) {
            const numCorrectDecisions = _.range(0, numOptions).filter((optionIndex) => {
                const isCorrect = correctOptions.has(optionIndex + 1); // +1 since optionIndex is 0-based, but correct[] is 1-based for better readability.
                const isSelected = selectedOptions.has(optionIndex);
                return (isCorrect && isSelected) || (!isCorrect && !isSelected);
            }).length;
            numMistakes = numOptions - numCorrectDecisions;

            grading.result =
                numCorrectDecisions === numOptions
                    ? ChoiceAnswerResult.Correct
                    : numCorrectDecisions > 0
                      ? ChoiceAnswerResult.PartiallyCorrect
                      : ChoiceAnswerResult.Incorrect;
        }
    } else {
        const selectedOption = doc?.choices[questionIndex]?.[0];
        if (selectedOption === undefined) {
            grading.result = ChoiceAnswerResult.NA;
        } else {
            grading.result = correctOptions.has(selectedOption + 1) // +1 since optionIndex is 0-based, but correct[] is 1-based for better readability.
                ? ChoiceAnswerResult.Correct
                : ChoiceAnswerResult.Incorrect;
        }
    }

    if (gradingFunction) {
        grading.points = gradingFunction(grading.result, numMistakes) ?? undefined;
    }

    return grading;
};
