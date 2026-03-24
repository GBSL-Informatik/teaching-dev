import {
    ChoiceAnswerAssessment,
    ChoiceAnswerScoring,
    ChoiceAnswerCorrectness
} from '@tdev-models/documents/ChoiceAnswer';
import ChoiceAnswerDocument from '@tdev-models/documents/ChoiceAnswer';
import clsx from 'clsx';
import _ from 'es-toolkit/compat';

export type GradingFunction = (result: ChoiceAnswerCorrectness, numMistakes: number) => ChoiceAnswerScoring;

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
    const template: ChoiceAnswerScoring = {
        maxPoints: forCorrect,
        pointsAchieved: 0,
        scoringHint: gradingHint
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
                    `Unhandled grading result '${result}' in points() grading function. This should not happen.`
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
    const gradingHint = () => (
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
            gradingHint
        };
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
    const grading: ChoiceAnswerAssessment = {
        correctness: ChoiceAnswerCorrectness.NA
    };
    if (multiple) {
        const selectedOptions = new Set(doc.choices[questionIndex] || []);
        const numCorrectDecisions = _.range(0, numOptions).filter((optionIndex) => {
            const isCorrect = correctOptions.has(optionIndex + 1); // +1 since optionIndex is 0-based, but correct[] is 1-based for better readability.
            const isSelected = selectedOptions.has(optionIndex);
            return (isCorrect && isSelected) || (!isCorrect && !isSelected);
        }).length;
        numMistakes = numOptions - numCorrectDecisions;

        grading.correctness =
            numCorrectDecisions === numOptions
                ? ChoiceAnswerCorrectness.Correct
                : numCorrectDecisions > 0
                  ? ChoiceAnswerCorrectness.PartiallyCorrect
                  : ChoiceAnswerCorrectness.Incorrect;
    } else {
        if (correctOptions.size === 0) {
            console.warn(
                `Question ${questionIndex} has an empty list of correct options. This is not allowed for single-choice questions and may lead to unexpected grading results (no options selected = question not answered).`
            );
        }
        const selectedOption = doc?.choices[questionIndex]?.[0];
        if (selectedOption === undefined) {
            grading.correctness = ChoiceAnswerCorrectness.NA;
        } else {
            grading.correctness = correctOptions.has(selectedOption + 1) // +1 since optionIndex is 0-based, but correct[] is 1-based for better readability.
                ? ChoiceAnswerCorrectness.Correct
                : ChoiceAnswerCorrectness.Incorrect;
        }
    }

    if (gradingFunction) {
        grading.scoring = gradingFunction(grading.correctness, numMistakes) ?? undefined;
    }

    return grading;
};
