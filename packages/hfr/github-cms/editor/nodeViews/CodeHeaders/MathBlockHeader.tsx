import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import NodeToolbar from '../../components/NodeToolbar';
import type { NodeViewProps } from '../ReactNodeView';
import styles from './styles.module.scss';

const MathBlockHeader = observer(({ handle }: NodeViewProps) => {
    return (
        <NodeToolbar
            handle={handle}
            actionsWhenActive
            title="$$ Mathematik"
            className={clsx(styles.header)}
        />
    );
});

export default MathBlockHeader;
