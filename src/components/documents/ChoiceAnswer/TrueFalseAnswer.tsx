import { observer } from 'mobx-react-lite';
import ChoiceAnswer, { ChoiceAnswerProps } from '.';
import React from 'react';

const TrueFalseAnswer = observer((props: ChoiceAnswerProps) => {
    return (
        <ChoiceAnswer {...props} randomizeOptions={false}>
            <ChoiceAnswer.Before>{props.children}</ChoiceAnswer.Before>
            <ChoiceAnswer.Options>
                <ChoiceAnswer.Option optionIndex={0}>Richtig</ChoiceAnswer.Option>
                <ChoiceAnswer.Option optionIndex={1}>Falsch</ChoiceAnswer.Option>
            </ChoiceAnswer.Options>
        </ChoiceAnswer>
    );
});

export default TrueFalseAnswer;
