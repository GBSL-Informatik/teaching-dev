import { observer } from 'mobx-react-lite';
import ChoiceAnswer, { ChoiceAnswerProps } from '.';

const TrueFalseAnswer = observer((props: ChoiceAnswerProps) => {
    return (
        <ChoiceAnswer {...props}>
            {props.children}
            <ChoiceAnswer.Options>
                <ChoiceAnswer.Option optionIndex={0}>Richtig</ChoiceAnswer.Option>
                <ChoiceAnswer.Option optionIndex={1}>Falsch</ChoiceAnswer.Option>
            </ChoiceAnswer.Options>
        </ChoiceAnswer>
    );
});

export default TrueFalseAnswer;
