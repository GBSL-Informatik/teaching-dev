import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import NodeToolbar from '../../components/NodeToolbar';
import type { NodeViewProps } from '../ReactNodeView';
import styles from './styles.module.scss';

const RAW_BLOCK_TITLES: Record<string, string> = {
    mdxjsEsm: 'MDX import/export',
    mdxFlowExpression: 'MDX {Ausdruck}',
    html: 'HTML',
    definition: 'Link-Definition',
    /** inserted with the insert menu, not an mdast type */
    mdx: 'MDX'
};

const RawBlockHeader = observer(({ handle }: NodeViewProps) => {
    const { kind } = handle.node.attrs;
    return (
        <NodeToolbar
            handle={handle}
            actionsWhenActive
            title={RAW_BLOCK_TITLES[kind] ?? kind}
            className={clsx(styles.header)}
        />
    );
});

export default RawBlockHeader;
