import { useFirstMainDocument } from '@tdev-hooks/useFirstMainDocument';
import { ModelMeta } from '@tdev-models/documents/Assessable/ChoiceAnswer';
import { observer } from 'mobx-react-lite';
import React from 'react';
import ChoiceAnswerDocument from '@tdev-models/documents/Assessable/ChoiceAnswer';
import UnknownDocumentType from '@tdev-components/shared/Alert/UnknownDocumentType';
import Loader from '@tdev-components/Loader';
import { createRandomOrderMap } from '../helpers/shared';
import styles from './styles.module.scss';
import { QuizControls } from '../Controls';
import { QuizScore } from '../Feedback';
import useIsBrowser from '@docusaurus/useIsBrowser';
import { DocumentRootIdContext } from '@tdev-hooks/useContextDocumentRootId';
import { AssessableComponentProps } from '@tdev-models/documents/Assessable/AssessableMeta';

export interface Props extends AssessableComponentProps<'quiz'> {
    id: string;
    qid: never;
    questionIds: string[];
    hideQuestionNumbers?: boolean;
    randomizeOptions?: boolean;
    randomizeQuestions?: boolean;
    minPoints?: number;
}

const Quiz = observer((props: Props) => {
    const [meta] = React.useState(new ModelMeta(props));
    const doc = useFirstMainDocument(props.id, meta);
    const isBrowser = useIsBrowser();

    const [focussedQuestion, setFocussedQuestion] = React.useState(0);

    // React.useEffect(() => {
    //     if (props.randomizeQuestions && !doc?.data.questionOrder) {
    //         doc?.updateQuestionOrder(createRandomOrderMap(props.questionCount));
    //     }
    // }, [props.randomizeQuestions, doc, props.questionCount]);

    if (!doc) {
        return <UnknownDocumentType type={meta.type} />;
    }

    if (!isBrowser) {
        return <Loader />;
    }

    return (
        // <QuizContext.Provider
        //     value={{
        //         doc,
        //         id: props.id,
        //         readonly: props.readonly,
        //         hideQuestionNumbers: props.hideQuestionNumbers,
        //         randomizeQuestions: props.randomizeQuestions,
        //         questionOrder: doc.data.questionOrder,
        //         randomizeOptions: props.randomizeOptions,
        //         scoring: props.scoring,
        //         focussedQuestion: focussedQuestion,
        //         setFocussedQuestion: setFocussedQuestion
        //     }}
        // >
        <DocumentRootIdContext id={props.id}>
            <div className={styles.content}>{props.children}</div>
            <div className={styles.footer}>
                <QuizScore doc={doc} minPoints={props.minPoints} />
                <QuizControls doc={doc} />
            </div>
        </DocumentRootIdContext>
        // </QuizContext.Provider>
    );
});

export default Quiz;
