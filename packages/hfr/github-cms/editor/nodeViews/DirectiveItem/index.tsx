import { observer } from 'mobx-react-lite';
import type { Node } from 'prosemirror-model';
import AttributesEditor from '../../components/AttributesEditor';
import {
    directiveAttributesToRows,
    rowsToDirectiveAttributes
} from '../../components/AttributesEditor/conversions';
import NodeToolbar from '../../components/NodeToolbar';
import { directiveAttributes } from '../../markdown/serialize';
import type { NodeViewProps } from '../ReactNodeView';

const hasProps = (node: Node) => !!node.attrs.label || Object.keys(node.attrs.attributes).length > 0;

/**
 * The first item omits a `::br` without props when it is saved, it is grayed out then.
 * Whether an item is the first one is left to css: a node view is not updated when it becomes the first.
 */
export const directiveItemClassName = (node: Node) =>
    hasProps(node) ? 'cms-directive-item' : 'cms-directive-item cms-directive-item--plain';

/**
 * An item of `:::cards` or `:::flex`, the toolbar shows the `::br` it starts with.
 */
const DirectiveItem = observer(({ handle }: NodeViewProps) => {
    const { attributes } = handle.node.attrs;
    return (
        <NodeToolbar
            handle={handle}
            title={<span className="cms-item-break">{`::br${directiveAttributes(attributes)}`}</span>}
        >
            <AttributesEditor
                title="Attribute von ::br"
                rows={directiveAttributesToRows(attributes)}
                onApply={(rows) => handle.updateAttrs({ attributes: rowsToDirectiveAttributes(rows) })}
            />
        </NodeToolbar>
    );
});

export default DirectiveItem;
