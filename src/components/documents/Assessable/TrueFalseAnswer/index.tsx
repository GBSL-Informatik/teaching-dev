import { observer } from 'mobx-react-lite';
import React from 'react';
import { AssessableComponentProps } from '@tdev-models/documents/Assessable/AssessableMeta';
import { ModelMeta } from '@tdev-models/documents/Assessable/TrueFalseAnswer';
import { useDocumentRootId } from '@tdev-hooks/useContextDocumentRootId';
import { useFirstDocumentBy } from '@tdev-hooks/useFirstDocumentBy';
import UnknownDocumentType from '@tdev-components/shared/Alert/UnknownDocumentType';

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

const TrueFalseAnswer = observer((props: Props) => {
    const [meta] = React.useState(new ModelMeta({ ...props }));
    const docRootId = useDocumentRootId(props.id);
    const doc = useFirstDocumentBy(docRootId, meta, props.qid);

    if (!doc) {
        return <UnknownDocumentType type={meta.type} />;
    }
    return (
        // <ChoiceAnswer {...props} randomizeOptions={false} correct={correct}>
        <>{props.children}</>
        //     <ChoiceAnswer.Options>
        //         <ChoiceAnswer.Option optionIndex={0}>Richtig</ChoiceAnswer.Option>
        //         <ChoiceAnswer.Option optionIndex={1}>Falsch</ChoiceAnswer.Option>
        //     </ChoiceAnswer.Options>
        // </ChoiceAnswer>
    );
});

export default TrueFalseAnswer;
