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
                d="M3.27 1L2 2.27L6.22 6.5L3 9l1.63 1.27L12 16l2.1-1.63l1.43 1.43L12 18.54l-7.37-5.73L3 14.07l9 7l4.95-3.85L20.73 21L22 19.73zm16.09 9.27L21 9l-9-7l-2.91 2.27l7.87 7.88zm.45 4.73l1.19-.93l-1.43-1.43l-1.19.92z"
            />
        </svg>
    );
};

const correctAdmonition = (
    <Admonition type="success" title="Richtig" icon={<CorrectIcon />}>
        Sie haben die Frage korrekt beantwortet!
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
        case ChoiceAnswerResult.Incorrect:
            return <>{incorrectAdmonition}</>;
        case ChoiceAnswerResult.NA:
            return <>{noAnswerAdmonition}</>;
        default:
            return;
    }
});

export default QuestionGrading;
