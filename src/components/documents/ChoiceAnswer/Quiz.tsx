import { observer } from 'mobx-react-lite';
import React from 'react';

interface Props {
    id: string;
    readonly?: boolean;
    children?: React.ReactNode[];
}

export const QuizContext = React.createContext({
    id: '',
    readonly: false
} as {
    id: string;
    readonly?: boolean;
});

const Quiz = observer((props: Props) => {
    return (
        <QuizContext.Provider value={{ id: props.id, readonly: props.readonly }}>
            {props.children}
        </QuizContext.Provider>
    );
});

export default Quiz;
