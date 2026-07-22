import { observer } from 'mobx-react-lite';
import React from 'react';
import { AssessableComponentProps } from '@tdev-models/documents/Assessable/AssessableMeta';
import {
    type default as TrueFalseAnswerModel,
    ModelMeta
} from '@tdev-models/documents/Assessable/TrueFalseAnswer';
import { useDocumentRootId } from '@tdev-hooks/useContextDocumentRootId';
import { useFirstDocumentBy } from '@tdev-hooks/useFirstDocumentBy';
import UnknownDocumentType from '@tdev-components/shared/Alert/UnknownDocumentType';
import QuestionCard from '../QuestionCard';
import { DocContext } from '@tdev-components/documents/DocumentContext';
import Options from '../Inputs/Options';
import Option from '../Inputs/Option';
import { action } from 'mobx';

interface BaseProps extends AssessableComponentProps<'true_false_answer'> {}

interface FalseyProps {
    isFalse?: boolean;
    incorrect?: boolean;
}

interface TruthyProps {
    isTrue?: boolean;
    correct?: boolean;
}

export type Props = BaseProps & FalseyProps & TruthyProps;

const onUpdateSelection = action((doc: TrueFalseAnswerModel, optionIndex: number, checked: boolean) => {
    if (!checked) {
        return doc.setValue(null);
    }
    doc.setValue(optionIndex === 0);
});
const TrueFalseAnswer = observer((props: Props) => {
    const [meta] = React.useState(new ModelMeta({ ...props }));
    const docRootId = useDocumentRootId(props.id);
    const doc = useFirstDocumentBy(docRootId, meta, props.qid);

    if (!doc) {
        return <UnknownDocumentType type={meta.type} />;
    }
    return (
        <QuestionCard doc={doc}>
            <DocContext.Provider value={doc}>
                <>
                    {props.children}
                    <Options>
                        <Option
                            type="true_false_answer"
                            optionIndex={0}
                            onChange={onUpdateSelection}
                            isChecked={doc.value === true}
                        >
                            Richtig
                        </Option>
                        <Option
                            type="true_false_answer"
                            optionIndex={1}
                            onChange={onUpdateSelection}
                            isChecked={doc.value === false}
                        >
                            Falsch
                        </Option>
                    </Options>
                </>
            </DocContext.Provider>
        </QuestionCard>
    );
});

export default TrueFalseAnswer;
