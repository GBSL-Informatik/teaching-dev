import { extractListItems } from '@tdev-components/util/domHelpers';
import { observer } from 'mobx-react-lite';
import React from 'react';

interface Props {
    children: React.ReactElement[];
    id: string;
}

const createInputOptions = (optionsList: React.ReactNode[], id: string): React.ReactNode[] => {
    return optionsList.map((option, index) => {
        const optionId = `${id}-option-${index}`;
        return (
            <div key={optionId}>
                <input type="radio" id={optionId} name={id} value={optionId} />
                <label htmlFor={optionId}>{option}</label>
            </div>
        );
    });
};

const ChoiceAnswer = observer(({ children, id }: Props) => {
    const optionsLists = children.filter((child) => !!child && (child.type === 'ol' || child.type === 'ul'));
    if (optionsLists.length !== 1) {
        throw new Error(
            'ChoiceAnswer component requires exactly one ordered or unordered list (options) as a child.'
        );
    }

    const beforeOptionsList = children.slice(0, children.indexOf(optionsLists[0]));
    const afterOptionsList = children.slice(children.indexOf(optionsLists[0]) + 1);
    const optionsList: React.ReactNode[] = extractListItems(optionsLists[0]) || [];

    return (
        <div>
            {beforeOptionsList}
            {createInputOptions(optionsList, id)}
            {afterOptionsList}
        </div>
    );
});

export default ChoiceAnswer;
