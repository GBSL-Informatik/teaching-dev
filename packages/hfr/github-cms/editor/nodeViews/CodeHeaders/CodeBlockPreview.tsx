import { observer } from 'mobx-react-lite';
import MermaidPreview from '../MermaidPreview';
import type { NodeViewProps } from '../ReactNodeView';
import { isMermaid } from './codeBlock';

/** only mermaid diagrams have a preview */
const CodeBlockPreview = observer(({ handle }: NodeViewProps) => {
    if (!isMermaid(handle.node)) {
        return null;
    }
    return <MermaidPreview code={handle.node.textContent} />;
});

export default CodeBlockPreview;
