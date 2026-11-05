import type { CodeType } from '@tdev-api/document';
import type iCode from '@tdev-models/documents/iCode';
import { observer } from 'mobx-react-lite';
import CommitRow from './CommitRow';
import styles from './styles.module.scss';

interface Props<T extends CodeType> {
    code: iCode<T>;
}

const CommitGraph = observer(<T extends CodeType>(props: Props<T>) => {
    const { code } = props;
    const { rows, laneCount } = code.commitGraph;
    return (
        <div className={styles.commitGraph}>
            {rows.map((row) => (
                <CommitRow key={row.node.id} code={code} row={row} laneCount={laneCount} />
            ))}
        </div>
    );
});

export default CommitGraph;
