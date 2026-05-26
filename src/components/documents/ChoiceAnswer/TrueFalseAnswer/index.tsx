import { observer } from 'mobx-react-lite';
import ChoiceAnswer, { ChoiceAnswerProps } from '../Component';
import React from 'react';

const TrueFalseAnswer = observer((props: ChoiceAnswerProps & { correct: boolean }) => {
    return (
        <ChoiceAnswer {...props} randomizeOptions={false} correct={props.correct ? [1] : [2]}>
            <ChoiceAnswer.Before>{props.children}</ChoiceAnswer.Before>
            <ChoiceAnswer.Options>
                <ChoiceAnswer.Option optionIndex={0}>Richtig</ChoiceAnswer.Option>
                <ChoiceAnswer.Option optionIndex={1}>Falsch</ChoiceAnswer.Option>
            </ChoiceAnswer.Options>
        </ChoiceAnswer>
    );
});

export default TrueFalseAnswer;
