import ChoiceAnswerDocument, {
    ChoiceAnswerAssessment,
    ChoiceAnswerCorrectness
} from '@tdev-models/documents/ChoiceAnswer';
import { ScoringFunction } from './scoring';
import _ from 'es-toolkit/compat';

export const assess = (
    doc: ChoiceAnswerDocument,
    multiple: boolean,
    questionIndex: number,
    correctOptions: Set<number>,
    numOptions: number,
    scoringFunction?: ScoringFunction
) => {
    let numMistakes = 0;
    const assessment: ChoiceAnswerAssessment = {
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

        assessment.correctness =
            numCorrectDecisions === numOptions
                ? ChoiceAnswerCorrectness.Correct
                : numCorrectDecisions > 0
                  ? ChoiceAnswerCorrectness.PartiallyCorrect
                  : ChoiceAnswerCorrectness.Incorrect;
    } else {
        if (correctOptions.size === 0) {
            console.warn(
                `Question ${questionIndex} has an empty list of correct options. This is not allowed for single-choice questions and may lead to unexpected assessment results (no options selected = question not answered).`
            );
        }
        const selectedOption = doc?.choices[questionIndex]?.[0];
        if (selectedOption === undefined) {
            assessment.correctness = ChoiceAnswerCorrectness.NA;
        } else {
            assessment.correctness = correctOptions.has(selectedOption + 1) // +1 since optionIndex is 0-based, but correct[] is 1-based for better readability.
                ? ChoiceAnswerCorrectness.Correct
                : ChoiceAnswerCorrectness.Incorrect;
        }
    }

    if (scoringFunction) {
        assessment.scoring = scoringFunction(assessment.correctness, numMistakes) ?? undefined;
    }

    return assessment;
};
