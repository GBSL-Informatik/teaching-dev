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
    doc: null
} as {
    id: string;
    readonly?: boolean;
    hideQuestionNumbers?: boolean;
    doc: ChoiceAnswerDocument | null;
});

const Quiz = observer((props: Props) => {
    const [meta] = React.useState(new ModelMeta(props));
    const doc = useFirstMainDocument(props.id, meta);

    return (
        <QuizContext.Provider
            value={{
                id: props.id,
                readonly: props.readonly,
                hideQuestionNumbers: props.hideQuestionNumbers,
                doc
            }}
        >
            {props.children}
        </QuizContext.Provider>
    );
});

export default Quiz;
