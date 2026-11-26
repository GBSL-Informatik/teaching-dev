import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import type { NodeViewProps } from '../../ReactNodeView';
import AssessableBar from '../AssessableBar';
import QuestionTitle from './QuestionTitle';
import styles from './styles.module.scss';

/** the header of the question card on the page, compact, with the settings most often changed */
const QuestionHeader = observer(({ handle }: NodeViewProps) => {
    return (
        <div className={clsx(styles.header)}>
            <QuestionTitle handle={handle} />
            <AssessableBar handle={handle} className={clsx(styles.bar)} />
        </div>
    );
});

export default QuestionHeader;
