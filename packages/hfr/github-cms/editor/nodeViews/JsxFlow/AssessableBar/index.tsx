import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { isChoiceAnswer, isTrueFalseAnswer } from '../../../assessable/components';
import type { NodeViewProps } from '../../ReactNodeView';
import ChoiceKind from './ChoiceKind';
import QuotedOptionsNote from './QuotedOptionsNote';
import ScoringSelect from './ScoringSelect';
import styles from './styles.module.scss';
import TrueFalseChoice from './TrueFalseChoice';

/**
 * The settings of a `<Quiz>`, `<ChoiceAnswer>` or `<TrueFalseAnswer>` most often changed:
 * the kind of choice, the correct answer of true/false questions and the scoring.
 * The correct options of a choice answer are ticked in the options, see `plugins/choiceOptions`.
 */
const AssessableBar = observer(({ handle }: NodeViewProps) => {
    return (
        // the inputs handle their events themselves, ProseMirror must not select the node
        <div className={clsx(styles.bar)} data-stop-event>
            {isChoiceAnswer(handle.node) && <ChoiceKind handle={handle} />}
            {isChoiceAnswer(handle.node) && <QuotedOptionsNote handle={handle} />}
            {isTrueFalseAnswer(handle.node) && <TrueFalseChoice handle={handle} />}
            <ScoringSelect handle={handle} />
        </div>
    );
});

export default AssessableBar;
