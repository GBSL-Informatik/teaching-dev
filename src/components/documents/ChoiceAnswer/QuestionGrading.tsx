import { mdiCheckCircle, mdiCheckCircleOutline } from '@mdi/js';
import ChoiceAnswerDocument, { ChoiceAnswerResult } from '@tdev-models/documents/ChoiceAnswer';
import Admonition from '@theme/Admonition';
import { divide } from 'es-toolkit/compat';
import { observer } from 'mobx-react-lite';

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
                d="M11 15.5h1.5V17H11zm1-8.55c2.7.11 3.87 2.83 2.28 4.86c-.42.5-1.09.83-1.43 1.26c-.35.43-.35.93-.35 1.43H11c0-.85 0-1.56.35-2.06c.33-.5 1-.8 1.42-1.13c1.23-1.13.91-2.72-.77-2.85c-.82 0-1.5.67-1.5 1.51H9c0-1.67 1.35-3.02 3-3.02M12 2c-.5 0-1 .19-1.41.59l-8 8c-.79.78-.79 2.04 0 2.82l8 8c.78.79 2.04.79 2.82 0l8-8c.79-.78.79-2.04 0-2.82l-8-8C13 2.19 12.5 2 12 2m0 2l8 8l-8 8l-8-8Z"
            />
        </svg>
    );
};

const correctAdmonition = (
    <Admonition type="success" title="Richtig" icon={<CorrectIcon />}>
        Sie haben die Frage korrekt beantwortet!
    </Admonition>
);

const partiallyCorrectAdmonition = (
    <Admonition type="warning" title="Teilweise richtig" icon={<PartiallyCorrectIcon />}>
        Sie haben diese Frage teilweise richtig beantwortet.
    </Admonition>
);

const incorrectAdmonition = (
    <Admonition type="danger" title="Falsch" icon={<IncorrectIcon />}>
        Sie haben diese Frage falsch beantwortet.
    </Admonition>
);

const noAnswerAdmonition = (
    <Admonition type="info" title="Keine Antwort" icon={<NoAnswerIcon />}>
        Sie haben diese Frage nicht beantwortet.
    </Admonition>
);

interface Props {
    doc: ChoiceAnswerDocument;
    questionIndex: number;
}

// TODO: Should the grading decide its own visibility? Will quizzes prevent the entire grading, or just the result display?
const QuestionGrading = observer(({ doc, questionIndex }: Props) => {
    if (!doc || !doc.graded) {
        return;
    }

    const grading = doc.gradings[questionIndex];
    if (!grading) {
        return;
    }

    switch (grading.result) {
        case ChoiceAnswerResult.Correct:
            return <>{correctAdmonition}</>;
        case ChoiceAnswerResult.PartiallyCorrect:
            return <>{partiallyCorrectAdmonition}</>;
        case ChoiceAnswerResult.Incorrect:
            return <>{incorrectAdmonition}</>;
        case ChoiceAnswerResult.NA:
            return <>{noAnswerAdmonition}</>;
        default:
            return;
    }
});

export default QuestionGrading;
