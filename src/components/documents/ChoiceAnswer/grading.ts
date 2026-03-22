import { ChoiceAnswerGrading, ChoiceAnswerResult } from '@tdev-models/documents/ChoiceAnswer';
import ChoiceAnswerDocument from '@tdev-models/documents/ChoiceAnswer';
import _ from 'es-toolkit/compat';

export type GradingFunction = (grading: ChoiceAnswerGrading) => number;

export const points: (
    forCorrect?: number,
    forIncorrect?: number,
    forUnanswered?: number
) => GradingFunction = (forCorrect = 1, forIncorrect = 0, forUnanswered = 0) => {
    return (grading: ChoiceAnswerGrading) => {
        switch (grading.result) {
            case ChoiceAnswerResult.Correct:
                return forCorrect;
            case ChoiceAnswerResult.PartiallyCorrect:
            case ChoiceAnswerResult.Incorrect:
                return forIncorrect;
            case ChoiceAnswerResult.NA:
                return forUnanswered;
            default:
                return 0;
        }
    };
};

export const partialPoints = () => {
    // TODO.
};

export const updateGrading = (
    doc: ChoiceAnswerDocument,
    multiple: boolean,
    questionIndex: number,
    correctOptions: Set<number>,
    numOptions: number
) => {
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

    return grading;
};
