import { useFirstMainDocument } from '@tdev-hooks/useFirstMainDocument';
import { ModelMeta } from '@tdev-models/documents/ChoiceAnswer';
import { observer } from 'mobx-react-lite';
import React from 'react';
import ChoiceAnswerDocument from '@tdev-models/documents/ChoiceAnswer';

interface Props {
    id: string;
    readonly?: boolean;
    hideQuestionNumbers?: boolean;
    children?: React.ReactNode[];
}

export const QuizContext = React.createContext({
    id: '',
    readonly: false,
    hideQuestionNumbers: false,
    focussedQuestion: 0,
    doc: null
} as {
    id: string;
    readonly?: boolean;
    hideQuestionNumbers?: boolean;
    focussedQuestion: number;
    setFocussedQuestion?: (index: number) => void;
    doc: ChoiceAnswerDocument | null;
});

const Quiz = observer((props: Props) => {
    const [meta] = React.useState(new ModelMeta(props));
    const doc = useFirstMainDocument(props.id, meta);

    const [focussedQuestion, setFocussedQuestion] = React.useState(0);

    return (
        <QuizContext.Provider
            value={{
                id: props.id,
                readonly: props.readonly,
                hideQuestionNumbers: props.hideQuestionNumbers,
                focussedQuestion: focussedQuestion,
                setFocussedQuestion: setFocussedQuestion,
                doc
            }}
        >
            {props.children}
        </QuizContext.Provider>
    );
});

export default Quiz;
