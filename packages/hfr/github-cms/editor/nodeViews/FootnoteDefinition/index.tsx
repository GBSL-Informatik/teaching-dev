import { observer } from 'mobx-react-lite';
import NodeToolbar from '../../components/NodeToolbar';
import type { NodeViewProps } from '../ReactNodeView';

const FootnoteDefinition = observer(({ handle }: NodeViewProps) => {
    return <NodeToolbar handle={handle} title={`[^${handle.node.attrs.label}]:`} />;
});

export default FootnoteDefinition;
