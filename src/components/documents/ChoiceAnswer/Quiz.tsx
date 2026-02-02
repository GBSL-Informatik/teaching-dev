import { observer } from 'mobx-react-lite';
import React from 'react';

interface Props {
    id: string;
    readonly?: boolean;
    hideQuestionNumbers?: boolean;
    children?: React.ReactNode[];
}

export const QuizContext = React.createContext({
    id: '',
    readonly: false,
    hideQuestionNumbers: false
} as {
    id: string;
    readonly?: boolean;
    hideQuestionNumbers?: boolean;
});

const Quiz = observer((props: Props) => {
    return (
        <QuizContext.Provider
            value={{ id: props.id, readonly: props.readonly, hideQuestionNumbers: props.hideQuestionNumbers }}
        >
            {props.children}
        </QuizContext.Provider>
    );
});

export default Quiz;
