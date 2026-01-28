import { useFirstMainDocument } from '@tdev-hooks/useFirstMainDocument';
import { ModelMeta } from '@tdev-models/documents/ChoiceAnswer';
import { observer } from 'mobx-react-lite';
import React from 'react';

interface ChoiceAnswerProps {
    id: string;
    index?: number;
    multiple?: boolean;
    readonly?: boolean;
    children: React.ReactNode;
}

const createInputOptions = (
    optionsList: React.ReactNode[] | undefined,
    multiple: boolean | undefined,
    id: string
): React.ReactNode[] => {
    return (optionsList || []).map((option, index) => {
        const optionId = `${id}-option-${index}`;
        return (
            <div key={optionId}>
                <input type={multiple ? 'checkbox' : 'radio'} id={optionId} name={id} value={optionId} />
                <label htmlFor={optionId}>{option}</label>
            </div>
        );
    });
};

type ChoiceAnswerSubComponents = {
    Before: React.FC<{ children: React.ReactNode }>;
    Options: React.FC<{ children: React.ReactNode }>;
    After: React.FC<{ children: React.ReactNode }>;
};

const ChoiceAnswer = observer((props: ChoiceAnswerProps) => {
    const [meta] = React.useState(new ModelMeta(props));
    const doc = useFirstMainDocument(props.id, meta);

    const childrenArray = React.Children.toArray(props.children);
    const beforeBlock = childrenArray.find(
        (child) => React.isValidElement(child) && child.type === ChoiceAnswer.Before
    );
    const optionsBlock = childrenArray.find(
        (child) => React.isValidElement(child) && child.type === ChoiceAnswer.Options
    );
    const afterBlock = childrenArray.find(
        (child) => React.isValidElement(child) && child.type === ChoiceAnswer.After
    );

    return <div>{props.children}</div>;
}) as React.FC<ChoiceAnswerProps> & ChoiceAnswerSubComponents;

ChoiceAnswer.Before = ({ children }: { children: React.ReactNode }) => {
    return <>{children}</>;
};
ChoiceAnswer.Options = ({ children }: { children: React.ReactNode }) => {
    return <>{children}</>;
};
ChoiceAnswer.After = ({ children }: { children: React.ReactNode }) => {
    return <>{children}</>;
};

export default ChoiceAnswer;
