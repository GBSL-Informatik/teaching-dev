import { useFirstMainDocument } from '@tdev-hooks/useFirstMainDocument';
import { ModelMeta } from '@tdev-models/documents/ChoiceAnswer';
import { observer } from 'mobx-react-lite';
import React from 'react';
import ChoiceAnswerDocument from '@tdev-models/documents/ChoiceAnswer';
import UnknownDocumentType from '@tdev-components/shared/Alert/UnknownDocumentType';
import { isBrowser } from 'es-toolkit';
import Loader from '@tdev-components/Loader';
import { createRandomOrderMap } from './helpers';
import styles from './styles.module.scss';

interface Props {
    id: string;
    readonly?: boolean;
    hideQuestionNumbers?: boolean;
    randomizeOptions?: boolean;
    randomizeQuestions?: boolean;
    numQuestions: number;
    children?: React.ReactNode[];
}

export const QuizContext = React.createContext({
    id: '',
    readonly: false,
    hideQuestionNumbers: false,
    randomizeQuestions: false,
    questionOrder: null,
    randomizeOptions: false,
    focussedQuestion: 0,
    doc: null
} as {
    id: string;
    readonly?: boolean;
    hideQuestionNumbers?: boolean;
    randomizeQuestions?: boolean;
    questionOrder: { [originalQuestionIndex: number]: number } | null;
    randomizeOptions?: boolean;
    focussedQuestion: number;
    setFocussedQuestion?: (index: number) => void;
    doc: ChoiceAnswerDocument | null;
});

const Quiz = observer((props: Props) => {
    const [meta] = React.useState(new ModelMeta(props));
    const doc = useFirstMainDocument(props.id, meta);

    const [focussedQuestion, setFocussedQuestion] = React.useState(0);

    React.useEffect(() => {
        if (props.randomizeQuestions && !doc?.data.questionOrder) {
            doc?.updateQuestionOrder(createRandomOrderMap(props.numQuestions));
        }
    }, [props.randomizeQuestions, doc, props.numQuestions]);

    if (!doc) {
        return <UnknownDocumentType type={meta.type} />;
    }

    if (!isBrowser) {
        return <Loader />;
    }

    return (
        <QuizContext.Provider
            value={{
                id: props.id,
                readonly: props.readonly,
                hideQuestionNumbers: props.hideQuestionNumbers,
                randomizeQuestions: props.randomizeQuestions,
                questionOrder: doc.data.questionOrder,
                randomizeOptions: props.randomizeOptions,
                focussedQuestion: focussedQuestion,
                setFocussedQuestion: setFocussedQuestion,
                doc
            }}
        >
            <div className={styles.quizContainer}>{props.children}</div>
        </QuizContext.Provider>
    );
});

export default Quiz;
