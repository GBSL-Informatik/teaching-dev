import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { isChoiceAnswer, isTrueFalseAnswer } from '../../../assessable/components';
import type { NodeViewProps } from '../../ReactNodeView';
import AttributeOptions from './AttributeOptions';
import ChoiceKind from './ChoiceKind';
import QuotedOptionsNote from './QuotedOptionsNote';
import styles from './styles.module.scss';
import TrueFalseChoice from './TrueFalseChoice';

interface Props extends NodeViewProps {
    className?: string;
}

/**
 * The settings of a `<Quiz>`, `<ChoiceAnswer>` or `<TrueFalseAnswer>`: the kind of choice and the
 * correct answer of true/false questions, the scoring and other attributes in the options dropdown.
 * The correct options of a choice answer are ticked in the options, see `plugins/choiceOptions`.
 */
const AssessableBar = observer(({ handle, className }: Props) => {
    return (
        // the inputs handle their events themselves, ProseMirror must not select the node
        <div className={clsx(styles.bar, className)} data-stop-event>
            {isChoiceAnswer(handle.node) && <ChoiceKind handle={handle} />}
            {isChoiceAnswer(handle.node) && <QuotedOptionsNote handle={handle} />}
            {isTrueFalseAnswer(handle.node) && <TrueFalseChoice handle={handle} />}
            <AttributeOptions handle={handle} />
        </div>
    );
});

export default AssessableBar;
